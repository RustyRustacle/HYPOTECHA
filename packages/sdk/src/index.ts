import { Contract, ethers, type Signer } from 'ethers';

export type ClaimStatus = 'active' | 'released' | 'defaulted';

export interface EncumbranceClaim {
  claimId: string;
  token: string;
  obligor: string;
  claimant: string;
  amount: bigint;
  status: ClaimStatus;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface HypothecaSDKConfig {
  rpcUrl: string;
  contractAddress?: string;
  accountId?: string;
  signer?: Signer;
}

export const ENCURMBRANCE_ABI = [
  'function owner() view returns (address)',
  'function claimCounter() view returns (uint256)',
  'function setTokenBalance(address token, address obligor, uint256 balance)',
  'function createClaim(address token, address obligor, address claimant, uint256 amount) returns (bytes32)',
  'function releaseClaim(bytes32 claimId)',
  'function defaultClaim(bytes32 claimId)',
  'function getAvailableBalance(address token, address obligor) view returns (uint256)',
  'function getClaims(address token, address obligor) view returns ((bytes32,address,address,address,uint256,uint8,uint256,uint256)[])',
  'function totalHeld(address token, address obligor) view returns (uint256)',
  'function claims(bytes32) view returns (bytes32,address,address,address,uint256,uint8,uint256,uint256)',
  'event EncumbranceCreated(bytes32 indexed claimId, address indexed token, address indexed obligor, address claimant, uint256 amount)',
  'event EncumbranceReleased(bytes32 indexed claimId, address indexed releasedBy, uint256 timestamp)',
  'event EncumbranceDefaulted(bytes32 indexed claimId, address indexed admin, uint256 timestamp)',
  'event EncumbranceRejected(address indexed token, address indexed obligor, uint256 requestedAmount, uint256 availableAmount, string reason)'
] as const;

export class HypothecaSDK {
  private readonly contractAddress: string;
  private readonly provider: ethers.Provider;
  private signer?: Signer;
  private contract: Contract;

  constructor(config: HypothecaSDKConfig) {
    const contractAddress = config.contractAddress ?? ethers.ZeroAddress;
    this.contractAddress = contractAddress;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.contract = new ethers.Contract(contractAddress, ENCURMBRANCE_ABI, this.provider);

    if (config.signer) {
      this.signer = config.signer;
      this.contract = new ethers.Contract(contractAddress, ENCURMBRANCE_ABI, config.signer);
    }
  }

  connect(signer: Signer): HypothecaSDK {
    this.signer = signer;
    this.contract = new ethers.Contract(this.contractAddress, ENCURMBRANCE_ABI, signer);
    return this;
  }

  async createClaim(
    token: string,
    obligor: string,
    claimant: string,
    amount: bigint
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('A signer is required to create a claim. Use .connect(signer) or pass signer in config.');
    }

    const tx = await this.contract.createClaim(token, obligor, claimant, amount);
    await tx.wait();
    return tx.hash;
  }

  async releaseClaim(claimId: string): Promise<string> {
    if (!this.signer) {
      throw new Error('A signer is required to release a claim. Use .connect(signer) or pass signer in config.');
    }

    const tx = await this.contract.releaseClaim(claimId);
    await tx.wait();
    return tx.hash;
  }

  async getAvailableBalance(token: string, obligor: string): Promise<bigint> {
    const value = await this.contract.getAvailableBalance(token, obligor);
    return BigInt(value.toString());
  }

  async getClaims(token: string, obligor: string): Promise<EncumbranceClaim[]> {
    const rawClaims = await this.contract.getClaims(token, obligor);

    return rawClaims.map((claim: any) => ({
      claimId: claim[0],
      token: claim[1],
      obligor: claim[2],
      claimant: claim[3],
      amount: BigInt(claim[4].toString()),
      status: this.toClaimStatus(claim[5]),
      createdAt: BigInt(claim[6].toString()),
      updatedAt: BigInt(claim[7].toString())
    }));
  }

  async getTotalHeld(token: string, obligor: string): Promise<bigint> {
    const value = await this.contract.totalHeld(token, obligor);
    return BigInt(value.toString());
  }

  private toClaimStatus(raw: number): ClaimStatus {
    switch (raw) {
      case 0:
        return 'active';
      case 1:
        return 'released';
      case 2:
        return 'defaulted';
      default:
        return 'active';
    }
  }
}
