import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { deploySystemWithNewBlr } from '@hashgraph/asset-tokenization-contracts/scripts';
import { Factory__factory } from '@hashgraph/asset-tokenization-contracts';
import { MAX_GAS, makeIsin } from './lib/ats';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

const MIRROR = 'https://testnet.mirrornode.hedera.com/api/v1';
// custom error selectors from ATS validators (computed via keccak of signatures below)
const ERRORS_TO_DECODE: Record<string, string> = {
  '0xdf749cc5': 'WrongISIN(string)',
  '0x342c92db': 'WrongISINChecksum(string)',
  '0x0b845f7f': 'NoInitialAdmins()',
  '0xc7c1d06d': 'RegulationTypeAndSubTypeForbidden()',
  '0x840a2011': 'EmptyResolver(address)',
  '0xd954416a': 'InvalidRole()',
  '0x2d4d7bb3': 'InvalidAdminRole()',
  '0xc8bb4843': 'BondDatesError()',
  '0x2399e16f': 'ScheduledTasksInvalidTimestamp()',
  '0xb44d1a48': 'RegulationArraysLengthMustBeEqual()'
};

async function decodeError(hex: string): Promise<string> {
  if (!hex || hex === '0x' || hex === '0x0') return 'require(false) plain revert';
  const sig = hex.slice(0, 10);
  return ERRORS_TO_DECODE[sig] ?? `unknown selector ${sig}`;
}

async function main() {
  const rpc = process.env.HEDERA_TESTNET_RPC_URL!;
  const provider = new ethers.JsonRpcProvider(rpc);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  const t0 = Date.now();
  const out = await deploySystemWithNewBlr(signer, 'hedera-testnet', {
    deployOnlyBondConfig: true,
    verifyDeployment: false,
    saveOutput: false,
    enableRetry: true
  });
  console.log('deployed in', ((Date.now() - t0) / 1000).toFixed(0), 's');
  console.log('factory  ', out.infrastructure.factory.proxy);
  console.log('blr      ', out.infrastructure.blr.proxy);
  console.log('bondCf   ', out.configurations.bond.configId, 'v' + out.configurations.bond.version);

  const factory = Factory__factory.connect(out.infrastructure.factory.proxy, signer);
  const bondCf = out.configurations.bond;

  const reg = { regulationType: 1, regulationSubType: 0, additionalSecurityData: { countriesControlListType: false, listOfCountries: '', info: '' } };

  const mk = (over: Record<string, unknown>) => ({
    security: {
      resolver: out.infrastructure.blr.proxy,
      maxSupply: 1000000n,
      resolverProxyConfiguration: { key: ethers.toBeHex(BigInt(bondCf.configId), 32), version: bondCf.version },
      erc20MetadataInfo: { name: 'Alpha', symbol: 'ALPHA', isin: makeIsin('USHYPO00001'), decimals: 0 },
      rbacs: [{ role: ethers.ZeroHash, members: [signer.address] }],
      externalPauses: [],
      externalControlLists: [],
      externalKycLists: [],
      compliance: ethers.ZeroAddress,
      identityRegistry: ethers.ZeroAddress,
      arePartitionsProtected: false,
      isMultiPartition: false,
      isControllable: true,
      isWhiteList: true,
      clearingActive: true,
      internalKycActivated: false,
      erc20VotesActivated: false,
      ...(over.security ?? {})
    },
    bondDetails: {
      currency: ethers.hexlify(ethers.toUtf8Bytes('USD')),
      nominalValue: 1000000n,
      nominalValueDecimals: 0,
      startingDate: BigInt(Math.floor(Date.now() / 1000) - 120),
      maturityDate: BigInt(Math.floor(Date.now() / 1000) + 86400 * 365),
      ...(over.bondDetails ?? {})
    },
    proceedRecipients: [],
    proceedRecipientsData: [],
    ...(over.top ?? {})
  });

  const probes: Array<[string, ReturnType<typeof mk>]> = [
    ['primary', mk({})],
    ['decimals18', mk({ security: { erc20MetadataInfo: { name: 'Alpha', symbol: 'ALPHA', isin: makeIsin('USHYPO00001'), decimals: 18 } } })],
    ['maxSupply0', mk({ security: { maxSupply: 0 } })],
    ['nbv18', mk({ bondDetails: { nominalValue: 1000000n * 10n ** 18n, nominalValueDecimals: 18 } })],
    ['clearing-off', mk({ security: { clearingActive: false } })]
  ];

  for (const [label, bd] of probes) {
    try {
      const r = await factory.deployBond.staticCall(bd, reg, { gasLimit: BigInt(MAX_GAS) });
      console.log(`PASS ${label} ->`, r);
      continue;
    } catch {
      console.log(`FAIL(static) ${label}`);
    }
    // real tx to capture revert via mirror
    try {
      const tx = await factory.deployBond(bd, reg, { gasLimit: BigInt(MAX_GAS) });
      const rcpt = await tx.wait(1);
      console.log(`  tx ${label}: status=${rcpt!.status} hash=${tx.hash}`);
    } catch (err) {
      const e = err as { transactionHash?: string; shortMessage?: string };
      console.log(`  tx ${label}: REVERTED short=${e.shortMessage?.slice(0, 120)}`);
      if (e.transactionHash) {
        const res = await fetch(`${MIRROR}/contracts/results/${e.transactionHash}`);
        const j = (await res.json()) as { result?: string; error_message?: string };
        console.log(`    mirror result=       ${j.result}`);
        console.log(`    mirror error_message= ${j.error_message}`);
        const dec = await decodeError(j.result ?? '').catch(() => '');
        console.log(`    decoded=             ${dec}`);
      }
    }
  }
}

main().catch((e) => {
  console.error('FATAL', (e as Error).message.split('\n')[0]);
  process.exitCode = 1;
});