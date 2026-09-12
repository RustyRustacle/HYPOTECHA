import type { WalletClient } from 'viem'
import {
  LEDGER_ADDRESS,
  PARTITION_ID_1,
  fetchAnchorInstances,
  fetchLedgerEvents,
  fetchLedgerView,
  fetchPlatform,
  fetchPositions,
  requestLoan,
  repay,
  type LedgerEvent,
} from '@/lib/ledger'

export type EventOp = 'HOLD_CREATED' | 'HOLD_RELEASED' | 'HOLD_EXECUTED' | 'CONFLICT_REJECTED' | 'VAULT_DEPOSITED' | 'VAULT_WITHDRAWN'

export interface EncumbranceBalance {
  token: string
  totalBalance: string
  totalHeld: string
  availableBalance: string
  unitUsd18: string
}

export interface ApiAsset {
  id: string
  platformId: string
  name: string
  symbol: string
  operator: string
  decimals: number
  faceValue: string
  maturityTs: string
  entity: string
  evm: string
  active: boolean
}

export interface ApiClaim {
  holdId: string
  holder: string
  claimant: string
  amount: string
  partition: string
  createdAt: string
  status: string
  statusText?: string
}

export interface ApiConflict {
  existingHoldId?: string
  existingClaimant?: string
  existingAmount?: string
}

export type CreateEncumbranceResult =
  | { ok: true; message: string; claim: ApiClaim }
  | {
      ok: false
      status: number
      message: string
      code?: string
      reason?: string
      requested?: string
      available?: string
      shortfall?: string
      conflict?: ApiConflict | null
    }

export interface ApiEvent {
  key: string
  op: EventOp
  status: string
  amount: string
  holder: string
  claimant: string
  to: string | null
  partition: string
  expiration: string | null
  consensusTs: string
  rejectedCode: string | null
  rejectedReason: string | null
  token: string
  asset: { id: string; name: string; entity: string } | null
}

export interface ApiOverviewAsset {
  id: string
  platformId: string
  name: string
  symbol: string
  operator: string
  faceValue: string
  entity: string
  evm: string
  maturityTs: string
  balance: string
  held: string
  available: string
  encumberedPct: number
  unitUsd18: string
}

export interface ApiOverview {
  holder: string
  totals: { faceValue: string; held: string; available: string; encumberedPct: number }
  counts: { active: number; released: number; rejected: number; executed: number; totalRecords: number }
  assets: ApiOverviewAsset[]
  lastEvents: {
    key: string
    op: EventOp
    status: string
    amount: string
    holder: string
    claimant: string
    consensusTs: string
    rejectedCode: string | null
    asset: { id: string; entity: string } | null
  }[]
}

let assetsCache: ApiAsset[] | null = null
let assetsCacheAt = 0

export async function fetchAssets(useCache = false): Promise<ApiAsset[]> {
  if (useCache && assetsCache && Date.now() - assetsCacheAt < 10_000) return assetsCache
  const instances = await fetchAnchorInstances()
  const supported: ApiAsset[] = []
  for (const inst of instances) {
    const platform = await fetchPlatform(inst.platformId)
    if (!platform?.active || platform.totalDepositedUnits <= 0n) continue
    supported.push({
      id: inst.platformId,
      platformId: inst.platformId,
      name: inst.assetName,
      symbol: inst.assetSymbol,
      operator: inst.operator,
      decimals: inst.assetDecimals,
      faceValue: String(inst.faceValue),
      maturityTs: String(inst.maturityTs),
      entity: inst.operator,
      evm: inst.assetEvm,
      active: true,
    })
  }
  assetsCache = supported
  assetsCacheAt = Date.now()
  return supported
}

export async function fetchAvailableBalance(token: string, _holder?: string): Promise<EncumbranceBalance> {
  const view = await fetchLedgerView(token)
  const held = view.totalEncumbered
  const available = view.vaultBalance
  return {
    token,
    totalBalance: String(held + available),
    totalHeld: String(held),
    availableBalance: String(available),
    unitUsd18: String(view.unitUsd18),
  }
}

export async function fetchClaims(token: string): Promise<ApiClaim[]> {
  const positions = await fetchPositions(token)
  return positions.map((p) => ({
    holdId: String(p.holdId),
    holder: LEDGER_ADDRESS,
    claimant: p.creditor,
    amount: String(p.loanUnits),
    partition: PARTITION_ID_1,
    createdAt: String(p.createdAt),
    status: p.isDefaulted ? 'released' : 'active',
    statusText: p.isDefaulted ? 'liquidated' : 'active on-chain',
  }))
}

export async function fetchOverview(): Promise<ApiOverview> {
  const assets = await fetchAssets()
  const [views, positionsList, ledgerEvents] = await Promise.all([
    Promise.all(assets.map((a) => fetchLedgerView(a.id))),
    Promise.all(assets.map((a) => fetchPositions(a.id))),
    fetchLedgerEvents(60),
  ])

  const assetViews: ApiOverviewAsset[] = assets.map((asset, i) => {
    const view = views[i]
    const unitUsd = Number(view.unitUsd18) / 1e18
    const faceUsd = Number(view.totalDeposited) * unitUsd
    const heldUsd = Number(view.totalEncumbered) * unitUsd
    const availableUsd = Number(view.vaultBalance) * unitUsd
    return {
      id: asset.id,
      platformId: asset.platformId,
      name: asset.name,
      symbol: asset.symbol,
      operator: asset.operator,
      faceValue: String(faceUsd),
      entity: asset.entity,
      evm: asset.evm,
      maturityTs: asset.maturityTs,
      balance: String(availableUsd),
      held: String(heldUsd),
      available: String(availableUsd),
      encumberedPct: faceUsd > 0 ? (heldUsd / faceUsd) * 100 : 0,
      unitUsd18: String(view.unitUsd18),
    }
  })

  const face = assetViews.reduce((s, a) => s + Number(a.faceValue), 0)
  const held = assetViews.reduce((s, a) => s + Number(a.held), 0)
  const available = assetViews.reduce((s, a) => s + Number(a.available), 0)

  const released = ledgerEvents.filter((e) => e.type === 'HOLD_RELEASED').length
  const executed = ledgerEvents.filter((e) => e.type === 'PLATFORM_LIQUIDATED').length
  const active = positionsList.reduce((s, p) => s + p.length, 0)

  const lastEvents = ledgerEvents.slice(0, 5).map((e) => {
    const mapped = mapLedgerEvent(e, assets)
    return {
      key: mapped.key,
      op: mapped.op,
      status: mapped.status,
      amount: mapped.amount,
      holder: mapped.holder,
      claimant: mapped.claimant,
      consensusTs: mapped.consensusTs,
      rejectedCode: mapped.rejectedCode,
      asset: mapped.asset ? { id: mapped.asset.id, entity: mapped.asset.entity } : null,
    }
  })

  return {
    holder: LEDGER_ADDRESS,
    totals: {
      faceValue: String(face),
      held: String(held),
      available: String(available),
      encumberedPct: face > 0 ? (held / face) * 100 : 0,
    },
    counts: { active, released, rejected: 0, executed, totalRecords: active + released + executed },
    assets: assetViews,
    lastEvents,
  }
}

export async function fetchEvents(params?: { asset?: string; status?: string }): Promise<ApiEvent[]> {
  const assets = await fetchAssets(true)
  const ledgerEvents = await fetchLedgerEvents(100)
  let events = ledgerEvents.map((e) => mapLedgerEvent(e, assets))
  if (params?.status) {
    events = events.filter((e) => e.status === params.status)
  }
  return events
}

function mapLedgerEvent(event: LedgerEvent, assets: ApiAsset[]): ApiEvent {
  const asset = assets.find((a) => a.id === event.platformId) ?? assets[0]
  const holdType = event.type === 'HOLD_CREATED' || event.type === 'HOLD_RELEASED'
  const op: EventOp =
    event.type === 'HOLD_CREATED'
      ? 'HOLD_CREATED'
      : event.type === 'HOLD_RELEASED'
        ? 'HOLD_RELEASED'
        : event.type === 'PLATFORM_LIQUIDATED'
          ? 'HOLD_EXECUTED'
          : event.type === 'VAULT_DEPOSITED'
            ? 'VAULT_DEPOSITED'
            : 'VAULT_WITHDRAWN'
  const claimant = event.claimant ?? event.depositor ?? ''
  const suffix = holdType && event.holdId !== null ? `#${event.holdId}` : event.txHash.slice(0, 10)
  return {
    key: holdType && claimant ? `${op}:${claimant}:${suffix}` : event.txHash,
    op,
    status: op === 'HOLD_RELEASED' ? 'released' : 'active',
    amount: event.units !== null ? String(event.units) : '0',
    holder: LEDGER_ADDRESS,
    claimant,
    to: op === 'HOLD_EXECUTED' ? claimant : null,
    partition: PARTITION_ID_1,
    expiration: null,
    consensusTs: event.timestamp,
    rejectedCode: null,
    rejectedReason: null,
    token: asset?.id ?? '',
    asset: asset ? { id: asset.id, name: asset.name, entity: asset.entity } : null,
  }
}

export interface CreateEncumbrancePayload {
  token: string
  holder?: string
  claimant: string
  amount: string | number
  partition?: string
  materialize?: boolean
}

export async function createEncumbrance(
  payload: CreateEncumbrancePayload,
  signer?: WalletClient | null
): Promise<CreateEncumbranceResult> {
  if (!signer) {
    return { ok: false, status: 0, message: 'Connect a wallet to broadcast the pledge on-chain.' }
  }
  const amountBig = BigInt(String(payload.amount))
  const result = await requestLoan(payload.token, payload.claimant.trim(), amountBig, signer)

  if (result.ok) {
    const claim: ApiClaim = {
      holdId: result.holdId !== undefined ? String(result.holdId) : '',
      holder: LEDGER_ADDRESS,
      claimant: payload.claimant.trim(),
      amount: String(amountBig),
      partition: PARTITION_ID_1,
      createdAt: String(Math.floor(Date.now() / 1000)),
      status: 'active',
      statusText: 'active on-chain',
    }
    return {
      ok: true,
      message: result.txHash ? `Hold created on-chain (${result.txHash.slice(0, 14)}…)` : 'Hold created on-chain',
      claim,
    }
  }

  switch (result.kind) {
    case 'insufficient-collateral': {
      const requested = result.requestedUnits?.toString() ?? String(amountBig)
      const available = result.availableUnits?.toString() ?? '0'
      const shortfall = result.requestedUnits !== undefined && result.availableUnits !== undefined
        ? (result.requestedUnits - result.availableUnits).toString()
        : '0'
      return {
        ok: false,
        status: 409,
        message: result.message,
        code: '#GUARD-001',
        reason: 'over-pledge',
        requested,
        available,
        shortfall,
      }
    }
    case 'coverage-below-threshold':
      return {
        ok: false,
        status: 409,
        message: result.message,
        code: '#COVERAGE-001',
        reason: 'over-pledge',
        requested: String(amountBig),
      }
    case 'duplicate-position': {
      const existing = result.existingPosition
      return {
        ok: false,
        status: 409,
        message: result.message,
        code: '#REGISTRY-001',
        reason: 'cross-instance',
        requested: String(amountBig),
        conflict: existing
          ? {
              existingHoldId: String(existing.holdId),
              existingClaimant: existing.creditor,
              existingAmount: String(existing.loanUnits),
            }
          : null,
      }
    }
    default:
      return { ok: false, status: 400, message: result.message, code: 'TX-REVERT' }
  }
}

function extractCreditor(key: string): string {
  if (key.includes(':')) return key.split(':')[1]
  return key
}

export async function releaseEncumbrance(
  claimId: string,
  signer?: WalletClient | null,
  platformId?: string
): Promise<{ ok: boolean; message: string; claim?: ApiClaim }> {
  if (!signer) return { ok: false, message: 'Connect a wallet to broadcast the release.' }
  const creditor = extractCreditor(claimId)
  const pid = platformId ?? (await fetchAssets(true))[0]?.id
  const result = await repay(pid, creditor, signer)
  if (result.ok) {
    return {
      ok: true,
      message: `Repaid and released ${result.releasedUnits?.toString() ?? ''} units on-chain.`,
      claim: {
        holdId: '',
        holder: LEDGER_ADDRESS,
        claimant: creditor,
        amount: result.releasedUnits?.toString() ?? '0',
        partition: PARTITION_ID_1,
        createdAt: '',
        status: 'released',
        statusText: 'released on-chain',
      },
    }
  }
  return { ok: false, message: result.message }
}

export function toTokenUnits(amount: number, decimals: number): string {
  return BigInt(Math.round(amount * Math.pow(10, decimals))).toString()
}