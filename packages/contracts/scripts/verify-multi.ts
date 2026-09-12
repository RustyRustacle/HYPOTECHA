import { ethers } from 'hardhat';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

const LEDGER = '0xfa01E5b4F2765F33790e8d89A8620bdFd3a16958';

const LEDGER_ABI = [
  'function vaultBalanceUnits(bytes32) view returns (uint256)',
  'function totalDeposited(bytes32) view returns (uint256)',
  'function totalEncumbered(bytes32) view returns (uint256)',
  'function unitUsd18Of(bytes32) view returns (uint256)',
  'function availableUnits(bytes32) view returns (uint256)',
  'function platforms(bytes32) view returns (address token, address feed, uint8 feedDecimals, uint8 tokenDecimals, uint256 coverageThresholdBps, uint256 interestBps, uint256 borrowCapUnits, uint256 maturityTs, uint256 defaultGraceSec, bool active, bool liquidated, uint256 totalDepositedUnits, uint256 totalEncumberedUnits)'
];

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployments = JSON.parse(readFileSync(resolve(__dirname, '../../deployments/testnet.json'), 'utf8'));
  const ledger = await ethers.getContractAt(LEDGER_ABI, LEDGER, deployer);

  const uniq = new Map<string, { symbol: string; assetEvm: string; name: string }>();
  const latest = (deployments.latest ?? deployments) as Record<string, any>;
  for (const [key, v] of Object.entries(latest)) {
    if (!v?.platformId) continue;
    uniq.set(String(v.platformId), { symbol: String(v.symbol ?? key), assetEvm: String(v.assetEvm ?? ''), name: String(v.name ?? key) });
  }

  console.log(`# live ledger platforms (${uniq.size} candidates)\n`);
  for (const [pid, meta] of uniq) {
    const m = meta;
    try {
      const p = await ledger.platforms(pid);
      const vault = p.token; // noop
      void vault;
      const funded = p.totalDepositedUnits > 0n;
      console.log(
        `${m.symbol.padEnd(6)} pid0x${String(pid).slice(-8)}  active=${p.active} liquidated=${p.liquidated} ` +
          `| deposited=${p.totalDepositedUnits} encumbered=${p.totalEncumberedUnits} vault=${(await ledger.vaultBalanceUnits(pid)).toString()} avail=${(await ledger.availableUnits(pid)).toString()} unit=${Number(await ledger.unitUsd18Of(pid)) / 1e18}  ${funded ? 'FUNDED' : 'EMPTY'}`
      );
    } catch (e) {
      console.log(`${m.symbol.padEnd(6)} pid0x${String(pid).slice(-8)}  ERR ${String(e).slice(0, 100)}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});