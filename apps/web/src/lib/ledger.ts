import { createPublicClient, http, parseAbi, decodeEventLog, decodeErrorResult } from 'viem'
import type { Hex, WalletClient, Log } from 'viem'
import { hederaTestnet } from '@/lib/wagmi'

export const LEDGER_ADDRESS = '0xfa01E5b4F2765F33790e8d89A8620bdFd3a16958'
export const REGISTRY_ANCHOR_ADDRESS = '0x12E99d5F169eB3b34aabFb2936619febe7da0754'
export const MIRROR_BASE_URL = 'https://testnet.mirrornode.hedera.com/api/v1'
export const HASHSCAN_BASE = 'https://hashscan.io/testnet'
export const PARTITION_ID_1 =
  '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex
export const GAS_LIMIT = 800_000n

export const ledgerAbi = parseAbi([
  'function owner() view returns (address)',
  'function staleAfterSec() view returns (uint256)',
  'function vaultBalanceUnits(bytes32) view returns (uint256)',
  'function totalEncumbered(bytes32) view returns (uint256)',
  'function totalDeposited(bytes32) view returns (uint256)',
  'function availableUnits(bytes32) view returns (uint256)',
  'function unitUsd18Of(bytes32) view returns (uint256)',
  'function collateralUsd18Of(bytes32) view returns (uint256)',
  'function outstandingUsd18Of(bytes32) view returns (uint256)',
  'function coverageBpsOf(bytes32) view returns (uint256)',
  'function healthFactor18Of(bytes32) view returns (uint256)',
  'function positionLoanUnitUsd18(bytes32,address) view returns (uint256)',
  'function creditorsOf(bytes32) view returns (address[])',
  'function isDefaulted(bytes32,address) view returns (bool)',
  'function platforms(bytes32) view returns (address token, address feed, uint8 feedDecimals, uint8 tokenDecimals, uint256 coverageThresholdBps, uint256 interestBps, uint256 borrowCapUnits, uint256 maturityTs, uint256 defaultGraceSec, bool active, bool liquidated, uint256 totalDepositedUnits, uint256 totalEncumberedUnits)',
  'function deposits(bytes32,address) view returns (uint256)',
  'function positions(bytes32,address) view returns (uint256 loanUnits, uint256 loanUnitUsd18, uint256 holdId, uint256 createdAt)',
  'function deposit(bytes32,address,uint256)',
  'function withdraw(bytes32,uint256)',
  'function requestLoan(bytes32,address,uint256)',
  'function repay(bytes32,address)',
  'function settle(bytes32)',
  'event PlatformConfigured(bytes32 indexed platformId, address token, address feed, uint256 coverageThresholdBps, uint256 borrowCapUnits)',
  'event Deposited(bytes32 indexed platformId, address indexed depositor, uint256 units)',
  'event EncumbranceCreated(bytes32 indexed platformId, address indexed creditor, uint256 units, uint256 unitUsd18, uint256 holdId)',
  'event EncumbranceReleased(bytes32 indexed platformId, address indexed creditor, uint256 units)',
  'event CollateralWithdrawn(bytes32 indexed platformId, address indexed depositor, uint256 units)',
  'event PlatformLiquidated(bytes32 indexed platformId, uint256 coverageBps, uint256 thresholdBps)',
  'event StaleAfterUpdated(uint256 staleAfterSec)',
  'event DefaultGraceUpdated(bytes32 indexed platformId, uint256 graceSec)',
])

export const anchorAbi = parseAbi([
  'function getInstances() view returns ((bytes32 platformId, string operator, uint256 assetDiamondEntity, address assetEvm, string assetName, string assetSymbol, uint8 assetDecimals, uint256 faceValue, uint256 maturityTs, bool active)[])',
])

export const errorAbi = parseAbi([
  'error InsufficientCollateral(bytes32 platformId, uint256 requestedUnits, uint256 availableUnits)',
  'error CoverageBelowThreshold(bytes32 platformId, uint256 coverageBps, uint256 thresholdBps)',
  'error PositionAlreadyOpen(bytes32 platformId, address creditor)',
  'error PlatformNotConfigured(bytes32 platformId)',
  'error PlatformNotActive(bytes32 platformId)',
  'error PlatformLiquidatedError(bytes32 platformId)',
  'error PositionNotFound(bytes32 platformId, address creditor)',
  'error TooManyBorrowers(bytes32 platformId)',
  'error NotDepositor(bytes32 platformId, address caller)',
  'error PriceNotPositive(bytes32 platformId, int256 answer)',
  'error StalePrice(bytes32 platformId, uint256 updatedAt)',
])

export const publicClient = createPublicClient({
  chain: hederaTestnet,
  transport: http('https://testnet.hashio.io/api'),
})

export interface PlatformModel {
  token: Hex
  feed: Hex
  feedDecimals: number
  tokenDecimals: number
  coverageThresholdBps: bigint
  interestBps: bigint
  borrowCapUnits: bigint
  maturityTs: bigint
  defaultGraceSec: bigint
  active: boolean
  liquidated: boolean
  totalDepositedUnits: bigint
  totalEncumberedUnits: bigint
}

export interface AnchorInstance {
  platformId: Hex
  operator: string
  assetDiamondEntity: bigint
  assetEvm: Hex
  assetName: string
  assetSymbol: string
  assetDecimals: number
  faceValue: bigint
  maturityTs: bigint
  active: boolean
}

export interface LedgerPosition {
  platformId: string
  creditor: string
  loanUnits: bigint
  loanUnitUsd18: bigint
  holdId: bigint
  createdAt: bigint
  isDefaulted: boolean
}

export type LedgerEventType = 'VAULT_DEPOSITED' | 'VAULT_WITHDRAWN' | 'HOLD_CREATED' | 'HOLD_RELEASED' | 'PLATFORM_LIQUIDATED'

export interface LedgerEvent {
  type: LedgerEventType
  platformId: string
  claimant: string | null
  depositor: string | null
  units: bigint | null
  holdId: bigint | null
  txHash: string
  timestamp: string
}

export interface LedgerWriteOk {
  ok: true
  txHash: string
  holdId?: bigint
  releasedUnits?: bigint
  liquidated?: bigint
}

export interface LedgerWriteErr {
  ok: false
  kind: 'insufficient-collateral' | 'coverage-below-threshold' | 'duplicate-position' | 'other'
  message: string
  requestedUnits?: bigint
  availableUnits?: bigint
  existingPosition?: { creditor: string; loanUnits: bigint; holdId: bigint }
}

export type LedgerWriteResult = LedgerWriteOk | LedgerWriteErr

type Pid = Hex
type Addr = Hex

type RequestLoanArgs = [Pid, Addr, bigint]

const trackedEvents = new Set(['Deposited', 'CollateralWithdrawn', 'EncumbranceCreated', 'EncumbranceReleased', 'PlatformLiquidated'])

function mapEventName(name: string): LedgerEventType | null {
  switch (name) {
    case 'Deposited':
      return 'VAULT_DEPOSITED'
    case 'CollateralWithdrawn':
      return 'VAULT_WITHDRAWN'
    case 'EncumbranceCreated':
      return 'HOLD_CREATED'
    case 'EncumbranceReleased':
      return 'HOLD_RELEASED'
    case 'PlatformLiquidated':
      return 'PLATFORM_LIQUIDATED'
    default:
      return null
  }
}

export async function fetchLedgerEvents(limit = 100): Promise<LedgerEvent[]> {
  const url = `${MIRROR_BASE_URL}/contracts/${LEDGER_ADDRESS}/results/logs?order=desc&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`mirror node log fetch failed (HTTP ${res.status})`)
  const body = (await res.json()) as { logs?: unknown[] }
  const logs = body.logs ?? []

  const events: LedgerEvent[] = []
  for (const raw of logs) {
    const log = raw as { topics?: string[]; data?: string; timestamp?: string; transaction_hash?: string }
    const topics = (log.topics ?? []) as [Hex, ...Hex[]]
    if (topics.length === 0) continue
    let decoded: { eventName: string; args: Record<string, unknown> }
    try {
      decoded = decodeEventLog({ abi: ledgerAbi, data: (log.data ?? '0x') as Hex, topics }) as unknown as {
        eventName: string
        args: Record<string, unknown>
      }
    } catch {
      continue
    }
    if (!trackedEvents.has(decoded.eventName)) continue
    const type = mapEventName(decoded.eventName)
    if (!type) continue
    const args = decoded.args ?? {}
    events.push({
      type,
      platformId: (args.platformId as string) ?? '',
      claimant: (args.creditor as string | undefined) ?? null,
      depositor: (args.depositor as string | undefined) ?? null,
      units: (args.units as bigint | undefined) ?? null,
      holdId: (args.holdId as bigint | undefined) ?? null,
      txHash: (log.transaction_hash ?? '') as string,
      timestamp: (log.timestamp ?? new Date().toISOString()) as string,
    })
  }
  return events
}

export async function fetchPlatform(platformId: string): Promise<PlatformModel | null> {
  try {
    const data = await publicClient.readContract({
      address: LEDGER_ADDRESS,
      abi: ledgerAbi,
      functionName: 'platforms',
      args: [platformId as Pid],
    })
    const [
      token,
      feed,
      feedDecimals,
      tokenDecimals,
      coverageThresholdBps,
      interestBps,
      borrowCapUnits,
      maturityTs,
      defaultGraceSec,
      active,
      liquidated,
      totalDepositedUnits,
      totalEncumberedUnits,
    ] = data as unknown as [Hex, Hex, number, number, bigint, bigint, bigint, bigint, bigint, boolean, boolean, bigint, bigint]
    return {
      token,
      feed,
      feedDecimals,
      tokenDecimals,
      coverageThresholdBps,
      interestBps,
      borrowCapUnits,
      maturityTs,
      defaultGraceSec,
      active,
      liquidated,
      totalDepositedUnits,
      totalEncumberedUnits,
    }
  } catch {
    return null
  }
}

export async function fetchAnchorInstances(): Promise<AnchorInstance[]> {
  const list = await publicClient.readContract({
    address: REGISTRY_ANCHOR_ADDRESS,
    abi: anchorAbi,
    functionName: 'getInstances',
  })
  return (list as unknown as AnchorInstance[]).filter((inst) => inst.active)
}

export async function fetchVaultBalance(platformId: string): Promise<bigint> {
  return publicClient.readContract({
    address: LEDGER_ADDRESS,
    abi: ledgerAbi,
    functionName: 'vaultBalanceUnits',
    args: [platformId as Pid],
  })
}

export async function fetchPositions(platformId: string): Promise<LedgerPosition[]> {
  const creditors = (await publicClient.readContract({
    address: LEDGER_ADDRESS,
    abi: ledgerAbi,
    functionName: 'creditorsOf',
    args: [platformId as Pid],
  })) as unknown as Addr[]

  const out: LedgerPosition[] = []
  for (const creditor of creditors) {
    const data = (await publicClient.readContract({
      address: LEDGER_ADDRESS,
      abi: ledgerAbi,
      functionName: 'positions',
      args: [platformId as Pid, creditor],
    })) as unknown as [bigint, bigint, bigint, bigint]
    const [loanUnits, loanUnitUsd18, holdId, createdAt] = data
    if (loanUnits === 0n) continue
    const isDefaulted = (await publicClient.readContract({
      address: LEDGER_ADDRESS,
      abi: ledgerAbi,
      functionName: 'isDefaulted',
      args: [platformId as Pid, creditor],
    })) as unknown as boolean
    out.push({
      platformId,
      creditor,
      loanUnits,
      loanUnitUsd18,
      holdId,
      createdAt,
      isDefaulted,
    })
  }
  return out
}

export interface LedgerView {
  platform: PlatformModel | null
  vaultBalance: bigint
  totalEncumbered: bigint
  totalDeposited: bigint
  unitUsd18: bigint
}

export async function fetchLedgerView(platformId: string): Promise<LedgerView> {
  const platform = await fetchPlatform(platformId)
  const [vaultBalance, totalEncumbered, unitUsd18] = await Promise.all([
    fetchVaultBalance(platformId),
    publicClient.readContract({
      address: LEDGER_ADDRESS,
      abi: ledgerAbi,
      functionName: 'totalEncumbered',
      args: [platformId as Pid],
    }),
    platform?.active
      ? publicClient.readContract({
          address: LEDGER_ADDRESS,
          abi: ledgerAbi,
          functionName: 'unitUsd18Of',
          args: [platformId as Pid],
        })
      : Promise.resolve(0n),
  ])
  return {
    platform,
    vaultBalance,
    totalEncumbered: totalEncumbered as bigint,
    totalDeposited: platform?.totalDepositedUnits ?? 0n,
    unitUsd18: unitUsd18 as bigint,
  }
}

interface DecodedRevert {
  name?: string
  args?: readonly unknown[]
}

async function decodeRevertData(data: Hex): Promise<DecodedRevert> {
  try {
    const result = decodeErrorResult({ abi: errorAbi, data })
    return { name: result.errorName, args: result.args }
  } catch {
    return {}
  }
}

async function unwrapError(e: unknown): Promise<{ kind: LedgerWriteErr['kind']; message: string; args?: readonly unknown[] }> {
  let data: Hex | undefined
  let message = e instanceof Error ? e.message : String(e)
  const err = e as { data?: Hex; cause?: { data?: Hex } }
  if (err.data) data = err.data
  else if (err.cause && err.cause.data) data = err.cause.data
  const decoded = data ? await decodeRevertData(data) : {}
  if (!decoded.name || !decoded.args) return { kind: 'other', message }
  switch (decoded.name) {
    case 'InsufficientCollateral':
      return { kind: 'insufficient-collateral', message, args: decoded.args }
    case 'CoverageBelowThreshold':
      return { kind: 'coverage-below-threshold', message, args: decoded.args }
    case 'PositionAlreadyOpen':
      return { kind: 'duplicate-position', message, args: decoded.args }
    default:
      return { kind: 'other', message }
  }
}

function decodeLogs(logs: readonly Log[]) {
  const out: { name: string; args: Record<string, unknown> }[] = []
  for (const log of logs) {
    try {
      const d = decodeEventLog({ abi: ledgerAbi, data: log.data, topics: log.topics }) as unknown as {
        eventName: string
        args: Record<string, unknown>
      }
      out.push({ name: d.eventName, args: d.args ?? {} })
    } catch {
      continue
    }
  }
  return out
}

async function writeAndDecode(
  signer: WalletClient,
  functionName: 'requestLoan' | 'repay' | 'settle' | 'withdraw' | 'deposit',
  args: unknown[],
  eventName: string
): Promise<{ txHash: string; args: Record<string, unknown> | null }> {
  const txHash = await signer.writeContract({
    address: LEDGER_ADDRESS,
    abi: ledgerAbi,
    functionName,
    args: args as never,
    chain: signer.chain ?? hederaTestnet,
    gas: GAS_LIMIT,
  } as never)
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as Hex })
  const found = decodeLogs(receipt.logs).find((entry) => entry.name === eventName)
  return { txHash: txHash as string, args: found?.args ?? null }
}

export async function requestLoan(platformId: string, creditor: string, units: bigint, signer: WalletClient): Promise<LedgerWriteResult> {
  const args: RequestLoanArgs = [platformId as Pid, creditor as Addr, units]
  try {
    await publicClient.simulateContract({ address: LEDGER_ADDRESS, abi: ledgerAbi, functionName: 'requestLoan', args })
  } catch (e) {
    const decoded = await unwrapError(e)
    if (decoded.kind === 'insufficient-collateral' && decoded.args) {
      const [, requested, available] = decoded.args as [Pid, bigint, bigint]
      return {
        ok: false,
        kind: decoded.kind,
        requestedUnits: requested,
        availableUnits: available,
        message: `vault holds ${available} free units, ${requested} requested`,
      }
    }
    if (decoded.kind === 'duplicate-position' && decoded.args) {
      const [, existing] = decoded.args as [Pid, Addr]
      try {
        const pos = (await publicClient.readContract({
          address: LEDGER_ADDRESS,
          abi: ledgerAbi,
          functionName: 'positions',
          args: [platformId as Pid, existing],
        })) as unknown as [bigint, bigint, bigint, bigint]
        return {
          ok: false,
          kind: decoded.kind,
          message: `a position for ${existing} is already open`,
          existingPosition: { creditor: existing, loanUnits: pos[0], holdId: pos[2] },
        }
      } catch {
        return { ok: false, kind: decoded.kind, message: `a position for ${existing} is already open` }
      }
    }
    return { ok: false, kind: decoded.kind, message: decoded.message }
  }

  try {
    const { txHash, args: decodedArgs } = await writeAndDecode(signer, 'requestLoan', args, 'EncumbranceCreated')
    return { ok: true, txHash, holdId: (decodedArgs?.holdId as bigint | undefined) ?? undefined }
  } catch (e) {
    const decoded = await unwrapError(e)
    if (decoded.kind === 'insufficient-collateral' && decoded.args) {
      const [, requested, available] = decoded.args as [Pid, bigint, bigint]
      return {
        ok: false,
        kind: decoded.kind,
        requestedUnits: requested,
        availableUnits: available,
        message: decoded.message,
      }
    }
    return { ok: false, kind: decoded.kind, message: decoded.message }
  }
}

export async function repay(platformId: string, creditor: string, signer: WalletClient): Promise<LedgerWriteResult> {
  try {
    const { txHash, args: decodedArgs } = await writeAndDecode(
      signer,
      'repay',
      [platformId as Pid, creditor as Addr],
      'EncumbranceReleased'
    )
    return { ok: true, txHash, releasedUnits: (decodedArgs?.units as bigint | undefined) ?? undefined }
  } catch (e) {
    const decoded = await unwrapError(e)
    return { ok: false, kind: decoded.kind, message: decoded.message }
  }
}

export async function settle(platformId: string, signer: WalletClient): Promise<LedgerWriteResult> {
  try {
    const { txHash, args: decodedArgs } = await writeAndDecode(signer, 'settle', [platformId as Pid], 'PlatformLiquidated')
    return { ok: true, txHash, liquidated: (decodedArgs?.coverageBps as bigint | undefined) ?? undefined }
  } catch (e) {
    const decoded = await unwrapError(e)
    return { ok: false, kind: decoded.kind, message: decoded.message }
  }
}

export async function withdraw(platformId: string, units: bigint, signer: WalletClient): Promise<LedgerWriteResult> {
  try {
    const { txHash, args: decodedArgs } = await writeAndDecode(
      signer,
      'withdraw',
      [platformId as Pid, units],
      'CollateralWithdrawn'
    )
    return { ok: true, txHash, releasedUnits: (decodedArgs?.units as bigint | undefined) ?? undefined }
  } catch (e) {
    const decoded = await unwrapError(e)
    return { ok: false, kind: decoded.kind, message: decoded.message }
  }
}

export async function deposit(platformId: string, depositor: string, units: bigint, signer: WalletClient): Promise<LedgerWriteResult> {
  try {
    const { txHash, args: decodedArgs } = await writeAndDecode(
      signer,
      'deposit',
      [platformId as Pid, depositor as Addr, units],
      'Deposited'
    )
    return { ok: true, txHash, releasedUnits: (decodedArgs?.units as bigint | undefined) ?? undefined }
  } catch (e) {
    const decoded = await unwrapError(e)
    return { ok: false, kind: decoded.kind, message: decoded.message }
  }
}

