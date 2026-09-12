import { expect } from 'chai';
import { ethers } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import type { EncumbranceLedger } from '../typechain-types';

const PARTITION_1 = ethers.zeroPadValue('0x01', 32);
const USD18 = 10n ** 18n;
const ONE_M = 1_000_000n;

describe('EncumbranceLedger', () => {
  async function deploy() {
    const [owner, depositor, bankA, bankB, stranger] = await ethers.getSigners();

    const Ledger = await ethers.getContractFactory('EncumbranceLedger');
    const MockToken = await ethers.getContractFactory('MockHoldToken');
    const MockFeed = await ethers.getContractFactory('MockFeed');

    // feed with 8 decimals quoting $1.00 (like the live USDC/USD aggregator)
    const price8 = await MockFeed.deploy(8, 100_000_000n); // 1.00
    const price18 = await MockFeed.deploy(18, USD18); // 1.00 at 18dp
    const token = await MockToken.deploy(0); // decimals=0 (asset units are whole tokens)
    const ledger = (await Ledger.deploy()) as unknown as EncumbranceLedger;

    await ledger.connect(owner).setStaleAfter(24 * 3600);

    // platform ALPHA -> feed (8dp), platform BETA -> feed (18dp) for the decimal combos
    await ledger
      .connect(owner)
      .configurePlatform(
        ethers.encodeBytes32String('ALPHA'),
        await token.getAddress(),
        await price8.getAddress(),
        0, // tokenDecimals
        10_000n, // threshold 100%
        0n, // interest 0
        2_000_000n, // borrow cap
        BigInt(Math.floor(Date.now() / 1000)) + 100n * 24n * 3600n * 365n // long maturity
      );
    await ledger
      .connect(owner)
      .configurePlatform(
        ethers.encodeBytes32String('BETA'),
        await token.getAddress(),
        await price18.getAddress(),
        0,
        10_000n,
        200n, // 2% prepaid interest
        2_000_000n,
        0n // maturity 0 -> default-grace hold expiry
      );
    return { owner, depositor, bankA, bankB, stranger, token, ledger, price8, price18 };
  }

  it('configure: only owner, rejects zero feed and zero cap', async () => {
    const { owner, stranger, ledger, token, price8 } = await deploy();
    const pid = ethers.encodeBytes32String('NOPE');

    await expect(
      ledger.connect(stranger).configurePlatform(pid, await token.getAddress(), await price8.getAddress(), 0, 10_000n, 0n, 1n, 0n)
    ).to.be.revertedWithCustomError(ledger, 'OnlyOwner');
    await expect(
      ledger.connect(owner).configurePlatform(pid, ethers.ZeroAddress, await price8.getAddress(), 0, 10_000n, 0n, 1_000n, 0n)
    ).to.be.revertedWithCustomError(ledger, 'ZeroAddress');
    await expect(
      ledger.connect(owner).configurePlatform(pid, await token.getAddress(), ethers.ZeroAddress, 0, 10_000n, 0n, 1_000n, 0n)
    ).to.be.revertedWithCustomError(ledger, 'ZeroAddress');
    await expect(
      ledger.connect(owner).configurePlatform(pid, await token.getAddress(), await price8.getAddress(), 0, 10_000n, 0n, 0n, 0n)
    ).to.be.revertedWithCustomError(ledger, 'ZeroValue');
  });

  it('aggregator decimals are read at configure time', async () => {
    const { ledger } = await deploy();
    const p = await ledger.platforms(ethers.encodeBytes32String('ALPHA'));
    expect(p.feedDecimals).to.equal(8);
    const b = await ledger.platforms(ethers.encodeBytes32String('BETA'));
    expect(b.feedDecimals).to.equal(18);
    expect(b.defaultGraceSec).to.equal(180n * 24n * 3600n); // maturity 0 -> grace fallback
  });

  it('deposit: only depositor or owner; attributes units', async () => {
    const { owner, depositor, stranger, ledger, token } = await deploy();
    const pid = ethers.encodeBytes32String('ALPHA');

    await expect(ledger.connect(stranger).deposit(pid, depositor.address, 10n)).to.be.revertedWithCustomError(ledger, 'NotDepositor');
    // self-deposit
    await ledger.connect(depositor).deposit(pid, depositor.address, 10n);
    expect(await ledger.deposits(pid, depositor.address)).to.equal(10n);
    // owner can attribute for anyone
    await ledger.connect(owner).deposit(pid, depositor.address, 5n);
    expect(await ledger.deposits(pid, depositor.address)).to.equal(15n);
    expect(await ledger.totalDeposited(pid)).to.equal(15n);
  });

  it('vault balance = token balance of ledger', async () => {
    const { ledger, token } = await deploy();
    const pid = ethers.encodeBytes32String('ALPHA');
    await token.mint(await ledger.getAddress(), ONE_M);
    expect(await ledger.vaultBalanceUnits(pid)).to.equal(ONE_M);
    expect(await ledger.availableUnits(pid)).to.equal(ONE_M);
  });

  it('requestLoan locks units on-chain (holder balance drops, escrow-only semantics hold)', async () => {
    const { ledger, token, bankA } = await deploy();
    const pid = ethers.encodeBytes32String('ALPHA');
    const vault = await ledger.getAddress();
    await token.mint(vault, ONE_M);
    await ledger.deposit(pid, bankA.address, ONE_M);

    await expect(ledger.requestLoan(pid, bankA.address, 600_000n))
      .to.emit(ledger, 'EncumbranceCreated')
      .withArgs(pid, bankA.address, 600_000n, USD18, 1n);

    expect(await token.balanceOf(vault)).to.equal(400_000n); // 600k locked by ATS-style hold
    expect(await ledger.totalEncumbered(pid)).to.equal(600_000n);
    expect(await ledger.availableUnits(pid)).to.equal(400_000n);
    expect(await ledger.healthFactor18Of(pid)).to.equal((16_666n * USD18) / 10_000n); // 1.6666x coverage
  });

  it('over-pledge rejection at the exact boundary', async () => {
    const { ledger, token, bankA, bankB, stranger } = await deploy();
    const pid = ethers.encodeBytes32String('ALPHA');
    const vault = await ledger.getAddress();
    await token.mint(vault, ONE_M);
    await ledger.deposit(pid, bankA.address, ONE_M);

    await ledger.requestLoan(pid, bankA.address, 600_000n); // Bank A holds 600k
    expect(await ledger.availableUnits(pid)).to.equal(400_000n);

    // Bank B: exactly the remaining units is allowed
    await expect(ledger.requestLoan(pid, bankB.address, 400_000n)).to.emit(ledger, 'EncumbranceCreated');
    expect(await ledger.availableUnits(pid)).to.equal(0n);
    expect(await ledger.healthFactor18Of(pid)).to.equal(USD18); // fully encumbered, still covered 1:1

    // A fresh creditor asking 1 unit over -> rejected (double-pledging is structurally impossible)
    await expect(ledger.requestLoan(pid, stranger.address, 1n))
      .to.be.revertedWithCustomError(ledger, 'InsufficientCollateral');
  });

  it('inventory of token units cannot be used twice (duplicate credential rejected)', async () => {
    const { ledger, token, bankA } = await deploy();
    const pid = ethers.encodeBytes32String('ALPHA');
    const vault = await ledger.getAddress();
    await token.mint(vault, ONE_M);
    await ledger.deposit(pid, bankA.address, ONE_M);
    await ledger.requestLoan(pid, bankA.address, 600_000n);
    await expect(ledger.requestLoan(pid, bankA.address, 100_000n))
      .to.be.revertedWithCustomError(ledger, 'PositionAlreadyOpen');
  });

  it('prepaid interest raises the outstanding base and can trip coverage', async () => {
    const { ledger, token, bankA, bankB, stranger } = await deploy();
    const pid = ethers.encodeBytes32String('BETA'); // interest 2%, threshold 100%
    const vault = await ledger.getAddress();
    await token.mint(vault, ONE_M);
    await ledger.deposit(pid, bankA.address, ONE_M);

    // draw 980k of 1M with 2% markup => outstanding 999.6k < 1M backing -> covered
    await expect(ledger.requestLoan(pid, bankA.address, 980_000n)).to.emit(ledger, 'EncumbranceCreated');
    // the position unit usd includes the prepaid markup
    expect(await ledger.positionLoanUnitUsd18(pid, bankA.address)).to.equal(1_020_000_000_000_000_000n);

    // free units left = 1M - 980k = 20k; the remaining 18k fits physically but the 2% markup
    // pushes aggregate outstanding above the $1M backing -> coverage gate fires first
    await expect(ledger.requestLoan(pid, bankB.address, 18_000n))
      .to.be.revertedWithCustomError(ledger, 'CoverageBelowThreshold');
    // 1 unit beyond the free balance is the structural over-pledge rejection
    await expect(ledger.requestLoan(pid, stranger.address, 20_001n))
      .to.be.revertedWithCustomError(ledger, 'InsufficientCollateral');
  });

  it('repay releases the hold back into the vault', async () => {
    const { ledger, token, bankA } = await deploy();
    const pid = ethers.encodeBytes32String('ALPHA');
    const vault = await ledger.getAddress();
    await token.mint(vault, ONE_M);
    await ledger.deposit(pid, bankA.address, ONE_M);
    await ledger.requestLoan(pid, bankA.address, 600_000n);
    expect(await token.balanceOf(vault)).to.equal(400_000n);

    await expect(ledger.repay(pid, bankA.address))
      .to.emit(ledger, 'EncumbranceReleased')
      .withArgs(pid, bankA.address, 600_000n);

    expect(await token.balanceOf(vault)).to.equal(ONE_M);
    expect(await ledger.totalEncumbered(pid)).to.equal(0n);
    expect(await ledger.availableUnits(pid)).to.equal(ONE_M);
    await expect(ledger.repay(pid, bankA.address)).to.be.revertedWithCustomError(ledger, 'PositionNotFound');
  });

  it('withdraw enforces attribution and available units', async () => {
    const { owner, depositor, stranger, ledger, token } = await deploy();
    const pid = ethers.encodeBytes32String('ALPHA');
    const vault = await ledger.getAddress();
    await token.mint(vault, ONE_M);
    await ledger.deposit(pid, depositor.address, 600_000n);

    await expect(ledger.connect(stranger).withdraw(pid, 1000n)).to.be.revertedWithCustomError(ledger, 'NotDepositor');
    await expect(ledger.connect(depositor).withdraw(pid, 700_000n))
      .to.be.revertedWithCustomError(ledger, 'NotDepositor'); // beyond their 600k attribution
    await expect(ledger.connect(depositor).withdraw(pid, 600_000n)).to.emit(ledger, 'CollateralWithdrawn');
    expect(await token.balanceOf(depositor.address)).to.equal(600_000n);
    expect(await token.balanceOf(vault)).to.equal(400_000n);
  });

  it('feed crash drives coverage below threshold and settle executes holds to creditors', async () => {
    const { ledger, token, price8, bankA, bankB } = await deploy();
    const pid = ethers.encodeBytes32String('ALPHA');
    const vault = await ledger.getAddress();
    await token.mint(vault, ONE_M);
    await ledger.deposit(pid, bankA.address, ONE_M);
    await ledger.requestLoan(pid, bankA.address, 600_000n);
    await ledger.requestLoan(pid, bankB.address, 400_000n);
    expect(await ledger.healthFactor18Of(pid)).to.equal(USD18);

    // collateral halves => coverage 50% < 100%
    await price8.setAnswer(50_000_000n);
    expect(await ledger.coverageBpsOf(pid)).to.equal(5_000n);
    expect(await ledger.healthFactor18Of(pid)).to.equal(5n * USD18 / 10n);

    // settle is permissionless and priority-safe
    const [owner, , , , stranger] = await ethers.getSigners();

    await expect(ledger.connect(stranger).settle(pid))
      .to.emit(ledger, 'PlatformLiquidated')
      .withArgs(pid, 5_000n, 10_000n);

    expect(await ledger.isDefaulted(pid, bankA.address)).to.equal(true);
    expect(await ledger.isDefaulted(pid, bankB.address)).to.equal(true);
    expect(await token.balanceOf(bankA.address)).to.equal(600_000n); // recovered collateral
    expect(await token.balanceOf(bankB.address)).to.equal(400_000n);
    expect(await token.balanceOf(vault)).to.equal(0n);
    expect(await ledger.totalEncumbered(pid)).to.equal(0n);

    // frozen: no further draws
    await expect(ledger.requestLoan(pid, owner.address, 1n))
      .to.be.revertedWithCustomError(ledger, 'PlatformLiquidatedError');
  });

  it('settle is a no-op while healthy', async () => {
    const { ledger, token, bankA } = await deploy();
    const pid = ethers.encodeBytes32String('ALPHA');
    const vault = await ledger.getAddress();
    await token.mint(vault, ONE_M);
    await ledger.deposit(pid, bankA.address, ONE_M);
    await ledger.requestLoan(pid, bankA.address, 600_000n);
    await expect(ledger.settle(pid)).to.not.emit(ledger, 'PlatformLiquidated');
    expect(await ledger.totalEncumbered(pid)).to.equal(600_000n);
  });

  it('maturity auto-defaults open positions even at full coverage', async () => {
    const { owner, ledger, bankA } = await deploy();
    const pid = ethers.encodeBytes32String('MAT');
    const price8 = await (await ethers.getContractFactory('MockFeed')).deploy(8, 100_000_000n);
    const token = await (await ethers.getContractFactory('MockHoldToken')).deploy(0);
    const vault = await ledger.getAddress();
    await token.mint(vault, ONE_M);
    const maturity = BigInt(await time.latest()) + 10_000n;
    await ledger.connect(owner).configurePlatform(pid, await token.getAddress(), await price8.getAddress(), 0, 10_000n, 0n, 2_000_000n, maturity);
    await ledger.deposit(pid, bankA.address, ONE_M);
    await ledger.requestLoan(pid, bankA.address, 600_000n);
    expect(await ledger.coverageBpsOf(pid)).to.equal(16_666n);

    await time.increaseTo(Number(maturity) + 1);
    await expect(ledger.settle(pid)).to.emit(ledger, 'PlatformLiquidated');
    expect(await token.balanceOf(bankA.address)).to.equal(600_000n);
  });

  it('stale and non-positive prices revert instead of deciding', async () => {
    const { bankA, stranger, ledger, token, price8 } = await deploy();
    const pid = ethers.encodeBytes32String('ALPHA');
    const vault = await ledger.getAddress();
    await token.mint(vault, ONE_M);
    await ledger.deposit(pid, bankA.address, ONE_M);
    await ledger.requestLoan(pid, bankA.address, 600_000n); // loan basis pinned at 1.0

    await time.increase(25 * 3600); // 24h staleness window elapsed (feed updatedAt unchanged)
    await expect(ledger.requestLoan(pid, stranger.address, 1n))
      .to.be.revertedWithCustomError(ledger, 'StalePrice');

    // refreshed at $0.50: pinned loans (600k) now exceed the $500k backing -> under-collateralized
    await price8.setAnswer(50_000_000n);
    await expect(ledger.requestLoan(pid, stranger.address, 1n))
      .to.be.revertedWithCustomError(ledger, 'CoverageBelowThreshold');

    // finally the proxy itself goes non-positive
    await price8.setAnswer(0n);
    await expect(ledger.requestLoan(pid, stranger.address, 1n))
      .to.be.revertedWithCustomError(ledger, 'PriceNotPositive');
  });

  it('non-owner cannot change owner-only settings (reentrancy/owner guards)', async () => {
    const { stranger, ledger, price8 } = await deploy();
    await expect(ledger.connect(stranger).setStaleAfter(3600)).to.be.revertedWithCustomError(ledger, 'OnlyOwner');
    const pid = ethers.encodeBytes32String('ALPHA');
    await expect(ledger.connect(stranger).setPlatformDefaultGrace(pid, 3600)).to.be.revertedWithCustomError(ledger, 'OnlyOwner');
  });
});
