import { ethers } from 'hardhat';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
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
};

async function main() {
  const rpc = process.env.HEDERA_TESTNET_RPC_URL!;
  const factoryHederaId = process.env.ATS_FACTORY_ID ?? '0.0.10400788';
  const resolverHederaId = process.env.ATS_RESOLVER_ID ?? '0.0.10400497';
  const anchorHederaIdOrEvm = process.env.REGISTRY_ANCHOR!;
  const privKey = process.env.PRIVATE_KEY!;
  const expectedEvm = process.env.EVM_ADDRESS!;
  const mirror = (process.env.MIRROR_NODE_URL ?? 'https://testnet.mirrornode.hedera.com/api/v1').replace(/\/+$/, '');

  async function toHederaId(evm: string): Promise<string> {
    try {
      const res = await fetch(`${mirror}/contracts/${evm}`);
      if (res.ok) return ((await res.json()) as { contract_id: string }).contract_id;
    } catch {
      // fall through to decimal derivation
    }
    return `0.0.${BigInt(evm).toString()}`;
  }

  async function toEvmAlias(hederaId: string): Promise<string> {
    const res = await fetch(`${mirror}/contracts/${hederaId}`);
    if (!res.ok) throw new Error(`mirror lookup failed for ${hederaId}`);
    const body = (await res.json()) as { evm_address: string };
    if (!body.evm_address) throw new Error(`no evm_address for ${hederaId}`);
    return body.evm_address;
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  const signer = new ethers.Wallet(privKey, provider);
  const signerEvm = signer.address.toLowerCase();
  if (signerEvm !== expectedEvm.toLowerCase()) {
    throw new Error('PRIVATE_KEY does not match EVM_ADDRESS in .env');
  }
  const hbarBalance = (await provider.getBalance(signerEvm)) / 100_000_000n;
  console.log('signer', signerEvm, 'hbar', hbarBalance.toString());

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

  let configKey = '';
  let configVersion = 0n;
  for (const key of [ethers.toBeHex(2n, 32), ethers.toBeHex(1n, 32)]) {
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
    break;
  }
  if (!configKey) throw new Error('no registered bond config found on resolver');
  console.log('using resolverConfig', configKey, 'version', configVersion.toString());

  const d = (m: string) => BigInt(Math.floor(Date.parse(`${m}T00:00:00Z`) / 1000));

  const platforms: PlatformDef[] = [
    {
      key: 'ATS_GREEN',
      platformId: ethers.zeroPadValue(ethers.toUtf8Bytes('green'), 32),
      operator: 'Green Energy',
      symbol: 'GREEN',
      name: 'Green Energy Sukuk Token',
      assetHederaId: '',
      assetEvm: '',
      isin: makeIsin('IDHYPO00001'),
      faceValue: '800000',
      decimals: 0,
      maturityTs: Number(d('2027-12-15'))
    },
    {
      key: 'ATS_GOLD',
      platformId: ethers.zeroPadValue(ethers.toUtf8Bytes('gold'), 32),
      operator: 'Gold Vault',
      symbol: 'GOLD',
      name: 'Gold Bullion Backed Token',
      assetHederaId: '',
      assetEvm: '',
      isin: makeIsin('IDHYPO00002'),
      faceValue: '500000',
      decimals: 0,
      maturityTs: Number(d('2028-03-15'))
    },
    {
      key: 'ATS_SUKUK',
      platformId: ethers.zeroPadValue(ethers.toUtf8Bytes('sukuk'), 32),
      operator: 'Nusantara Finance',
      symbol: 'SUKUK',
      name: 'Syariah Sukuk Warehouse',
      assetHederaId: '',
      assetEvm: '',
      isin: makeIsin('IDHYPO00003'),
      faceValue: '1000000',
      decimals: 0,
      maturityTs: Number(d('2027-10-31'))
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
        resolverProxyConfiguration: { key: configKey, version: configVersion },
        erc20MetadataInfo: { name: p.name, symbol: p.symbol, isin: p.isin, decimals: p.decimals },
        rbacs: [{ role: ROLES.DEFAULT_ADMIN, members: [signerEvm] }],
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
    console.log('simulated at', simulated);

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
    console.log(`${p.symbol} issuer role granted`);

    const issueTx = await asset.issueByPartition(
      { partition: PARTITION_ID_1, tokenHolder: signerEvm, value: BigInt(p.faceValue), data: '0x' },
      { gasLimit: BigInt(MAX_GAS) }
    );
    await issueTx.wait();
    const balance = await asset.balanceOf(signerEvm);
    console.log(`${p.symbol} issued, admin balance=${balance.toString()}`);
  }

  // 4. Register each new asset on the RegistryAnchor
  const RegistryAnchor = await ethers.getContractFactory('RegistryAnchor');
  const anchorEvm = anchorHederaIdOrEvm.includes('.')
    ? await toEvmAlias(anchorHederaIdOrEvm)
    : anchorHederaIdOrEvm;
  const anchor = RegistryAnchor.attach(anchorEvm);
  console.log('\n=== registering on RegistryAnchor', anchorEvm);

  const already = await anchor.getInstances().catch(() => []);
  const existingIds = new Set(already.map((i: { platformId: string }) => i.platformId.toLowerCase()));

  for (const p of platforms) {
    if (existingIds.has(p.platformId.toLowerCase())) {
      console.log(`${p.symbol} already registered, skipping`);
      continue;
    }
    const entity = Number(BigInt(p.assetHederaId.split('.')[2]));
    const tx = await anchor.registerInstance(
      p.platformId,
      p.operator,
      BigInt(entity),
      p.assetEvm,
      p.name,
      p.symbol,
      p.decimals,
      BigInt(p.faceValue),
      BigInt(p.maturityTs)
    );
    await tx.wait();
    console.log(`registered ${p.symbol} (${p.assetHederaId})`);
  }

  const instances = await anchor.getInstances();
  console.log('total instances on anchor:', instances.length);

  // 5. Merge into deployments/testnet.json (keep earlier records)
  const depPath = resolve(__dirname, '../../deployments/testnet.json');
  let dep: { latest: Record<string, unknown> } = { latest: {} };
  if (existsSync(depPath)) dep = JSON.parse(readFileSync(depPath, 'utf8'));
  for (const p of platforms) {
    dep.latest[p.key] = {
      platformId: p.platformId,
      operator: p.operator,
      symbol: p.symbol,
      name: p.name,
      assetHederaId: p.assetHederaId,
      assetEvm: p.assetEvm,
      isin: p.isin,
      faceValue: p.faceValue,
      decimals: p.decimals,
      maturityTs: p.maturityTs
    };
  }
  mkdirSync(resolve(__dirname, '../../deployments'), { recursive: true });
  writeFileSync(depPath, JSON.stringify(dep, null, 2));
  console.log('\nwritten', depPath);

  // 6. Append .env entries for the new instances
  const envPath = resolve(__dirname, '../../../.env');
  const env = readFileSync(envPath, 'utf8');
  let additions = '';
  for (const p of platforms) {
    let block = '';
    block += `${p.key}_TOKEN=${p.assetHederaId}\n`;
    block += `${p.key}_HOLD=${p.assetHederaId}\n`;
    block += `${p.key}_DIAMOND=${p.assetEvm}\n`;
    if (!env.includes(`${p.key}_TOKEN=`)) additions += block;
  }
  if (additions) writeFileSync(envPath, env.trimEnd() + '\n' + additions);

  console.log('\n=== DONE ===');
  for (const p of platforms) {
    console.log(`${p.symbol}: entity=${p.assetHederaId} evm=${p.assetEvm} face=${p.faceValue} mat=${p.maturityTs}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});