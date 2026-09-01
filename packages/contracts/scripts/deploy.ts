import { ethers } from 'hardhat';

async function main() {
  const networkName = (await ethers.provider.getNetwork()).name || 'unknown';
  const factory = await ethers.getContractFactory('EncumbranceFacet');
  const contract = await factory.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log('========================================');
  console.log('Hypotheca deployment successful');
  console.log(`Network: ${networkName}`);
  console.log(`Contract: ${address}`);
  console.log('========================================');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
