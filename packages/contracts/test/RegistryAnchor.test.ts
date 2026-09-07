import { expect } from 'chai';
import { ethers } from 'hardhat';
import { zeroPadValue } from 'ethers';
import type { RegistryAnchor } from '../typechain-types';

const ALPHA = zeroPadValue(ethers.toUtf8Bytes('alpha'), 32); // 32-byte registry key
const BETA = zeroPadValue(ethers.toUtf8Bytes('beta'), 32);
const UNKNOWN = zeroPadValue(ethers.toUtf8Bytes('unknown'), 32);

describe('RegistryAnchor', function () {
  let anchor: RegistryAnchor;
  let owner: any;
  let stranger: any;

  before(async function () {
    [owner, stranger] = await ethers.getSigners();
    anchor = (await (await ethers.getContractFactory('RegistryAnchor')).deploy()) as unknown as RegistryAnchor;
  });

  it('initializes with deployer as owner and zero topic', async function () {
    expect(await anchor.owner()).to.equal(await owner.getAddress());
    expect(await anchor.topicEntity()).to.equal(0n);
    expect(await anchor.instanceCount()).to.equal(0n);
  });

  it('reverts non-owner topic update', async function () {
    await expect(anchor.connect(stranger).updateTopic(10401182)).to.be.revertedWithCustomError(anchor, 'OnlyOwner');
  });

  it('updates topic as owner and emits event', async function () {
    await expect(anchor.updateTopic(10401182)).to.emit(anchor, 'TopicUpdated').withArgs(10401182);
    expect(await anchor.topicEntity()).to.equal(10401182n);
  });

  it('registerInstance records a single instance and emits', async function () {
    await expect(
      anchor
        .connect(owner)
        .registerInstance(
          ALPHA,
          'Atlas Capital',
          10400879,
          '0x8f1305229654a9be72b301896166aa39f7626e1c',
          'Alpha Real-Estate Token',
          'ALPHA',
          0,
          1_000_000,
          1820285731
        )
    )
      .to.emit(anchor, 'InstanceRegistered')
      .withArgs(ALPHA, ethers.getAddress('0x8f1305229654a9be72b301896166aa39f7626e1c'), 'ALPHA', 1_000_000);

    expect(await anchor.instanceCount()).to.equal(1n);
    expect(await anchor.isRegistered(ALPHA)).to.equal(true);
  });

  it('registerInstance reverts on duplicate platformId', async function () {
    await expect(
      anchor.registerInstance(ALPHA, 'Atlas Capital', 10400879, '0x8f1305229654a9be72b301896166aa39f7626e1c', 'Alpha', 'ALPHA', 0, 1_000_000, 0)
    ).to.be.revertedWithCustomError(anchor, 'AlreadyRegistered');
  });

  it('registerInstance reverts on zero assetEVM or entity', async function () {
    await expect(
      anchor.registerInstance(BETA, 'Bayline Lending', 0, '0xf68706c1e57220403b50f3128ab273cd91fac159', 'Beta', 'BETA', 0, 1_200_000, 0)
    ).to.be.revertedWith('asset entity required');
    await expect(
      anchor.registerInstance(BETA, 'Bayline Lending', 10400884, ethers.ZeroAddress, 'Beta', 'BETA', 0, 1_200_000, 0)
    ).to.be.revertedWithCustomError(anchor, 'InvalidAddress');
  });

  it('registerInstance reverts for non-owner', async function () {
    await expect(
      anchor
        .connect(stranger)
        .registerInstance(BETA, 'Bayline Lending', 10400884, '0xf68706c1e57220403b50f3128ab273cd91fac159', 'Beta', 'BETA', 0, 1_200_000, 0)
    ).to.be.revertedWithCustomError(anchor, 'OnlyOwner');
  });

  it('registers second instance and enumerates both', async function () {
    await anchor
      .connect(owner)
      .registerInstance(BETA, 'Bayline Lending', 10400884, '0xf68706c1e57220403b50f3128ab273cd91fac159', 'Beta Trade-Finance Token', 'BETA', 0, 1_200_000, 1812077731);

    expect(await anchor.instanceCount()).to.equal(2n);
    const instances = await anchor.getInstances();
    expect(instances.length).to.equal(2);
    expect(instances.map((i: any) => i.assetSymbol)).to.have.members(['ALPHA', 'BETA']);
  });

  it('getInstance returns the stored record', async function () {
    const inst = await anchor.getInstance(BETA);
    expect(inst.assetSymbol).to.equal('BETA');
    expect(inst.operator).to.equal('Bayline Lending');
    expect(inst.assetDiamondEntity).to.equal(10400884n);
    expect(inst.maturityTs).to.equal(1812077731n);
    expect(inst.active).to.equal(true);
  });

  it('getInstance reverts for unregistered platformId', async function () {
    await expect(anchor.getInstance(UNKNOWN)).to.be.revertedWithCustomError(
      anchor,
      'NotRegistered'
    );
  });

  it('updateFaceValue updates and unregister marks inactive', async function () {
    await expect(anchor.updateFaceValue(BETA, 1_500_000)).to.emit(anchor, 'FaceValueUpdated').withArgs(BETA, 1_500_000);
    expect((await anchor.getInstance(BETA)).faceValue).to.equal(1_500_000n);

    await expect(anchor.unregisterInstance(ALPHA)).to.emit(anchor, 'InstanceRemoved').withArgs(ALPHA);
    expect(await anchor.instanceCount()).to.equal(1n);
    expect(await anchor.isRegistered(ALPHA)).to.equal(true); // registration key persists
    const active = await anchor.getInstances();
    expect(active.map((i: any) => i.assetSymbol)).to.deep.equal(['BETA']);
  });

  it('unregister reverts for unknown platformId', async function () {
    await expect(anchor.unregisterInstance(UNKNOWN)).to.be.revertedWithCustomError(
      anchor,
      'NotRegistered'
    );
  });

  it('transferOwnership reverts for stranger and to zero address', async function () {
    await expect(anchor.connect(stranger).transferOwnership(await stranger.getAddress())).to.be.revertedWithCustomError(anchor, 'OnlyOwner');
    await expect(anchor.transferOwnership(ethers.ZeroAddress)).to.be.revertedWithCustomError(anchor, 'InvalidAddress');
  });

it('re-register after unregister is blocked (registry key persists)', async function () {
    await expect(
      anchor
        .connect(owner)
        .registerInstance(ALPHA, 'Atlas Capital', 10400879, '0x8f1305229654a9be72b301896166aa39f7626e1c', 'Alpha Real-Estate Token', 'ALPHA', 0, 1_200_000, 1820285731)
    ).to.be.revertedWithCustomError(anchor, 'AlreadyRegistered');
  });
});

