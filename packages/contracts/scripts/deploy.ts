import { ethers, network, run } from 'hardhat';

async function main() {
  const networkName = network.name || 'unknown';
  const factory = await ethers.getContractFactory('RegistryAnchor');
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log('========================================');
  console.log('RegistryAnchor deployment successful');
  console.log(`Network: ${networkName}`);
  console.log(`Contract: ${address}`);
  console.log(`Owner: ${await contract.owner()}`);
  console.log('========================================');

  if (networkName === 'hederaTestnet') {
    console.log('Verifying on Sourcify ...');
    try {
      await run('verify:sourcify', { address, contract: 'contracts/RegistryAnchor.sol:RegistryAnchor' });
    } catch (err) {
      console.warn('Verification report:', (err as Error).message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});