import type { GuardResult } from './types.js';
import { GUARD_CODES, type Envelope, type GuardCode } from './types.js';

/**
 * Service-level enforcement guard. On ATS tokens a hold already locks the
 * holder's `balanceOf` on-chain, so the free (unencumbered) balance IS the
 * token balance. The registry projection is not subtracted again here — it is
 * the mirror used for conflict detection (#REGISTRY-001) and audit.
 */
export function checkEnoughAvailable(params: {
  token: string;
  holder: string;
  balance: bigint;
  held: bigint;
  requested: bigint;
}): GuardResult {
  const available = params.balance;
  const ok = available >= params.requested;
  return {
    ok,
    token: params.token,
    holder: params.holder,
    balance: params.balance,
    held: params.held,
    available,
    requested: params.requested,
    ...(ok ? {} : { code: GUARD_CODES.GUARD_001 as GuardCode, reason: 'Requested amount exceeds the available (unencumbered) balance' })
  };
}

/**
 * Rebuild the envelope fields from raw inputs. `assetId` is the token's
 * platformId (registry key) or EVM address; kept flexible for the service.
 */
export function buildEnvelope(input: {
  op: Envelope['op'];
  assetId: string;
  chainPartition: string;
  sourceContract: string;
  holder: string;
  escrow: string;
  amount: bigint;
  partition?: string;
  to?: string;
  expirationTs?: bigint;
  holdId?: string;
}): Envelope {
  return {
    v: 1,
    op: input.op,
    assetId: input.assetId,
    chainPartition: input.chainPartition,
    sourceContract: input.sourceContract,
    holder: input.holder,
    escrow: input.escrow,
    to: input.to,
    partition: input.partition ?? '',
    amount: input.amount.toString(),
    expiration: input.expirationTs?.toString(),
    holdId: input.holdId
  };
}