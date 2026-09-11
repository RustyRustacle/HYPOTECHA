interface EncumbranceBalance {
  token: string;
  totalBalance: string;
  totalHeld: string;
  availableBalance: string;
}

interface ApiAsset {
  id: string;
  platformId: string;
  name: string;
  symbol: string;
  operator: string;
  decimals: number;
  faceValue: string;
  maturityTs: string;
  entity: string;
  evm: string;
  active: boolean;
}

export interface ApiClaim {
  holdId: string;
  holder: string;
  claimant: string;
  amount: string;
  partition: string;
  createdAt: string;
  status: string;
  statusText?: string;
}

interface ApiConflict {
  existingHoldId?: string;
  existingClaimant?: string;
  existingAmount?: string;
}

export type CreateEncumbranceResult =
  | { ok: true; message: string; claim: ApiClaim }
  | {
      ok: false;
      status: number;
      message: string;
      code?: string;
      reason?: string;
      requested?: string;
      available?: string;
      shortfall?: string;
      conflict?: ApiConflict | null;
    };

export type EventOp = 'HOLD_CREATED' | 'HOLD_RELEASED' | 'HOLD_EXECUTED' | 'CONFLICT_REJECTED';

export interface ApiEvent {
  key: string;
  op: EventOp;
  status: string;
  amount: string;
  holder: string;
  claimant: string;
  to: string | null;
  partition: string;
  expiration: string | null;
  consensusTs: string;
  rejectedCode: string | null;
  rejectedReason: string | null;
  token: string;
  asset: { id: string; name: string; entity: string } | null;
}

export interface ApiOverviewAsset {
  id: string;
  platformId: string;
  name: string;
  symbol: string;
  operator: string;
  faceValue: string;
  entity: string;
  evm: string;
  maturityTs: string;
  balance: string;
  held: string;
  available: string;
  encumberedPct: number;
}

export interface ApiOverview {
  holder: string;
  totals: { faceValue: string; held: string; available: string; encumberedPct: number };
  counts: { active: number; released: number; rejected: number; executed: number; totalRecords: number };
  assets: ApiOverviewAsset[];
  lastEvents: {
    key: string;
    op: EventOp;
    status: string;
    amount: string;
    holder: string;
    claimant: string;
    consensusTs: string;
    rejectedCode: string | null;
    asset: { id: string; entity: string } | null;
  }[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

interface ApiResponse<T> {
  status: number;
  data: T;
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const text = await response.text();
  let data: T | null = null;
  try {
    data = text ? (JSON.parse(text) as T) : null;
  } catch {
    data = null;
  }
  return { status: response.status, data: data as T };
}

export async function fetchAssets(): Promise<ApiAsset[]> {
  const { status, data } = await request<{ assets: ApiAsset[] }>('/api/assets');
  if (status !== 200 || !data?.assets) throw new Error('assets list unavailable');
  return data.assets.filter((a) => a.active);
}

export async function fetchAvailableBalance(token: string, holder?: string): Promise<EncumbranceBalance> {
  const q = holder ? `?holder=${encodeURIComponent(holder)}` : '';
  const { status, data } = await request<EncumbranceBalance>(`/api/assets/${encodeURIComponent(token)}/available-balance${q}`);
  if (status !== 200 || !data) throw new Error('available balance unavailable');
  return data;
}

export async function fetchClaims(token: string): Promise<ApiClaim[]> {
  const { status, data } = await request<{ claims: ApiClaim[] }>(`/api/assets/${encodeURIComponent(token)}/claims`);
  if (status !== 200 || !data) throw new Error('claims list unavailable');
  return data.claims;
}

export async function fetchOverview(): Promise<ApiOverview> {
  const { status, data } = await request<ApiOverview>('/api/overview');
  if (status !== 200 || !data) throw new Error('overview unavailable');
  return data;
}

export async function fetchEvents(params?: { asset?: string; status?: string }): Promise<ApiEvent[]> {
  const q = new URLSearchParams();
  if (params?.asset) q.set('asset', params.asset);
  if (params?.status) q.set('status', params.status);
  const { status, data } = await request<{ events: ApiEvent[] }>(`/api/events${q.size ? `?${q.toString()}` : ''}`);
  if (status !== 200 || !data) throw new Error('events unavailable');
  return data.events;
}

export async function createEncumbrance(payload: {
  token: string;
  holder?: string;
  claimant: string;
  amount: string | number;
  partition?: string;
  materialize?: boolean;
}): Promise<CreateEncumbranceResult> {
  const { status, data } = await request<CreateEncumbranceResult>('/api/encumbrances', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (status === 202 && data && data.ok) return data as { ok: true; message: string; claim: ApiClaim };
  if (data && !data.ok) {
    return {
      ok: false,
      status: data.status ?? status,
      message: data.message ?? 'Encumbrance rejected',
      code: data.code,
      reason: data.reason,
      requested: data.requested,
      available: data.available,
      shortfall: data.shortfall,
      conflict: data.conflict ?? null,
    };
  }
  return { ok: false, status, message: `create encumbrance failed (HTTP ${status})` };
}

export async function releaseEncumbrance(claimId: string): Promise<{ ok: boolean; message: string; claim?: ApiClaim }> {
  const { status, data } = await request<{ message: string; claim?: ApiClaim }>(
    `/api/encumbrances/${encodeURIComponent(claimId)}/release`,
    { method: 'POST' }
  );
  if (status === 200 && data) {
    return { ok: true, message: data.message, claim: data.claim };
  }
  return { ok: false, message: data?.message ?? `release failed (HTTP ${status})` };
}

export function toTokenUnits(amount: number, decimals: number): string {
  return BigInt(Math.round(amount * Math.pow(10, decimals))).toString();
}
