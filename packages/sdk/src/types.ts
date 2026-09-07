/** Envelope types for the universal encumbrance registry data bus (HCS). */

export const ENVELOPE_VERSION = 1;

/** Registry event operations published to the HCS data bus. */
export const EVENT_OPS = {
  HOLD_CREATED: 'HOLD_CREATED',
  HOLD_RELEASED: 'HOLD_RELEASED',
  HOLD_EXECUTED: 'HOLD_EXECUTED',
  CONFLICT_REJECTED: 'CONFLICT_REJECTED'
} as const;

export type EventOp = (typeof EVENT_OPS)[keyof typeof EVENT_OPS];

/** Enforcement guard outcome codes (service-level). */
export const GUARD_CODES = {
  /** On-chain available-balance guard failed (amount > held-free balance). */
  GUARD_001: '#GUARD-001',
  /** Off-chain registry projection detected a conflicting active encumbrance. */
  REGISTRY_001: '#REGISTRY-001'
} as const;

export type GuardCode = (typeof GUARD_CODES)[keyof typeof GUARD_CODES];

/**
 * Canonical envelope message written to the HCS topic.
 * Mirrors the RegistryAnchor onboarding data plus the event payload.
 */
export interface Envelope {
  v: number;
  op: EventOp;
  assetId: string;
  chainPartition: string;
  sourceContract: string;
  holdId?: string;
  holder: string;
  escrow: string;
  to?: string;
  partition: string;
  amount: string;
  expiration?: string;
  txId?: string;
  consensusTs?: string;
  rejectedCode?: GuardCode;
  rejectedReason?: string;
}

/** On-chain instance record matching RegistryAnchor.Instance. */
export interface AnchorInstance {
  platformId: string;
  operator: string;
  assetDiamondEntity: bigint;
  assetEvm: string;
  assetName: string;
  assetSymbol: string;
  assetDecimals: number;
  faceValue: bigint;
  maturityTs: bigint;
  active: boolean;
}

/** Result of an availability / guard check. */
export interface GuardResult {
  ok: boolean;
  token: string;
  holder: string;
  balance: bigint;
  held: bigint;
  available: bigint;
  requested: bigint;
  code?: GuardCode;
  reason?: string;
}

/** A submitted claim outcome (envelope published + hold created). */
export interface ClaimResult {
  ok: boolean;
  envelope?: Envelope;
  hcsTxId?: string;
  atsHoldId?: string;
  guard?: GuardResult;
  error?: string;
}