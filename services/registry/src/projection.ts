import type { Envelope, EventOp } from '@hypotheca/sdk';

export interface HoldRecord {
  key: string;
  op: EventOp;
  assetId: string;
  token: string;
  holder: string;
  claimant: string;
  to: string;
  partition: string;
  amount: bigint;
  expiration?: bigint;
  consensusTs: string;
  status: 'active' | 'released' | 'executed' | 'rejected';
}

export interface HolderSummary {
  holder: string;
  held: bigint;
  activeHolds: HoldRecord[];
}

/** In-memory global projection of encumbrances, derived from the HCS data bus. */
export class RegistryProjection {
  private readonly active: Map<string, Map<string, bigint>> = new Map();
  private readonly records: HoldRecord[] = [];
  private readonly seen = new Set<string>();

  get totalRecords(): number {
    return this.records.length;
  }

  private key(token: string, holder: string): Map<string, bigint> {
    const t = token.toLowerCase();
    const h = holder.toLowerCase();
    if (!this.active.has(t)) this.active.set(t, new Map());
    if (!this.active.get(t)!.has(h)) this.active.get(t)!.set(h, 0n);
    return this.active.get(t)!;
  }

  private recordKey(env: Envelope): string {
    return env.holdId ?? env.txId ?? `${env.consensusTs}:${env.holder}:${env.amount}`;
  }

  /** Apply a decoded envelope to the projection (idempotent per record key). */
  apply(env: Envelope): HoldRecord | undefined {
    const key = this.recordKey(env);
    if (this.seen.has(`${env.consensusTs}:${env.op}:${key}`)) return undefined;
    this.seen.add(`${env.consensusTs}:${env.op}:${key}`);

    const amount = BigInt(env.amount ?? '0');
    let status: HoldRecord['status'];
    let activeDelta = 0n;

    switch (env.op) {
      case 'HOLD_CREATED':
        status = 'active';
        activeDelta = amount;
        break;
      case 'HOLD_RELEASED':
        status = 'released';
        activeDelta = -amount;
        break;
      case 'HOLD_EXECUTED':
        status = 'executed';
        activeDelta = -amount;
        break;
      case 'CONFLICT_REJECTED':
        status = 'rejected';
        activeDelta = 0n;
        break;
      default:
        status = 'active';
        activeDelta = amount;
    }

    if (activeDelta !== 0n && env.sourceContract) {
      const bucket = this.key(env.sourceContract, env.holder);
      const current = bucket.get(env.holder.toLowerCase()) ?? 0n;
      bucket.set(env.holder.toLowerCase(), current + activeDelta);
    }

const record: HoldRecord = {
      key,
      op: env.op,
      status,
      assetId: env.assetId,
      token: env.sourceContract,
      holder: env.holder,
      claimant: env.escrow,
      to: env.to ?? '',
      partition: env.partition,
      amount,
      expiration: env.expiration ? BigInt(env.expiration) : undefined,
      consensusTs: env.consensusTs ?? ''
    };
    this.records.unshift(record);
    return record;
  }

  /** Total active encumbrance held against a holder for a token. */
  totalHeld(token: string, holder: string): bigint {
    return this.key(token.toLowerCase(), holder.toLowerCase()).get(holder.toLowerCase()) ?? 0n;
  }

  activeHolds(token: string, holder?: string): HoldRecord[] {
    const lower = token.toLowerCase();
    return this.records.filter(
      (r) => r.token.toLowerCase() === lower && r.status === 'active' && (!holder || r.holder.toLowerCase() === holder.toLowerCase())
    );
  }

  summaryFor(token: string, holder?: string): HolderSummary[] {
    if (holder) {
      return [
        {
          holder,
          held: this.totalHeld(token, holder),
          activeHolds: this.activeHolds(token, holder)
        }
      ];
    }
    const byHolder = new Map<string, HoldRecord[]>();
    for (const r of this.activeHolds(token)) {
      const h = r.holder.toLowerCase();
      if (!byHolder.has(h)) byHolder.set(h, []);
      byHolder.get(h)!.push(r);
    }
    return [...byHolder.entries()].map(([h, holds]) => ({
      holder: h,
      held: holds.reduce((s, r) => s + r.amount, 0n),
      activeHolds: holds
    }));
  }

  history(limit = 200): HoldRecord[] {
    return this.records.slice(0, limit);
  }
}
