import { ethers } from 'hardhat';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { Factory__factory, IAsset__factory } from '@hashgraph/asset-tokenization-contracts';
import { MAX_GAS, PARTITION_ID_1, ROLES, makeIsin } from './lib/ats';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

type PlatformDef = {
  key: string;
  platformId: string;
  operator: string;
  symbol: string;
  name: string;
  assetHederaId: string;
  assetEvm: string;
  isin: string;
  faceValue: string;
  decimals: number;
  maturityTs: number;
  seedHoldAmount?: string;
  seedClaimantEvm?: string;
};

async function main() {
  const rpc = process.env.HEDERA_TESTNET_RPC_URL!;
  const factoryHederaId = process.env.ATS_FACTORY_ID ?? '0.0.10400788';
  const resolverHederaId = process.env.ATS_RESOLVER_ID ?? '0.0.10400497';
  const privKey = process.env.PRIVATE_KEY!;
  const expectedEvm = process.env.EVM_ADDRESS!;
  const mirror = process.env.HEDERA_MIRROR_URL ?? 'https://testnet.mirrornode.hedera.com';

  async function toHederaId(evm: string): Promise<string> {
    try {
      const res = await fetch(`${mirror}/api/v1/contracts/${evm}`);
      if (res.ok) return ((await res.json()) as { contract_id: string }).contract_id;
    } catch {
      // fall through to decimal derivation
    }
    return `0.0.${BigInt(evm).toString()}`;
  }

  async function toEvmAlias(hederaId: string): Promise<string> {
    const res = await fetch(`${mirror}/api/v1/contracts/${hederaId}`);
    if (!res.ok) throw new Error(`mirror lookup failed for ${hederaId}`);
    const body = (await res.json()) as { evm_address: string };
    if (!body.evm_address) throw new Error(`no evm_address for ${hederaId}`);
    return body.evm_address;
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  const signer = new ethers.Wallet(privKey, provider);
  const signerEvm = signer.address.toLowerCase();
  const hbarBalance = (await provider.getBalance(signerEvm)) / 100_000_000n;
  console.log('signer', signerEvm, 'expected', expectedEvm.toLowerCase(), 'hbar', hbarBalance.toString());
  if (signerEvm !== expectedEvm.toLowerCase()) {
    throw new Error('PRIVATE_KEY does not match EVM_ADDRESS in .env');
  }

  const factoryEvm = await toEvmAlias(factoryHederaId);
  const resolverEvm = await toEvmAlias(resolverHederaId);
  console.log('factory', factoryHederaId, factoryEvm);
  console.log('resolver', resolverHederaId, resolverEvm);

  const factory = Factory__factory.connect(factoryEvm, signer);

  const resolverAbi = [
    'function getLatestVersion(bytes32) external view returns (uint256)',
    'function getLatestVersionByConfiguration(bytes32) external view returns (uint256)',
    'function checkResolverProxyConfigurationRegistered(bytes32,uint256) external view'
  ];
  const resolver = new ethers.Contract(resolverEvm, resolverAbi, provider);

  const candidateConfigIds = [
    ethers.toBeHex(2n, 32),
    ethers.toBeHex(1n, 32)
  ];
  let configKey = '';
  let configVersion = 0n;
  for (const key of candidateConfigIds) {
    let version = 0n;
    for (const fn of ['getLatestVersion', 'getLatestVersionByConfiguration']) {
      try {
        version = await resolver[fn](key);
        if (version > 0n) break;
      } catch {
        // selector not exposed; try next
      }
    }
    if (version === 0n) continue;
    await resolver.checkResolverProxyConfigurationRegistered(key, version);
    configKey = key;
    configVersion = version;
    console.log('resolver config candidate', configKey, 'version', version.toString());
    break;
  }
  if (!configKey) throw new Error('no registered bond config found on resolver');
  console.log('using resolverConfig', configKey, 'version', configVersion.toString());

  const platforms: PlatformDef[] = [
    {
      key: 'ATS_ALPHA',
      platformId: ethers.zeroPadValue(ethers.toUtf8Bytes('alpha'), 32),
      operator: 'Alpha Capital',
      symbol: 'ALPHA',
      name: 'Alpha Real-Estate Token',
      assetHederaId: '',
      assetEvm: '',
      isin: makeIsin('USHYPO00001'),
      faceValue: '1000000',
      decimals: 0,
      maturityTs: Math.floor(Date.now() / 1000) + 86400 * 365,
      seedHoldAmount: '400000',
      seedClaimantEvm: '0x1111111111111111111111111111111111111111'
    },
    {
      key: 'ATS_BETA',
      platformId: ethers.zeroPadValue(ethers.toUtf8Bytes('beta'), 32),
      operator: 'Beta Collateral',
      symbol: 'BETA',
      name: 'Beta Trade-Finance Token',
      assetHederaId: '',
      assetEvm: '',
      isin: makeIsin('USHYPO00002'),
      faceValue: '1200000',
      decimals: 0,
      maturityTs: Math.floor(Date.now() / 1000) + 86400 * 270
    }
  ];

  const regulationData = {
    regulationType: 1,
    regulationSubType: 0,
    additionalSecurityData: {
      countriesControlListType: false,
      listOfCountries: '',
      info: ''
    }
  };

  const chainId = (await provider.getNetwork()).chainId;
  console.log('chainId', chainId.toString());

  for (const p of platforms) {
    console.log(`\n=== deploying ${p.symbol} via factory ===`);
    const bondData = {
      security: {
        resolver: resolverEvm,
        maxSupply: BigInt(p.faceValue),
        resolverProxyConfiguration: {
          key: configKey,
          version: configVersion
        },
        erc20MetadataInfo: { name: p.name, symbol: p.symbol, isin: p.isin, decimals: p.decimals },
        rbacs: [
          {
            role: ROLES.DEFAULT_ADMIN,
            members: [signerEvm]
          }
        ],
        externalPauses: [],
        externalControlLists: [],
        externalKycLists: [],
        compliance: ethers.ZeroAddress,
        identityRegistry: ethers.ZeroAddress,
        arePartitionsProtected: false,
        isMultiPartition: false,
        isControllable: true,
        isWhiteList: false,
        clearingActive: false,
        internalKycActivated: false,
        erc20VotesActivated: false
      },
      bondDetails: {
        currency: ethers.hexlify(ethers.toUtf8Bytes('USD')),
        nominalValue: BigInt(p.faceValue),
        nominalValueDecimals: 0,
        startingDate: BigInt(Math.floor(Date.now() / 1000)),
        maturityDate: BigInt(p.maturityTs)
      },
      proceedRecipients: [],
      proceedRecipientsData: []
    };

    const simulated = await factory.deployBond.staticCall(bondData, regulationData, {
      gasLimit: BigInt(MAX_GAS)
    });
    console.log(`simulated ${p.symbol} diamond at`, simulated);

    const tx = await factory.deployBond(bondData, regulationData, { gasLimit: BigInt(MAX_GAS) });
    console.log('deploy tx', tx.hash);
    const receipt = (await tx.wait())!;
    console.log('deploy status', receipt.status);

    let createdEvm = '';
    for (const log of receipt.logs) {
      try {
        const parsed = Factory__factory.createInterface().parseLog(log);
        if (parsed && parsed.name === 'BondDeployed') {
          createdEvm = parsed.args.bondAddress.toLowerCase();
          break;
        }
      } catch {
        // anonymous/internal log; skip
      }
    }
    if (!createdEvm) throw new Error(`no BondDeployed event found for ${p.symbol}`);
    p.assetEvm = createdEvm;
    p.assetHederaId = await toHederaId(createdEvm);
    console.log(`${p.symbol} diamond`, p.assetHederaId, createdEvm);

    const asset = IAsset__factory.connect(createdEvm, signer);

    await (await asset.applyRoles([ROLES.ISSUER], [true], signerEvm, { gasLimit: BigInt(3_000_000) })).wait();
    console.log(`${p.symbol} issuer role granted to admin`);

    const issueTx = await asset.issueByPartition(
      {
        partition: PARTITION_ID_1,
        tokenHolder: signerEvm,
        value: BigInt(p.faceValue),
        data: '0x'
      },
      { gasLimit: BigInt(MAX_GAS) }
    );
    await issueTx.wait();
    const balance = await asset.balanceOf(signerEvm);
    console.log(`${p.symbol} issued, admin balance=${balance.toString()}`);

    if (p.seedHoldAmount && p.seedClaimantEvm) {
      const holdTx = await asset.createHoldByPartition(
        PARTITION_ID_1,
        {
          amount: BigInt(p.seedHoldAmount),
          expirationTimestamp: BigInt(p.maturityTs),
          escrow: p.seedClaimantEvm,
          to: p.seedClaimantEvm,
          data: '0x'
        },
        { gasLimit: BigInt(MAX_GAS) }
      );
      const holdReceipt = (await holdTx.wait())!;
      console.log(`${p.symbol} seeded hold tx ${holdTx.hash} status ${holdReceipt.status}`);
    }
  }

  const deployment = {
    network: { chainId: chainId.toString(), rpc },
    signer: signerEvm,
    factory: factoryHederaId,
    resolver: resolverHederaId,
    resolverConfig: { key: configKey, version: configVersion.toString() },
    latest: Object.fromEntries(
      platforms.map((p) => [
        p.key,
        {
          platformId: p.platformId,
          operator: p.operator,
          symbol: p.symbol,
          name: p.name,
          assetHederaId: p.assetHederaId,
          assetEvm: p.assetEvm,
          isin: p.isin,
          faceValue: p.faceValue,
          decimals: p.decimals,
          maturityTs: p.maturityTs,
          seedHoldAmount: p.seedHoldAmount ?? null
        }
      ])
    )
  };

  mkdirSync(resolve(__dirname, '../../deployments'), { recursive: true });
  const out = resolve(__dirname, '../../deployments/testnet.json');
  writeFileSync(out, JSON.stringify(deployment, null, 2));
  console.log('\nwritten', out);

  let env = '';
  const envPath = resolve(__dirname, '../../../.env');
  for (const p of platforms) {
    env += `${p.key}_TOKEN=${p.assetHederaId}\n`;
    env += `${p.key}_DIAMOND=${p.assetEvm}\n`;
  }
  console.log('\nappend to .env:');
  console.log(env);
  writeFileSync(resolve(__dirname, '../../../.env.ats-append'), env);
  console.log('see .env.ats-append (apply values to .env, then delete this file)');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});