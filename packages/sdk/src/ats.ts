import { type AbstractSigner, Contract, JsonRpcProvider, type Provider, getAddress } from 'ethers';

/** Minimal ERC-1400/diamond ABI: supply + hold operations (HoldFacet). */
/** Hedera eth_estimateGas under-reports contract-call gas on the EVM bridge,
 *  which makes default ethers gasLimit executions die with out-of-gas. Always
 *  pass a generous explicit limit for ATS state-changing txs. */
export const ATS_TX_GAS_LIMIT = 2_000_000n;

export const ATS_TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  // HoldFacet
  'function createHoldByPartition(bytes32, tuple(uint256 amount,uint256 expirationTimestamp,address escrow,address to,bytes data)) returns (uint256)',
  'function releaseHoldByPartition(tuple(bytes32 partition,address tokenHolder,uint256 holdId), uint256 amount) returns (bool)'
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
  private readonly mirrorBase?: string;

  constructor(address: string, providerOrSigner: Provider | AbstractSigner, opts?: { mirrorBase?: string }) {
    this.address = getAddress(address);
    this.contract = new Contract(this.address, ATS_TOKEN_ABI, providerOrSigner);
    this.mirrorBase = opts?.mirrorBase ? opts.mirrorBase.replace(/\/$/, '') : undefined;
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
    }, { gasLimit: ATS_TX_GAS_LIMIT });
    await tx.wait();
    const holdId = await this.#readHoldId(tx.hash);
    return holdId ?? tx.hash;
  }

  /** Read the uint256 holdId ABI output (bool,uint256) from the mirror contract result. */
  async #readHoldId(txHash: string): Promise<string | undefined> {
    if (!this.mirrorBase) return undefined;
    try {
      const res = await fetch(`${this.mirrorBase}/contracts/results/${txHash}`);
      if (!res.ok) return undefined;
      const body = (await res.json()) as { call_result?: string; result?: string };
      const hex = body.call_result?.startsWith('0x') ? body.call_result.slice(2) : (body.call_result ?? '');
      if (hex.length < 128) return undefined;
      const holdId = BigInt(`0x${hex.slice(64, 128)}`);
      return holdId > 0n ? holdId.toString() : undefined;
    } catch {
      return undefined;
    }
  }

  async releaseHoldByPartition(op: { partition: string; tokenHolder: string; holdId: bigint }, amount: bigint): Promise<string> {
    const tx = await this.contract.releaseHoldByPartition(
      { partition: op.partition, tokenHolder: getAddress(op.tokenHolder), holdId: op.holdId },
      amount,
      { gasLimit: ATS_TX_GAS_LIMIT }
    );
    await tx.wait();
    return tx.hash;
  }
}