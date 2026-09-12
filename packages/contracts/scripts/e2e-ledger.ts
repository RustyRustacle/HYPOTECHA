import { ethers } from 'hardhat';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

const SUKUK = '0xb493ff39779e56a66350daa1c1cc9daaed913c3b';
const PLATFORM_ID = '0x00000000000000000000000000000000000000000000000000000073756b756b'; // sukuk
const BANK_A = '0x00000000000000000000000000000000000000a1';
const BANK_B = '0x00000000000000000000000000000000000000b2';
const GAS = 800_000n;

const balAbi = ['function balanceOf(address) view returns (uint256)'];

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployments = JSON.parse(readFileSync(resolve(__dirname, '../../deployments/testnet.json'), 'utf8'));
  const ledger = await ethers.getContractAt('EncumbranceLedger', deployments.encumbranceLedger.address, deployer);
  const sukuk = await ethers.getContractAt(balAbi, SUKUK);

  console.log('--- state before ---');
  console.log('vaultBalanceUnits =', (await ledger.vaultBalanceUnits(PLATFORM_ID)).toString());
  console.log('encumbered        =', (await ledger.totalEncumbered(PLATFORM_ID)).toString());
  console.log('availableUnits    =', (await ledger.availableUnits(PLATFORM_ID)).toString());
  console.log('coverageBps       =', (await ledger.coverageBpsOf(PLATFORM_ID)).toString());
  console.log('unitUsd18         =', (await ledger.unitUsd18Of(PLATFORM_ID)).toString());

  // repay BANK_A via releaseHoldByPartition (no identity check)
  const rep = await ledger.repay(PLATFORM_ID, BANK_A, { gasLimit: GAS });
  await rep.wait();
  console.log('repay BANK_A tx    =', rep.hash);
  console.log('vault balance now  =', (await sukuk.balanceOf(await ledger.getAddress())).toString());
  console.log('encumbered now     =', (await ledger.totalEncumbered(PLATFORM_ID)).toString());

  // withdraw 60k via transient hold + execute to depositor (identified)
  const wd = await ledger.withdraw(PLATFORM_ID, 60_000, { gasLimit: GAS });
  await wd.wait();
  console.log('withdraw 60000 tx  =', wd.hash);
  console.log('vault balance now  =', (await sukuk.balanceOf(await ledger.getAddress())).toString());
  console.log('availableUnits now =', (await ledger.availableUnits(PLATFORM_ID)).toString());
  console.log('signer balance     =', (await sukuk.balanceOf(deployer.address)).toString());

  // healthy settle no-op
  const settled = await ledger.settle.staticCall(PLATFORM_ID);
  console.log('settle (healthy)   =', settled.toString(), 'liquidated');

  console.log('--- final rollup ---');
  console.log('totalDeposited =', (await ledger.totalDeposited(PLATFORM_ID)).toString());
  console.log('totalEncumbered =', (await ledger.totalEncumbered(PLATFORM_ID)).toString());
  console.log('outstandingUsd18 =', (await ledger.outstandingUsd18Of(PLATFORM_ID)).toString());
  console.log('collateralUsd18 =', (await ledger.collateralUsd18Of(PLATFORM_ID)).toString());
  console.log('healthFactor18 =', (await ledger.healthFactor18Of(PLATFORM_ID)).toString());
  console.log('creditors =', (await ledger.creditorsOf(PLATFORM_ID)).join(','));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
