import { type AbstractSigner, Contract, JsonRpcProvider, type Provider, getAddress } from 'ethers';

/** Minimal ERC-1400/diamond ABI: supply + hold operations (HoldFacet). */
export const ATS_TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  // HoldFacet
  'function createHoldByPartition(bytes32, tuple(uint256 amount,uint256 expirationTimestamp,address escrow,address to,bytes data)) returns (uint256)',
  'function releaseHoldByPartition(bytes32, uint256) returns (bool)'
] as const;

export interface HoldRequest {
  partition: string;
  amount: bigint;
  expirationTimestamp: bigint;
  escrow: string;
  to: string;
  data?: string;
}

/** Client for an ATS security (diamond) token over the EVM bridge. */
export class AtsToken {
  readonly address: string;
  private readonly contract: Contract;

  constructor(address: string, providerOrSigner: Provider | AbstractSigner) {
    this.address = getAddress(address);
    this.contract = new Contract(this.address, ATS_TOKEN_ABI, providerOrSigner);
  }

  static fromRpc(address: string, rpcUrl: string): AtsToken {
    return new AtsToken(address, new JsonRpcProvider(rpcUrl));
  }

  async balanceOf(holder: string): Promise<bigint> {
    return BigInt((await this.contract.balanceOf(getAddress(holder))).toString());
  }

  async totalSupply(): Promise<bigint> {
    return BigInt((await this.contract.totalSupply()).toString());
  }

  async name(): Promise<string> {
    return this.contract.name();
  }

  async symbol(): Promise<string> {
    return this.contract.symbol();
  }

  async decimals(): Promise<number> {
    return Number(await this.contract.decimals());
  }

  async createHoldByPartition(req: HoldRequest): Promise<string> {
    if (!(this.contract.runner as AbstractSigner).provider) {
      throw new Error('A signer is required to create a hold');
    }
    const tx = await this.contract.createHoldByPartition(req.partition, {
      amount: req.amount,
      expirationTimestamp: req.expirationTimestamp,
      escrow: req.escrow,
      to: req.to,
      data: req.data ?? '0x'
    });
    await tx.wait();
    return tx.hash;
  }

  async releaseHoldByPartition(partition: string, holdId: bigint): Promise<string> {
    const tx = await this.contract.releaseHoldByPartition(partition, holdId);
    await tx.wait();
    return tx.hash;
  }
}