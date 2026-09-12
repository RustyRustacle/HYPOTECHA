import { useCallback, useEffect, useState } from 'react'
import { fetchAssets, fetchClaims, fetchEvents, fetchOverview, type ApiEvent, type ApiOverview, type ApiOverviewAsset, type EventOp } from '@/lib/hypotheca'
import { formatAddress } from '@/lib/utils'

export const HCS_TOPIC_ID = '0.0.10401182'

const KNOWN_CLAIMANTS: Record<string, string> = {
  '0x1111111111111111111111111111111111111111': 'Bank A',
  '0x2222222222222222222222222222222222222222': 'Bank B',
  '0x3333333333333333333333333333333333333333': 'Bank C',
}

export const OPERATOR_LABEL = 'Demo Treasury (operator)'

export function claimantLabel(address: string): string {
  const lower = address.toLowerCase()
  if (KNOWN_CLAIMANTS[lower]) return KNOWN_CLAIMANTS[lower] ?? ''
  return formatAddress(address)
}

export function obligorLabel(address: string, operator: string): string {
  if (operator && address.toLowerCase() === operator.toLowerCase()) return OPERATOR_LABEL
  return formatAddress(address)
}

export interface BarSlice {
  claimId: string
  claimant: string
  claimantName: string
  amount: number
}

export interface AssetBarView {
  id: string
  symbol: string
  name: string
  operator: string
  entity: string
  totalBalance: number
  totalHeld: number
  availableBalance: number
  unitUsd: number
  claims: BarSlice[]
}

export type ClaimStatus = 'Active' | 'Released' | 'Rejected'

export interface ClaimRow {
  key: string
  tokenName: string
  token: string
  obligor: string
  obligorName: string
  claimant: string
  claimantName: string
  amount: number
  status: ClaimStatus
  consensusTs?: string
}

export interface EventRow {
  id: string
  type: EventOp
  platformId: string
  tokenName: string
  claimantName: string
  amount: number
  timestamp: number
  detail?: string
}

export interface RegistryLane {
  id: string
  label: string
  operator: string
  held: number
  records: number
}

function toNumber(value: string): number {
  return Number(value)
}

function consensusToTimestamp(consensusTs: string): number {
  const parsed = Date.parse(consensusTs)
  return Number.isNaN(parsed) ? Date.now() / 1000 : parsed / 1000
}

export function shaperOverviewAssets(overview: ApiOverview, claimsMap: Map<string, BarSlice[]>): AssetBarView[] {
  return overview.assets.map((a: ApiOverviewAsset) => ({
    id: a.id,
    symbol: a.symbol,
    name: a.name,
    operator: a.operator,
    entity: a.entity,
    totalBalance: toNumber(a.balance) + toNumber(a.held),
    totalHeld: toNumber(a.held),
    availableBalance: toNumber(a.available),
    unitUsd: a.unitUsd18 ? toNumber(a.unitUsd18) / 1e18 : 1,
    claims: claimsMap.get(a.id) ?? [],
  }))
}

export async function buildClaimsMap(): Promise<Map<string, BarSlice[]>> {
  const assets = await fetchAssetsList()
  const map = new Map<string, BarSlice[]>()
  await Promise.all(
    assets.map(async (a) => {
      try {
        const claims = await fetchClaims(a.id)
        const slices = claims
          .filter((c) => c.status === 'active' || c.status === 'Active')
          .map((c) => ({
            claimId: c.holdId,
            claimant: c.claimant,
            claimantName: claimantLabel(c.claimant),
            amount: toNumber(c.amount),
          }))
        map.set(a.id, slices)
      } catch {
        map.set(a.id, [])
      }
    })
  )
  return map
}

async function fetchAssetsList() {
  return fetchAssets()
}

export function shapeClaimRows(events: ApiEvent[], operator: string): ClaimRow[] {
  return events
    .filter(
      (e) =>
        (e.op === 'HOLD_CREATED' || e.op === 'HOLD_RELEASED') &&
        e.status !== 'rejected' &&
        e.status !== 'Rejected'
    )
    .map((e) => ({
      key: e.key,
      tokenName: e.asset?.id ?? e.token,
      token: e.token,
      obligor: e.holder,
      obligorName: obligorLabel(e.holder, operator),
      claimant: e.claimant,
      claimantName: claimantLabel(e.claimant),
      amount: toNumber(e.amount),
      status: (e.status === 'active' ? 'Active' : 'Released') as ClaimStatus,
      consensusTs: e.consensusTs,
    }))
}

export function shapeEventRows(events: ApiEvent[]): EventRow[] {
  return events.map((e) => ({
    id: e.key,
    type: e.op,
    platformId: e.asset?.id ?? 'REG',
    tokenName: e.asset?.id ?? e.token,
    claimantName: claimantLabel(e.claimant),
    amount: toNumber(e.amount),
    timestamp: consensusToTimestamp(e.consensusTs),
    detail: e.rejectedCode ? `${e.rejectedCode}${e.rejectedReason ? ` · ${e.rejectedReason}` : ''}` : undefined,
  }))
}

export function shapeLanes(list: AssetBarView[]): RegistryLane[] {
  return list.map((a) => ({
    id: a.id,
    label: a.symbol,
    operator: a.operator,
    held: a.totalHeld,
    records: a.claims.length,
  }))
}

export interface OverviewState {
  data: ApiOverview | null
  error: string | null
  loading: boolean
  refresh: () => void
}

export function useOverview(intervalMs = 15_000): OverviewState {
  const [data, setData] = useState<ApiOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const run = useCallback(() => {
    let cancelled = false
    fetchOverview()
      .then((ov) => {
        if (cancelled) return
        setData(ov)
        setError(null)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    run()
    const t = setInterval(run, intervalMs)
    return () => clearInterval(t)
  }, [run, tick, intervalMs])

  const refresh = useCallback(() => setTick((k) => k + 1), [])
  return { data, error, loading, refresh }
}

export interface EventsState {
  events: ApiEvent[]
  error: string | null
  loading: boolean
  refresh: () => void
}

export function useEvents(intervalMs = 15_000, asset?: string, status?: string): EventsState {
  const [events, setEvents] = useState<ApiEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const run = useCallback(() => {
    let cancelled = false
    fetchEvents({ asset, status })
      .then((list) => {
        if (cancelled) return
        setEvents(list)
        setError(null)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setEvents([])
        setError(String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [asset, status])

  useEffect(() => {
    run()
    const t = setInterval(run, intervalMs)
    return () => clearInterval(t)
  }, [run, tick, intervalMs])

  const refresh = useCallback(() => setTick((k) => k + 1), [])
  return { events, error, loading, refresh }
}