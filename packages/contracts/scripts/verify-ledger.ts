import { run } from 'hardhat';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

async function main() {
  const deployments = JSON.parse(readFileSync(resolve(__dirname, '../../deployments/testnet.json'), 'utf8'));
  const address = deployments.encumbranceLedger.address;
  console.log('verifying', address, 'on Sourcify ...');
  await run('verify:sourcify', { address, contract: 'contracts/EncumbranceLedger.sol:EncumbranceLedger' });
  console.log('verified');
}

main().catch((error) => {
  console.error('Verification failed:', (error as Error).message ?? error);
  process.exitCode = 1;
});