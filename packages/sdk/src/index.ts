import { JsonRpcProvider, type AbstractSigner } from 'ethers';
import { AnchorClient } from './anchor.js';
import { AtsToken } from './ats.js';
import { HcsBus, type HcsBusConfig } from './hcs.js';
import { buildEnvelope, checkEnoughAvailable } from './enforcement.js';
import { EVENT_OPS, type AnchorInstance, type ClaimResult, type Envelope } from './types.js';

export * from './types.js';
export { AnchorClient, AtsToken, HcsBus, checkEnoughAvailable, buildEnvelope };

export interface HypothecaSDKConfig {
  rpcUrl: string;
  mirrorBase?: string;
  accountId: string;
  privateKey: string;
  topicId: string;
  registryAnchor?: string;
  signer?: AbstractSigner;
}

/** High-level facade over the registry anchor, ATS tokens and the HCS data bus. */
export class HypothecaSDK {
  private readonly provider: JsonRpcProvider;
  private readonly config: HypothecaSDKConfig;
  private bus?: HcsBus;
  private anchor?: AnchorClient;

  constructor(config: HypothecaSDKConfig) {
    this.config = config;
    this.provider = new JsonRpcProvider(config.rpcUrl);
    if (config.registryAnchor) {
      this.anchor = new AnchorClient(config.registryAnchor, config.signer ?? this.provider);
    }
  }

  private getBus(): HcsBus {
    if (!this.bus) {
      this.bus = new HcsBus({
        accountId: this.config.accountId,
        privateKey: this.config.privateKey,
        rpcUrl: this.config.rpcUrl,
        mirrorBase: this.config.mirrorBase,
        topicId: this.config.topicId,
        maxFeeHbar: 1
      });
    }
    return this.bus;
  }

  token(address: string): AtsToken {
    return new AtsToken(address, this.config.signer ?? this.provider);
  }

  getAnchor(): AnchorClient {
    if (!this.anchor) throw new Error('registryAnchor address not configured');
    return this.anchor;
  }

  async saveEnvelope(envelope: Envelope): Promise<string> {
    return this.getBus().publish(envelope);
  }

  async readEnvelopes(limit?: number): Promise<Envelope[]> {
    const messages = await this.getBus().read(limit ?? 100);
    return messages
      .map((m) => {
        try {
          return JSON.parse(m.content) as Envelope;
        } catch {
          return undefined;
        }
      })
      .filter((e): e is Envelope => Boolean(e));
  }

  /**
   * Request an encumbrance: validate availability, create an ATS hold, and
   * publish a HOLD_CREATED envelope to the registry data bus.
   */
  async createClaim(input: {
    token: string;
    instance: AnchorInstance;
    holder: string;
    claimant: string;
    amount: bigint;
    expirationTs: bigint;
    partition?: string;
  }): Promise<ClaimResult> {
    const ats = this.token(input.token);
    const balance = await ats.balanceOf(input.holder);
    const held = 0n; // projection of active holds for the holder; registry service maintains this
    const guard = checkEnoughAvailable({
      token: input.token,
      holder: input.holder,
      balance,
      held,
      requested: input.amount
    });
    if (!guard.ok) {
      return { ok: false, guard };
    }

    const partition = input.partition ?? '0x0000000000000000000000000000000000000000000000000000000000000001';
    const atsHoldTx = await ats.createHoldByPartition({
      partition,
      amount: input.amount,
      expirationTimestamp: input.expirationTs,
      escrow: input.claimant,
      to: input.claimant
    });

    const envelope = buildEnvelope({
      op: EVENT_OPS.HOLD_CREATED,
      assetId: input.instance.platformId,
      chainPartition: partition,
      sourceContract: input.token,
      holder: input.holder,
      escrow: input.claimant,
      to: input.claimant,
      amount: input.amount,
      expirationTs: input.expirationTs,
      partition
    });

    const hcsTxId = await this.getBus().publish(envelope);
    return {
      ok: true,
      guard,
      envelope,
      hcsTxId,
      atsHoldId: atsHoldTx
    };
  }

  async releaseClaim(input: {
    token: string;
    instance: AnchorInstance;
    holder: string;
    claimant: string;
    amount: bigint;
    holdId?: string;
    partition?: string;
  }): Promise<ClaimResult> {
    const partition = input.partition ?? '0x0000000000000000000000000000000000000000000000000000000000000001';
    const envelope = buildEnvelope({
      op: EVENT_OPS.HOLD_RELEASED,
      assetId: input.instance.platformId,
      chainPartition: partition,
      sourceContract: input.token,
      holder: input.holder,
      escrow: input.claimant,
      to: input.claimant,
      amount: input.amount,
      partition,
      holdId: input.holdId
    });
    const hcsTxId = await this.getBus().publish(envelope);
    return {
      ok: true,
      envelope,
      hcsTxId,
      atsHoldId: input.holdId
    };
  }
}