import { run } from 'hardhat';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

async function main() {
  const address = process.env.REGISTRY_ANCHOR;
  if (!address) throw new Error('REGISTRY_ANCHOR missing in .env');
  console.log('verifying', address, 'on Sourcify ...');
  await run('verify:sourcify', { address, contract: 'contracts/RegistryAnchor.sol:RegistryAnchor' });
  console.log('verified');
}

main().catch((error) => {
  console.error('Verification failed:', error.message ?? error);
  process.exitCode = 1;
});