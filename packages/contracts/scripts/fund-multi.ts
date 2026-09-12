import { ethers } from 'hardhat';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { PARTITION_ID_1 } from './lib/ats';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

/**
 * Multi-asset provisioning: registers and vault-funds every anchor asset except the one
 * already live (SUKUK) — BETA, GREEN, GOLD — on the deployed EncumbranceLedger.
 *
 * For each asset:
 *  1. configurePlatform(token, USDC/USD feed, threshold 10_000, interest 200, cap=face, maturity)
 *  2. signer (beneficiary) escrow-executes its whole token balance into the vault
 *     (createHoldByPartition escrow=ledger,to=ledger -> executeHoldByPartition to ledger)
 *  3. deposit() bookkeeping on the ledger
 */
const USDC_USD_FEED = '0xb632a7e7e02d76c0Ce99d9C62c7a2d1B5F92B6B5';
const GAS = 800_000n;
const TOKEN_GAS = 3_000_000n;
const MIRROR = (process.env.MIRROR_NODE_URL ?? 'https://testnet.mirrornode.hedera.com/api/v1').replace(/\/+$/, '');

const TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function createHoldByPartition(bytes32, tuple(uint256 amount,uint256 expirationTimestamp,address escrow,address to,bytes data)) returns (bool, uint256)',
  'function executeHoldByPartition(tuple(bytes32 partition,address tokenHolder,uint256 holdId), address to, uint256 amount) returns (bool, bytes32)'
];

interface PlatDeploy {
  platformId: string;
  symbol: string;
  assetEvm: string;
  faceValue: string;
  maturityTs: string;
}

interface FundTarget {
  key: string;
  symbol: string;
  platformId: string;
  evm: string;
  faceValue: bigint;
  maturityTs: bigint;
}

async function readHoldId(txHash: string): Promise<bigint | undefined> {
  try {
    const res = await fetch(`${MIRROR}/contracts/results/${txHash}`);
    if (res.ok) {
      const body = (await res.json()) as { call_result?: string };
      const hex = (body.call_result ?? '').replace(/^0x/, '');
      if (hex.length >= 128) {
        const id = BigInt('0x' + hex.slice(64, 128));
        if (id > 0n) return id;
      }
    }
  } catch {
    // fall through to undefined
  }
  return undefined;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const deploy = JSON.parse(readFileSync(resolve(__dirname, '../../deployments/testnet.json'), 'utf8')) as {
    encumbranceLedger: { address: string };
    latest: Record<string, PlatDeploy>;
  };
  const ledgerAddr = deploy.encumbranceLedger.address;
  const ledger = await ethers.getContractAt('EncumbranceLedger', ledgerAddr, deployer);

  const targets: FundTarget[] = ['ATS_BETA', 'ATS_GREEN', 'ATS_GOLD'].map((key) => {
    const d = deploy.latest[key];
    if (!d) throw new Error(`${key} missing from deployments/testnet.json`);
    return {
      key,
      symbol: d.symbol,
      platformId: d.platformId.toLowerCase(),
      evm: d.assetEvm,
      faceValue: BigInt(d.faceValue),
      maturityTs: BigInt(d.maturityTs)
    };
  });

  console.log('signer', deployer.address);
  console.log('ledger', ledgerAddr, '| targets', targets.map((t) => t.symbol).join(','));

  for (const a of targets) {
    console.log(`\n=== ${a.symbol} (${a.evm}) ===`);
    const tok = await ethers.getContractAt(TOKEN_ABI, a.evm, deployer);

    const p = await ledger.platforms(a.platformId);
    if (!p.active) {
      const tx = await ledger.configurePlatform(
        a.platformId,
        a.evm,
        USDC_USD_FEED,
        0,
        10_000n,
        200n,
        a.faceValue,
        a.maturityTs,
        { gasLimit: GAS }
      );
      const rc = await tx.wait();
      console.log('configurePlatform  ', tx.hash, 'status', rc?.status);
    } else {
      console.log('already configured (active=', p.active, 'liquidated=', p.liquidated, ')');
    }

    const bal = await tok.balanceOf(deployer.address);
    console.log('signer balance     ', bal.toString());
    if (bal === 0n) {
      console.log('SKIP: beneficiary holds no units on this diamond');
      continue;
    }

    const vaultBefore = await ledger.vaultBalanceUnits(a.platformId);
    console.log('vault balance before', vaultBefore.toString());

    if (vaultBefore === 0n) {
      const expiry = a.maturityTs; // bond maturity, always > now on testnet
      const hold = {
        amount: bal,
        expirationTimestamp: expiry,
        escrow: deployer.address,
        to: ledgerAddr,
        data: '0x'
      };

      await tok.createHoldByPartition.staticCall(PARTITION_ID_1, hold, { gasLimit: TOKEN_GAS });
      const ctx = await tok.createHoldByPartition(PARTITION_ID_1, hold, { gasLimit: TOKEN_GAS });
      const crc = await ctx.wait();
      console.log('createHold         ', ctx.hash, 'status', crc?.status);

      const holdId = await readHoldId(ctx.hash);
      if (holdId === undefined) throw new Error(`${a.symbol}: could not determine holdId`);
      console.log('holdId             ', holdId.toString());

      const ident = { partition: PARTITION_ID_1, tokenHolder: deployer.address, holdId };
      await tok.executeHoldByPartition.staticCall(ident, ledgerAddr, bal, { gasLimit: TOKEN_GAS });
      const etx = await tok.executeHoldByPartition(ident, ledgerAddr, bal, { gasLimit: TOKEN_GAS });
      const erc = await etx.wait();
      console.log('execute to vault   ', etx.hash, 'status', erc?.status);

      const vaultAfter = await tok.balanceOf(ledgerAddr);
      console.log('vault token balance', vaultAfter.toString());
      if (vaultAfter !== bal) throw new Error(`${a.symbol}: vault balance ${vaultAfter} != funded ${bal}`);
    } else {
      console.log('vault already funded; skipping transfer');
    }

    if ((await ledger.totalDeposited(a.platformId)) === 0n) {
      const dtx = await ledger.deposit(a.platformId, deployer.address, bal, { gasLimit: GAS });
      const drc = await dtx.wait();
      console.log('deposit            ', dtx.hash, 'status', drc?.status);
    }

    console.log('vaultBalanceUnits  =', (await ledger.vaultBalanceUnits(a.platformId)).toString());
    console.log('totalEncumbered    =', (await ledger.totalEncumbered(a.platformId)).toString());
    console.log('totalDeposited     =', (await ledger.totalDeposited(a.platformId)).toString());
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});