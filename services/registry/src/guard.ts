import { AtsToken, checkEnoughAvailable, type GuardResult } from '@hypotheca/sdk';
import type { RegistryProjection } from './projection.js';

export interface GuardVerdict extends GuardResult {
  shortfall: bigint;
  partition: string;
  claimant?: string;
}

/**
 * Evaluate a create-claim request against the global registry projection:
 * available = on-chain token balance(of holder) - active encumbrances (from HCS).
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
    partition: partition ?? '',
    claimant,
    ...(guard.ok ? {} : { code: guard.code })
  };
}