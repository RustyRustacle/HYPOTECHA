import { ethers, run } from 'hardhat';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

type PlatformDef = {
  platformId: string;
  operator: string;
  symbol: string;
  name: string;
  assetHederaId: string;
  assetEvm: string;
  faceValue: string;
  decimals: number;
  maturityTs: number;
};

function parseHederaEntity(id: string): number {
  const m = /^0\.0\.(\d+)$/.exec(id);
  if (!m) throw new Error(`not a 0.0.X id: ${id}`);
  return Number(m[1]);
}

async function main() {
  const rpc = process.env.HEDERA_TESTNET_RPC_URL!;
  const privKey = process.env.PRIVATE_KEY!;
  const expectedEvm = process.env.EVM_ADDRESS!;
  const topicId = process.env.HCS_TOPIC_ID!;
  if (!topicId) throw new Error('HCS_TOPIC_ID missing - run make-topic.ts first');

  const provider = new ethers.JsonRpcProvider(rpc);
  const signer = new ethers.Wallet(privKey, provider);
  if (signer.address.toLowerCase() !== expectedEvm.toLowerCase()) {
    throw new Error('PRIVATE_KEY does not match EVM_ADDRESS in .env');
  }

  // 1. Load instance data from deployments/testnet.json
  const depPath = resolve(__dirname, '../../deployments/testnet.json');
  const dep = JSON.parse(readFileSync(depPath, 'utf8')) as {
    latest: Record<string, PlatformDef>;
  };

  // 2. Deploy RegistryAnchor
  console.log('deploying RegistryAnchor ...');
  const factory = await ethers.getContractFactory('RegistryAnchor');
  const anchor = await factory.deploy();
  await anchor.waitForDeployment();
  const anchorAddr = await anchor.getAddress();
  console.log('RegistryAnchor', anchorAddr);

  // 3. Register topic
  await (await anchor.updateTopic(BigInt(parseHederaEntity(topicId)))).wait();
  console.log('topic registered on anchor');

  // 5. Register instances
  for (const [key, p] of Object.entries(dep.latest)) {
    const platformId = ethers.zeroPadValue(ethers.toUtf8Bytes(key.toLowerCase() === 'ats_alpha' ? 'alpha' : 'beta'), 32);
    const tx = await anchor.registerInstance(
      platformId,
      p.operator,
      BigInt(parseHederaEntity(p.assetHederaId)),
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

  // 6. Verify reads
  const instances = await anchor.getInstances();
  console.log('instances on chain:', instances.length);

  // 7. Update .env
  const envPath = resolve(__dirname, '../../../.env');
  let env = readFileSync(envPath, 'utf8');
  const setVar = (key: string, value: string) => {
    env = env.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`);
  };
  setVar('REGISTRY_ANCHOR', anchorAddr);
  writeFileSync(envPath, env);
  console.log('updated .env (REGISTRY_ANCHOR)');

  // 8. Verify on Sourcify
  if (process.env.SOURCIFY_VERIFY === 'true') {
    console.log('verifying on Sourcify ...');
    try {
      await run('verify:sourcify', { address: anchorAddr, contract: 'contracts/RegistryAnchor.sol:RegistryAnchor' });
    } catch (err) {
      console.warn('Verification report:', (err as Error).message);
    }
  }

  console.log('========================================');
  console.log('topic', topicId);
  console.log('anchor', anchorAddr);
  console.log('done');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});