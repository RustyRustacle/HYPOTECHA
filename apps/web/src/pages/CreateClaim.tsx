import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, BadgePlus, CircleCheckBig, RefreshCw, ArrowRight, Wallet, CircleAlert } from 'lucide-react'
import { PageHero } from '@/components/PageHero'
import { RejectionModal, type RejectionReason } from '@/components/RejectionModal'
import { LivePreview, type AssetView, type HoldSlice } from '@/components/create-claim/LivePreview'
import type { PlatformContext } from '@/components/PlatformLanes'
import { formatCurrency, formatAddress, cn } from '@/lib/utils'
import { mockAssets, mockPlatforms, platformById } from '@/data/mock'
import {
  createEncumbrance,
  fetchAssets,
  fetchAvailableBalance,
  fetchClaims,
  toTokenUnits,
  type ApiClaim,
  type CreateEncumbranceResult,
} from '@/lib/hypotheca'

interface CreateClaimProps {
  onNavigate: (page: string) => void
  defaultPlatformId?: PlatformContext
  accountEvm?: string | null
}

type Status = 'idle' | 'pending' | 'success'

export function CreateClaim({ onNavigate, defaultPlatformId = 'registry', accountEvm }: CreateClaimProps) {
  const [assets, setAssets] = useState<AssetView[] | null>(null)
  const [assetsError, setAssetsError] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<AssetView | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState(
    platformById(defaultPlatformId === 'registry' ? 'beta' : defaultPlatformId)
  )
  const [claimantAddress, setClaimantAddress] = useState('')
  const [claimantName, setClaimantName] = useState('')
  const [amount, setAmount] = useState('')
  const [showRejection, setShowRejection] = useState(false)
  const [rejectionReason, setRejectionReason] = useState<RejectionReason>('over-pledge')
  const [rejection, setRejection] = useState<CreateEncumbranceResult & { ok: false } | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdClaim, setCreatedClaim] = useState<ApiClaim | null>(null)

  const [liveAvailable, setLiveAvailable] = useState(0)
  const [liveHeld, setLiveHeld] = useState(0)
  const [liveTotal, setLiveTotal] = useState(0)
  const [liveSlices, setLiveSlices] = useState<HoldSlice[]>([])
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveReal, setLiveReal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const holderAddress = accountEvm ?? undefined

  useEffect(() => {
    let cancelled = false
    fetchAssets()
      .then((list) => {
        if (cancelled) return
        if (!list.length) throw new Error('no active assets')
        const view: AssetView[] = list.map((a) => ({
          id: a.id,
          evm: a.evm,
          name: a.name,
          symbol: a.symbol,
          decimals: a.decimals,
          faceValue: a.faceValue,
          real: true,
        }))
        setAssets(view)
        setSelectedAsset(view[0])
        setAssetsError(null)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setAssets(null)
        setAssetsError(String(e))
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (accountEvm && !claimantAddress) {
      setClaimantAddress(accountEvm)
    }
  }, [accountEvm, claimantAddress])

  const refreshLive = useCallback(
    async (asset: AssetView, holder?: string) => {
      setLiveLoading(true)
      try {
        const [balance, claims] = await Promise.all([
          fetchAvailableBalance(asset.id, holder),
          fetchClaims(asset.id),
        ])
        const d = 10 ** asset.decimals
        setLiveTotal(Number(balance.totalBalance) / d)
        setLiveHeld(Number(balance.totalHeld) / d)
        setLiveAvailable(Number(balance.availableBalance) / d)
        setLiveSlices(
          claims.map((c) => ({
            claimId: c.holdId,
            claimant: c.claimant,
            amount: Number(c.amount) / d,
          }))
        )
        setLiveReal(true)
        setLiveLoading(false)
      } catch {
        setLiveLoading(false)
        setLiveReal(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!selectedAsset) return
    void refreshLive(selectedAsset, holderAddress)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAsset?.id, holderAddress, refreshKey])

  const activeSlices = liveSlices.filter((s) => s.amount > 0)

  useEffect(() => {
    if (assets) return
    const fallback = mockAssets.map((m) => ({
      id: m.symbol,
      evm: m.address,
      name: m.name,
      symbol: m.symbol,
      decimals: 0,
      faceValue: String(m.totalBalance),
      real: false,
    }))
    if (fallback.length) {
      setAssets(fallback)
      setSelectedAsset((prev) => prev ?? fallback[0])
    }
  }, [assets])

  const amountNum = parseFloat(amount) || 0
  const hasBasics = Boolean(claimantAddress.trim()) && Boolean(claimantName.trim())
  const canSubmit = amountNum > 0 && hasBasics && status !== 'pending'
  const overPledge = liveReal && amountNum > liveAvailable
  const decimals = selectedAsset?.decimals ?? 0
  const divider = 10 ** decimals

  const projectedHeld = liveHeld + (overPledge ? 0 : amountNum)
  const projectedAvailable = Math.max(0, liveAvailable - (overPledge ? 0 : amountNum))

  const handleSubmit = async () => {
    if (!canSubmit || !selectedAsset) return
    setSubmitError(null)
    setStatus('pending')
    try {
      const base = {
        token: selectedAsset.id,
        holder: holderAddress,
        claimant: claimantAddress.trim(),
        platformId: selectedPlatform.id,
        amount: toTokenUnits(amountNum, decimals),
      }
      if (!base.holder) delete base.holder
      const res = await createEncumbrance(base)
      if (res.ok) {
        setStatus('success')
        setCreatedClaim(res.claim)
        setRejection(null)
        if (selectedAsset) void refreshLive(selectedAsset, holderAddress)
      } else {
        setStatus('idle')
        if (res.status === 409) {
          const isCross = res.code === '#REGISTRY-001' || String(res.code ?? '').includes('REGISTRY-001')
          setRejectionReason(isCross ? 'cross-instance' : 'over-pledge')
          setRejection({ ...res })
          setShowRejection(true)
        } else {
          setSubmitError(res.message)
        }
      }
    } catch (e) {
      setStatus('idle')
      setSubmitError(String(e))
    }
  }

  const reset = () => {
    setStatus('idle')
    setAmount('')
    setClaimantName('')
    setClaimantAddress('')
    setCreatedClaim(null)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div className="-mt-6">
        <PageHero
          badge="New Encumbrance"
          title="Register a"
          accent="Pledge"
          subtitle="Guard a portion of an asset as collateral. The shared ledger checks the global projection across every platform — and rejects any conflict automatically."
          media={{ kind: 'video', src: '/app-bg/pledge.mp4', opacity: 50 }}
        />
      </div>

      <div className="max-w-6xl space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Form */}
          <div className="lg:col-span-3 relative liquid-glass-strong rounded-3xl p-6 md:p-7">
            <div className="orb w-56 h-56 bg-primary/10 -top-16 -right-16" aria-hidden />
            <div className="relative z-10 space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center">
                  <BadgePlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text">Register Encumbrance</h2>
                  <p className="text-xs text-text-muted">
                    {liveReal ? 'LIVE · verified against the shared HCS registry' : 'simulated preview'}
                  </p>
                </div>
              </div>

              {assetsError && !assets && (
                <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 flex items-start gap-2.5">
                  <CircleAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Registry API unreachable — showing a visual preview. Start the API + registry services
                    to run the real on-chain guard. <span className="font-mono text-warning/80">{assetsError}</span>
                  </p>
                </div>
              )}

              {/* Asset select */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                  Select Asset
                  {selectedAsset?.symbol && (
                    <span className="inline-flex relative w-6 h-6 rounded-md overflow-hidden border border-white/15 shrink-0">
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary bg-surface-raised">
                        {selectedAsset.symbol.slice(0, 2).toUpperCase()}
                      </span>
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={selectedAsset?.id ?? ''}
                    onChange={(e) => {
                      const next = assets?.find((a) => a.id === e.target.value) ?? null
                      setSelectedAsset(next)
                      setAmount('')
                      setCreatedClaim(null)
                      setStatus('idle')
                    }}
                    disabled={!assets?.length}
                    className="w-full appearance-none bg-black/30 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-text focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                  >
                    {!assets && <option>Loading assets…</option>}
                    {assets?.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.symbol}) · {formatCurrency(liveTotal)} total
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>

              {/* Origin platform */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                  Origin Platform
                  {liveReal && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 border border-primary/25 text-primary">
                      on-chain
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={selectedPlatform.id}
                    onChange={(e) => setSelectedPlatform(platformById(e.target.value))}
                    className="w-full appearance-none bg-black/30 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-text focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    {mockPlatforms.map((platform) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.name} · {platform.operator}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>

              {/* Availability preview */}
              <div className="rounded-2xl bg-black/25 border border-white/10 p-4">
                <div className="flex items-center justify-between text-sm mb-2.5">
                  <span className="text-text-secondary">
                    Available Balance{!liveReal && ' (mock)'}
                  </span>
                  <span className="font-mono font-semibold text-primary">
                    {liveLoading ? '…' : formatCurrency(liveAvailable)}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-black/40 border border-white/10 overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400/80 to-orange-500/80 transition-all duration-700"
                    style={{ width: `${(liveTotal ? liveHeld / liveTotal : 0) * 100}%` }}
                  />
                  <div
                    className="h-full bg-emerald-500/30 transition-all duration-700"
                    style={{ width: `${(liveTotal ? liveAvailable / liveTotal : 0) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-text-muted mt-2">
                  <span>{formatCurrency(liveHeld)} held</span>
                  <span>
                    {liveTotal ? `${((liveHeld / liveTotal) * 100).toFixed(0)}%` : '—'} of {formatCurrency(liveTotal)}
                    {liveReal && holderAddress && (
                      <span className="text-text-muted/70"> · holder {formatAddress(holderAddress)}</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Claimant Name</label>
                  <input
                    type="text"
                    value={claimantName}
                    onChange={(e) => setClaimantName(e.target.value)}
                    placeholder="e.g. Bank A"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Claimant Address</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={claimantAddress}
                      onChange={(e) => setClaimantAddress(e.target.value)}
                      placeholder="0x…"
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-text font-mono placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {accountEvm && (
                      <button
                        type="button"
                        onClick={() => setClaimantAddress(accountEvm)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/25 text-[10px] font-mono text-primary hover:bg-primary/20 transition-colors"
                        title="Use connected wallet address"
                      >
                        <Wallet className="w-3 h-3" />
                        {formatAddress(accountEvm)}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-text-secondary">
                    Amount (token units{decimals > 0 && `, ${decimals} decimals`})
                  </label>
                  {amountNum > 0 && !overPledge && liveTotal > 0 && (
                    <span className="text-[11px] font-mono text-primary/80">
                      {formatCurrency(amountNum)} · ~{((amountNum / liveTotal) * 100).toFixed(1)}% of asset
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min={0}
                  className={cn(
                    'w-full bg-black/30 border rounded-xl px-4 py-3 text-sm text-text font-mono placeholder:text-text-muted focus:outline-none focus:ring-2 transition-all',
                    overPledge
                      ? 'border-danger/50 focus:border-danger focus:ring-danger/20'
                      : 'border-white/10 focus:border-primary/50 focus:ring-primary/20'
                  )}
                />
                {overPledge ? (
                  <p className="text-xs text-danger mt-1.5 flex items-center gap-1.5">
                    Exceeds the unencumbered balance — the registry guard will reject this.
                  </p>
                ) : (
                  amountNum > 0 &&
                  (liveReal ? (
                    <p className="text-xs text-primary/80 mt-1.5 flex items-center gap-1.5">
                      Within the shared free balance — the registry guard will pass.
                    </p>
                  ) : (
                    <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1.5">
                      Guard status available once the API is online.
                    </p>
                  ))
                )}
              </div>

              {submitError && (
                <div className="rounded-xl bg-danger/10 border border-danger/30 p-3 flex items-start gap-2.5">
                  <CircleAlert className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary leading-relaxed font-mono">{submitError}</p>
                </div>
              )}

              {status === 'success' && createdClaim && (
                <div className="rounded-2xl bg-primary/10 border border-primary/30 p-4 flex items-start gap-3 animate-fade-in-up">
                  <span className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <CircleCheckBig className="w-5 h-5 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text">Encumbrance registered on the shared ledger</div>
                    <div className="text-xs text-text-muted mt-1 leading-relaxed">
                      <span className="font-mono text-primary">{formatCurrency(amountNum)}</span> pledged to{' '}
                      <span className="text-text-secondary">{claimantName}</span> on {selectedAsset?.symbol}
                      {' ('} {selectedPlatform.name}
                      {').'} Available now <span className="font-mono">{formatCurrency(projectedAvailable)}</span>.
                    </div>
                    <div className="text-[10px] font-mono text-text-muted mt-1.5">
                      hold {createdClaim.holdId ?? 'pending'} · {createdClaim.statusText}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={reset}
                        className="px-3.5 py-1.5 rounded-lg liquid-glass liquid-glass-button text-xs font-semibold"
                      >
                        Create another
                      </button>
                      <button
                        onClick={() => onNavigate('dashboard')}
                        className="px-3.5 py-1.5 rounded-lg liquid-glass liquid-cta liquid-glass-button text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        Dashboard <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="flex-1 px-5 py-3 rounded-xl liquid-glass liquid-glass-button text-sm font-medium text-text-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleSubmit()}
                  disabled={!canSubmit && !overPledge}
                  className={cn(
                    'flex-1 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2',
                    canSubmit ? 'liquid-glass liquid-cta liquid-glass-button' : 'liquid-glass text-text-muted disabled:cursor-not-allowed'
                  )}
                >
                  {status === 'pending' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Broadcasting…
                    </>
                  ) : overPledge && amountNum > 0 ? (
                    <>
                      <TriangleLabel /> Guard will reject
                    </>
                  ) : (
                    'Register Pledge'
                  )}
                </button>
              </div>
            </div>
          </div>

          <LivePreview
            liveReal={liveReal}
            selectedAsset={selectedAsset}
            activeSlices={activeSlices}
            liveTotal={liveTotal}
            amountNum={amountNum}
            overPledge={overPledge}
            projectedHeld={projectedHeld}
            projectedAvailable={projectedAvailable}
          />
        </div>
      </div>

      <RejectionModal
        isOpen={showRejection}
        reason={rejectionReason}
        requestedAmount={amountNum}
        availableAmount={rejection?.available ? Number(rejection.available) / divider : liveAvailable}
        shortfallAmount={rejection?.shortfall ? Number(rejection.shortfall) / divider : Math.max(0, amountNum - liveAvailable)}
        heldOnInstance={liveHeld}
        originPlatform={selectedPlatform.name}
        conflictedPlatform={mockPlatforms.find((p) => p.id !== selectedPlatform.id)?.name ?? 'another platform'}
        conflictCode={rejection?.code}
        existingHoldId={rejection?.conflict?.existingHoldId}
        existingClaimant={rejection?.conflict?.existingClaimant}
        existingAmount={rejection?.conflict?.existingAmount ? Number(rejection.conflict.existingAmount) / divider : undefined}
        onClose={() => setShowRejection(false)}
        onRetry={() => {
          setShowRejection(false)
          setAmount('')
        }}
      />
    </div>
  )
}

function TriangleLabel() {
  return (
    <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}