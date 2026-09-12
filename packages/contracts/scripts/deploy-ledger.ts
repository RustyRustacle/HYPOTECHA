import { ethers, network, run } from 'hardhat';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { writeFileSync, readFileSync } from 'fs';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

// Live instance addresses (Hedera testnet, chain 296)
const ALPHA = '0x1d531fC520A1a17A9e07684a0bC465e091129eb7';
const SUKUK_DIAMOND = '0xb493ff39779e56a66350daa1c1cc9daaed913c3b';
const USDC_USD_FEED = '0xb632a7e7e02d76c0Ce99d9C62c7a2d1B5F92B6B5';
const REGISTRY_ANCHOR = '0x12E99d5F169eB3b34aabFb2936619febe7da0754';

async function main() {
  const networkName = network.name || 'unknown';
  const [deployer] = await ethers.getSigners();
  console.log('Network:', networkName, 'Deployer:', deployer.address);

  const factory = await ethers.getContractFactory('EncumbranceLedger');
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log('========================================');
  console.log('EncumbranceLedger deployment successful');
  console.log(`Network: ${networkName}`);
  console.log(`Contract: ${address}`);
  console.log(`Owner: ${await contract.owner()}`);
  console.log('========================================');

  if (networkName === 'hederaTestnet') {
    console.log('Verifying on Sourcify ...');
    try {
      await run('verify:sourcify', { address, contract: 'contracts/EncumbranceLedger.sol:EncumbranceLedger' });
    } catch (err) {
      console.warn('Verification report:', (err as Error).message);
    }
  }

  const deploymentsFile = resolve(__dirname, '../../deployments/testnet.json');
  let deployments = {};
  try {
    deployments = JSON.parse(readFileSync(deploymentsFile, 'utf8'));
  } catch {
    /* fresh */
  }
  deployments = {
    ...deployments,
    encumbranceLedger: { address, owner: deployer.address, network: networkName, deployedAt: new Date().toISOString() },
  };
  writeFileSync(deploymentsFile, JSON.stringify(deployments, null, 2));
  console.log('Deployment recorded in', deploymentsFile);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});