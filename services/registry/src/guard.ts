import { AtsToken, checkEnoughAvailable, GUARD_CODES, type GuardResult } from '@hypotheca/sdk';
import type { RegistryProjection } from './projection.js';

export interface ConflictDetail {
  existingHoldId: string;
  existingClaimant?: string;
  existingAmount: bigint;
}

export interface GuardVerdict extends GuardResult {
  shortfall: bigint;
  partition: string;
  claimant?: string;
  reason?: string;
  conflict?: ConflictDetail;
}

/**
 * Evaluate a create-claim request against the global registry projection:
 * available = on-chain ATS token balance of the holder (holds already lock the
 * balance on-chain, so the project is not double-counted here).
 *
 * Two-stage enforcement:
 *  #REGISTRY-001  duplicate pledge — the same collateral slice (token+holder+partition)
 *                 already carries an active encumbrance for the same counterparty.
 *  #GUARD-001     requested amount exceeds the available (unencumbered) balance.
 */
export async function makeVerdict(
  projection: RegistryProjection,
  tokenAddress: string,
  holder: string,
  requested: bigint,
  rpcUrl: string,
  partition?: string,
  claimant?: string
): Promise<GuardVerdict> {
  const ats = AtsToken.fromRpc(tokenAddress, rpcUrl);
  const balance = await ats.balanceOf(holder);
  const held = projection.totalHeld(tokenAddress, holder);
  const slice = partition ?? '';

  if (slice) {
    const existing = projection.findActiveConflict(tokenAddress, holder, slice, claimant);
    if (existing) {
      return {
        ok: false,
        token: tokenAddress,
        holder,
        balance,
        held,
        available: balance,
        requested,
        shortfall: 0n,
        partition: slice,
        claimant,
        code: GUARD_CODES.REGISTRY_001,
        reason: `Conflicting active encumbrance already exists on partition ${slice}`,
        conflict: {
          existingHoldId: existing.key,
          existingClaimant: existing.claimant,
          existingAmount: existing.amount
        }
      };
    }
  }

  const guard = checkEnoughAvailable({
    token: tokenAddress,
    holder,
    balance,
    held,
    requested
  });

  const shortfall = requested > guard.available ? requested - guard.available : 0n;

  return {
    ok: guard.ok,
    token: tokenAddress,
    holder,
    balance,
    held,
    available: guard.available,
    requested,
    shortfall,
    partition: slice,
    claimant,
    reason: guard.reason,
    ...(guard.ok ? {} : { code: guard.code })
  };
}