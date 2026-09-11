import { HcsBus, type Envelope } from '@hypotheca/sdk';
import type { RegistryProjection } from './projection.js';

export interface RegistrySyncConfig {
  accountId: string;
  privateKey: string;
  rpcUrl: string;
  mirrorBase?: string;
  topicId: string;
  pollIntervalMs?: number;
}

/**
 * Polls the HCS registry topic (reading events published by issuers/lenders
 * via the SDK data bus) and replays them into the local projection.
 */
export class RegistrySync {
  private readonly bus: HcsBus;
  private readonly projection: RegistryProjection;
  private readonly pollIntervalMs: number;
  private timer?: ReturnType<typeof setInterval>;
  private lastApplied = new Set<string>();
  private lastError?: string;
  private syncedAt?: string;

  constructor(config: RegistrySyncConfig, projection: RegistryProjection) {
    this.bus = new HcsBus({
      accountId: config.accountId,
      privateKey: config.privateKey,
      rpcUrl: config.rpcUrl,
      mirrorBase: config.mirrorBase,
      topicId: config.topicId,
      maxFeeHbar: 1
    });
    this.projection = projection;
    this.pollIntervalMs = config.pollIntervalMs ?? 10_000;
  }

  get syncError(): string | undefined {
    return this.lastError;
  }

  get lastSyncAt(): string | undefined {
    return this.syncedAt;
  }

  /** One-shot poll: read recent topic messages and apply envelopes. */
  async pollOnce(): Promise<{ applied: number; read: number }> {
    const messages = await this.bus.read(100);
    const envelopes: Envelope[] = [];
    for (const message of messages) {
      try {
        const env = JSON.parse(message.content) as Envelope;
        env.consensusTs = message.consensusTs;
        if (!this.lastApplied.has(message.consensusTs)) envelopes.push(env);
      } catch {
        // non-registry message on the topic, skip
      }
    }
    let applied = 0;
    for (const env of envelopes) {
      this.projection.apply(env);
      this.lastApplied.add(env.consensusTs ?? '');
      applied++;
    }
    this.lastError = undefined;
    this.syncedAt = new Date().toISOString();
    return { applied, read: messages.length };
  }

  start(): void {
    if (this.timer) return;
    void this.pollOnce().catch((e) => (this.lastError = String(e)));
    this.timer = setInterval(() => {
      void this.pollOnce().catch((e) => {
        this.lastError = String(e);
      });
    }, this.pollIntervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }
}