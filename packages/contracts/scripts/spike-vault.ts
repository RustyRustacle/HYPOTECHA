import { ethers } from 'hardhat';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { PARTITION_ID_1 } from './lib/ats';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

/**
 * M0 spike (vault design):
 *  A. Verify live Chainlink price feeds on Hedera testnet (official docs addresses).
 *  B. Verify ATS hold lifecycle for the "vault" enforcement model:
 *       createHoldByPartition -> executeHoldByPartition (release-back to vault / pay claimant)
 *     NOTE: releaseHoldByPartition is expected to be FunctionNotFound (0x5416eb98) on the
 *     deployed diamonds (resolver whitelist), so execute (as escrow) is the release prim.
 *  C. Verify RegistryAnchor getInstance + eth_getLogs availability on HashIO RPC.
 */

const FEEDS: Record<string, string> = {
  'BTC/USD': '0x058fE79CB5775d4b167920Ca6036B824805A9ABd',
  'DAI/USD': '0xdA2aBF7C90aDC73CDF5cA8d720B87bD5F5863389',
  'ETH/USD': '0xb9d461e0b962aF219866aDfA7DD19C52bB9871b9',
  'HBAR/USD': '0x59bC155EB6c6C415fE43255aF66EcF0523c92B4a',
  'LINK/USD': '0xF111b70231E89D69eBC9f6C9208e9890383Ef432',
  'USDC/USD': '0xb632a7e7e02d76c0Ce99d9C62c7a2d1B5F92B6B5',
  'USDT/USD': '0x06823de8E77d708C4cB72Cbf04495D67afF4Bd37'
};

const AGGREGATOR_ABI = [
  'function decimals() external view returns (uint8)',
  'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function description() external view returns (string)'
];

const TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function createHoldByPartition(bytes32, tuple(uint256 amount,uint256 expirationTimestamp,address escrow,address to,bytes data)) returns (bool, uint256)',
  'function executeHoldByPartition(tuple(bytes32 partition,address tokenHolder,uint256 holdId), address to, uint256 amount) returns (bool, bytes32)',
  'function releaseHoldByPartition(tuple(bytes32 partition,address tokenHolder,uint256 holdId), uint256 amount) returns (bool)',
  'function reclaimHoldByPartition(tuple(bytes32 partition,address tokenHolder,uint256 holdId)) returns (bool, uint256)',
  'function getHoldForByPartition(tuple(bytes32 partition,address tokenHolder,uint256 holdId)) external view returns (uint256 amount, uint256 expirationTimestamp, address escrow, address destination, bytes data, bytes operatorData, uint8 thirdPartyType)',
  'function getHeldAmountForByPartition(bytes32, address) external view returns (uint256)',
  'function getHoldCountForByPartition(bytes32, address) external view returns (uint256)'
];

const ANCHOR_ABI = [
  'function getInstance(bytes32) view returns (tuple(bytes32 platformId, string operator, uint256 assetDiamondEntity, address assetEvm, string assetName, string assetSymbol, uint8 assetDecimals, uint256 faceValue, uint256 maturityTs, bool active))',
  'function getInstances() view returns (tuple(bytes32 platformId, string operator, uint256 assetDiamondEntity, address assetEvm, string assetName, string assetSymbol, uint8 assetDecimals, uint256 faceValue, uint256 maturityTs, bool active)[])',
  'function isRegistered(bytes32) view returns (bool)'
];

const HOLD_IDENT_TPL = 'tuple(bytes32 partition,address tokenHolder,uint256 holdId)';

interface FeedResult {
  pair: string;
  address: string;
  description?: string;
  decimals?: number;
  raw?: string;
  usd?: string;
  updatedAt?: number;
  ageSec?: number;
  stale?: boolean;
  error?: string;
}

interface HoldData {
  amount: string;
  expirationTimestamp: string;
  escrow: string;
  destination: string;
}

interface SpikeReport {
  ranAt: string;
  chainId?: string;
  feeds: FeedResult[];
  ats?: {
    token?: string;
    evm?: string;
    totalSupply?: string;
    signerBalance?: string;
    createStatic?: string;
    createdHoldId?: string;
    executeStatic?: string;
    executeToClaimantStatic?: string;
    releaseStatic?: string;
    reclaimStatic?: string;
    balanceAfterExecute?: string;
    holdRead?: HoldData | null;
    error?: string;
  };
  anchor?: unknown;
  ethGetLogs?: unknown;
}

async function main() {
  const rpc = process.env.HEDERA_TESTNET_RPC_URL ?? 'https://testnet.hashio.io/api';
  const mirror = (process.env.MIRROR_NODE_URL ?? 'https://testnet.mirrornode.hedera.com/api/v1').replace(/\/$/, '');
  const anchorAddr = (process.env.REGISTRY_ANCHOR ?? '').toLowerCase();
  const sukukEvm = (process.env.ATS_SUKUK_DIAMOND ?? '').toLowerCase();

  const provider = new ethers.JsonRpcProvider(rpc);
  const privKey = process.env.PRIVATE_KEY;
  const signer = privKey ? new ethers.Wallet(privKey, provider) : null;

  const report: SpikeReport = { ranAt: new Date().toISOString(), feeds: [] };
  try {
    report.chainId = (await provider.getNetwork()).chainId.toString();
  } catch {
    report.chainId = 'unknown';
  }
  console.log('chainId', report.chainId, '| signer', signer?.address ?? 'read-only');

  // ---------- A. Chainlink feeds ----------
  console.log('\n=== A. Chainlink price feeds (Hedera testnet) ===');
  for (const [pair, address] of Object.entries(FEEDS)) {
    const row: FeedResult = { pair, address };
    try {
      const c = new ethers.Contract(address, AGGREGATOR_ABI, provider);
      const [desc, dec, rd] = await Promise.all([c.description(), c.decimals(), c.latestRoundData()]);
      row.description = desc;
      row.decimals = Number(dec);
      row.raw = rd.answer.toString();
      const now = Math.floor(Date.now() / 1000);
      row.updatedAt = Number(rd.updatedAt);
      row.ageSec = now - Number(rd.updatedAt);
      const scalar = Math.abs(Number(rd.answer)) / 10 ** Number(dec);
      row.usd = scalar.toFixed(row.decimals);
      row.stale = (row.ageSec ?? 0) > 86400;
    } catch (e) {
      row.error = ((e as Error).message ?? String(e)).slice(0, 180);
    }
    console.log(
      `${pair.padEnd(10)} ${row.error ? 'ERR  ' + row.error : `OK   ${row.usd} USD  dec=${row.decimals}  age=${row.ageSec}s  stale=${row.stale}`}`
    );
    report.feeds.push(row);
  }

  // ---------- B. ATS vault roundtrip ----------
  console.log('\n=== B. ATS vault roundtrip (SUKUK) ===');
  report.ats = {};
  if (!sukukEvm) {
    console.log('ATS_SUKUK_DIAMOND not set, skipping');
  } else if (!signer) {
    console.log('no PRIVATE_KEY, skipping write ops');
  } else {
    const tok = new ethers.Contract(sukukEvm, TOKEN_ABI, signer);
    report.ats.token = process.env.ATS_SUKUK_TOKEN;
    report.ats.evm = sukukEvm;
    try {
      const [total, bal] = await Promise.all([tok.totalSupply(), tok.balanceOf(signer.address)]);
      report.ats.totalSupply = total.toString();
      report.ats.signerBalance = bal.toString();
      console.log('supply', total.toString(), '| signer balance', bal.toString());

      // pick the smallest of (balance, 50_000) so we never underflow the token
      const holdAmt = bal >= 50_000n ? 50_000n : bal;
      const expiration = BigInt(Math.floor(Date.now() / 1000)) + 86400n * 90n;
      const holdData = {
        amount: holdAmt,
        expirationTimestamp: expiration,
        escrow: signer.address, // stand-in for the future EncumbranceLedger vault
        to: ethers.ZeroAddress, // unconstrained destination -> release-back or pay-out
        data: '0x'
      };

      // create: staticCall first (zero gas) to prove the selector+params are valid
      try {
        const [ok] = await tok.createHoldByPartition.staticCall(PARTITION_ID_1, holdData, { gasLimit: 3_000_000n });
        report.ats.createStatic = `${ok}`;
        console.log('createHoldByPartition staticCall OK ->', ok);
      } catch (e) {
        report.ats.createStatic = 'ERR ' + ((e as Error).message ?? String(e)).slice(0, 180);
        report.ats.error = report.ats.createStatic;
        console.log('createHoldByPartition staticCall ERR ->', report.ats.createStatic);
      }

      if ((report.ats.createStatic ?? '').startsWith('ERR')) {
        // bail to part C
        writePartials(report);
        return;
      }

      // real create
      const tx = await tok.createHoldByPartition(PARTITION_ID_1, holdData, { gasLimit: 3_000_000n });
      console.log('create tx', tx.hash);
      const rc = await tx.wait();
      console.log('create status', rc?.status);

      // read holdId from mirror (call_result: bool word + uint256 word)
      const res = await fetch(`${mirror}/contracts/results/${tx.hash}`);
      let holdId: bigint | undefined;
      if (res.ok) {
        const body = (await res.json()) as { call_result?: string };
        const hex = (body.call_result ?? '').replace(/^0x/, '');
        if (hex.length >= 128) {
          const id = BigInt('0x' + hex.slice(64, 128));
          if (id > 0n) holdId = id;
        }
      }
      if (holdId === undefined) {
        // fallback: enumerate holds via getHoldCount + getHoldFor
        const count = await tok.getHoldCountByPartition?.(PARTITION_ID_1, signer.address);
        console.log('holdId fallback count', count);
      }
      report.ats.createdHoldId = holdId?.toString();
      console.log('created holdId', holdId?.toString());
      if (holdId === undefined) {
        report.ats.error = 'could not read holdId';
        writePartials(report);
        return;
      }

      const holdIdent = { partition: PARTITION_ID_1, tokenHolder: signer.address, holdId };

      // hold read-back
      try {
        const h = await tok.getHoldForByPartition(holdIdent, { gasLimit: 3_000_000n });
        report.ats.holdRead = {
          amount: h.amount.toString(),
          expirationTimestamp: h.expirationTimestamp.toString(),
          escrow: h.escrow.toLowerCase(),
          destination: h.destination.toLowerCase()
        };
        console.log('hold read-back', JSON.stringify(report.ats.holdRead));
      } catch (e) {
        console.log('getHoldFor ERR', ((e as Error).message ?? String(e)).slice(0, 120));
      }

      // release (negative control): expect FunctionNotFound 0x5416eb98
      try {
        const r = await tok.releaseHoldByPartition.staticCall(holdIdent, holdAmt, { gasLimit: 3_000_000n });
        report.ats.releaseStatic = `OK ${r}`;
        console.log('releaseHoldByPartition staticCall OK (unexpected) ->', r);
      } catch (e) {
        report.ats.releaseStatic = 'ERR ' + ((e as Error).message ?? String(e)).slice(0, 140);
        console.log('releaseHoldByPartition staticCall ERR ->', report.ats.releaseStatic);
      }

      // reclaim check (optional): should revert HoldExpirationNotReached
      try {
        const r = await tok.reclaimHoldByPartition.staticCall(holdIdent, { gasLimit: 3_000_000n });
        report.ats.reclaimStatic = `OK ${JSON.stringify(r)}`;
        console.log('reclaimHoldByPartition staticCall OK (unexpected) ->', report.ats.reclaimStatic);
      } catch (e) {
        report.ats.reclaimStatic = 'ERR ' + ((e as Error).message ?? String(e)).slice(0, 140);
        console.log('reclaimHoldByPartition staticCall ERR ->', report.ats.reclaimStatic);
      }

      // THE critical prim: execute release-back to vault
      try {
        const [ok, part] = await tok.executeHoldByPartition.staticCall(holdIdent, signer.address, holdAmt, {
          gasLimit: 3_000_000n
        });
        report.ats.executeStatic = `OK ${ok} ${part}`;
        console.log('executeHoldByPartition staticCall OK (release-back) ->', ok);
      } catch (e) {
        report.ats.executeStatic = 'ERR ' + ((e as Error).message ?? String(e)).slice(0, 140);
        console.log('executeHoldByPartition staticCall ERR ->', report.ats.executeStatic);
      }

      // execute-with-claimant (default pay-out): tokenHolder != destination triggers the
      // compliance-notify leg pointing at compliance=0x0 -> may revert. Must run while the
      // hold still exists (static only, no state change).
      const claimant = '0x000000000000000000000000000000000000dEaD';
      const payAmt = 1_000n;
      try {
        const [okP, partP] = await tok.executeHoldByPartition.staticCall(holdIdent, claimant, payAmt, {
          gasLimit: 3_000_000n
        });
        report.ats.executeToClaimantStatic = `OK ${okP} ${partP}`;
        console.log('execute-to-claimant staticCall OK (payout leg works) ->', okP);
      } catch (e) {
        report.ats.executeToClaimantStatic = 'ERR ' + ((e as Error).message ?? String(e)).slice(0, 160);
        console.log('execute-to-claimant staticCall ERR ->', report.ats.executeToClaimantStatic);
      }

      // commit the execute (release-back) so the balance is restored
      try {
        const etx = await tok.executeHoldByPartition(holdIdent, signer.address, holdAmt, { gasLimit: 3_000_000n });
        const erc = await etx.wait();
        console.log('execute (release-back) tx', etx.hash, 'status', erc?.status);
        const bal2 = await tok.balanceOf(signer.address);
        report.ats.balanceAfterExecute = bal2.toString();
        console.log('signer balance after execute', bal2.toString());
      } catch (e) {
        report.ats.error = 'execute commit failed: ' + ((e as Error).message ?? String(e)).slice(0, 160);
        console.log('execute commit ERR ->', report.ats.error);
      }
    } catch (e) {
      report.ats.error = ((e as Error).message ?? String(e)).slice(0, 200);
      console.log('B error ->', report.ats.error);
    }
  }
  writePartials(report);

  // ---------- C. RegistryAnchor + eth_getLogs ----------
  if (!anchorAddr) {
    console.log('\n=== C. skip (REGISTRY_ANCHOR not set) ===');
    writePartials(report);
    return;
  }
  console.log('\n=== C. RegistryAnchor + eth_getLogs ===');
  const anchor = new ethers.Contract(anchorAddr, ANCHOR_ABI, provider);
  try {
    const list = await anchor.getInstances();
    const mapped = list.map((it: unknown) => (it as { platformId: bigint }).platformId.toString());
    const alphas = await anchor.isRegistered(
      `0x000000000000000000000000000000000000000000000000000000616c706861`
    );
    report.anchor = { count: mapped.length, isAlphaRegistered: alphas };
    console.log('anchor instances', mapped.length, '| alpha registered', alphas);
  } catch (e) {
    report.anchor = { error: ((e as Error).message ?? String(e)).slice(0, 160) };
    console.log('anchor ERR ->', report.anchor);
  }

  try {
    const logs = await provider.getLogs({
      address: anchorAddr,
      fromBlock: 0,
      toBlock: 'latest'
    });
    report.ethGetLogs = { ok: true, count: logs.length, first: logs.slice(0, 2).map((l) => l.blockNumber) };
    console.log('eth_getLogs OK count', logs.length);
  } catch (e) {
    // fallback: mirror node contract logs
    try {
      const mres = await fetch(`${mirror}/contracts/${anchorAddr}/results/logs?limit=5`);
      const body = (await mres.json()) as { logs?: unknown[] };
      report.ethGetLogs = { mirror: { count: body.logs?.length ?? 0 } };
      console.log('eth_getLogs failed; mirror logs count', report.ethGetLogs);
    } catch (e2) {
      report.ethGetLogs = { error: ((e as Error).message ?? String(e)).slice(0, 160) };
      console.log('eth_getLogs ERR ->', report.ethGetLogs);
    }
  }

  writePartials(report);
  console.log('\nreport written to packages/contracts/scripts/.spike-vault.json');
}

function writePartials(report: SpikeReport) {
  writeFileSync(
    resolve(__dirname, '.spike-vault.json'),
    JSON.stringify(report, null, 2)
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});