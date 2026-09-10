import { type AbstractSigner, Contract, type Provider, getAddress } from 'ethers';
import type { AnchorInstance } from './types.js';

/** Minimal RegistryAnchor ABI (read + owner ops). */
export const ANCHOR_ABI = [
  'function owner() view returns (address)',
  'function topicEntity() view returns (uint256)',
  'function instanceCount() view returns (uint256)',
  'function getInstance(bytes32) view returns (tuple(bytes32 platformId,string operator,uint256 assetDiamondEntity,address assetEvm,string assetName,string assetSymbol,uint8 assetDecimals,uint256 faceValue,uint256 maturityTs,bool active))',
  'function getInstances() view returns (tuple(bytes32 platformId,string operator,uint256 assetDiamondEntity,address assetEvm,string assetName,string assetSymbol,uint8 assetDecimals,uint256 faceValue,uint256 maturityTs,bool active)[])',
  'function isRegistered(bytes32) view returns (bool)',
  'function updateTopic(uint256)',
  'function registerInstance(bytes32,string,uint256,address,string,string,uint8,uint256,uint256)',
  'function unregisterInstance(bytes32)',
  'function updateFaceValue(bytes32,uint256)'
] as const;

function toInstance(raw: any): AnchorInstance {
  return {
    platformId: raw.platformId,
    operator: raw.operator,
    assetDiamondEntity: BigInt(raw.assetDiamondEntity.toString()),
    assetEvm: getAddress(raw.assetEvm),
    assetName: raw.assetName,
    assetSymbol: raw.assetSymbol,
    assetDecimals: Number(raw.assetDecimals),
    faceValue: BigInt(raw.faceValue.toString()),
    maturityTs: BigInt(raw.maturityTs.toString()),
    active: raw.active
  };
}

/** Read/owner client for RegistryAnchor. */
export class AnchorClient {
  readonly address: string;
  private readonly contract: Contract;

  constructor(address: string, providerOrSigner: Provider | AbstractSigner) {
    this.address = getAddress(address);
    this.contract = new Contract(this.address, ANCHOR_ABI, providerOrSigner);
  }

  async owner(): Promise<string> {
    return this.contract.owner();
  }

  async topicEntity(): Promise<bigint> {
    return BigInt((await this.contract.topicEntity()).toString());
  }

  async getInstances(): Promise<AnchorInstance[]> {
    const raw = await this.contract.getInstances();
    return raw.map(toInstance);
  }

  async getInstance(platformId: string): Promise<AnchorInstance> {
    return toInstance(await this.contract.getInstance(platformId));
  }

  async isRegistered(platformId: string): Promise<boolean> {
    return this.contract.isRegistered(platformId);
  }
}