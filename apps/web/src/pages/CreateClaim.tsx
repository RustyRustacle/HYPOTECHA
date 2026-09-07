import { useState } from 'react'
import { ChevronDown, BadgePlus, CircleCheckBig, RefreshCw, Landmark, ArrowRight } from 'lucide-react'
import { PageHero } from '@/components/PageHero'
import { RejectionModal, type RejectionReason } from '@/components/RejectionModal'
import type { PlatformContext } from '@/components/PlatformLanes'
import { formatCurrency, cn } from '@/lib/utils'
import { mockAssets, mockPlatforms, platformById } from '@/data/mock'

interface CreateClaimProps {
  onNavigate: (page: string) => void
  defaultPlatformId?: PlatformContext
}

type Status = 'idle' | 'pending' | 'success'

export function CreateClaim({ onNavigate, defaultPlatformId = 'registry' }: CreateClaimProps) {
  const [selectedAsset, setSelectedAsset] = useState(mockAssets[0])
  const [selectedPlatform, setSelectedPlatform] = useState(
    platformById(defaultPlatformId === 'registry' ? 'beta' : defaultPlatformId)
  )
  const [claimantAddress, setClaimantAddress] = useState('')
  const [claimantName, setClaimantName] = useState('')
  const [amount, setAmount] = useState('')
  const [showRejection, setShowRejection] = useState(false)
  const [rejectionReason, setRejectionReason] = useState<RejectionReason>('over-pledge')
  const [status, setStatus] = useState<Status>('idle')

  const amountNum = parseFloat(amount) || 0
  const overPledge = amountNum > selectedAsset.availableBalance
  const hasBasics = Boolean(claimantAddress.trim()) && Boolean(claimantName.trim())
  const canSubmit = amountNum > 0 && !overPledge && hasBasics && status !== 'pending'

  const projectedHeld = selectedAsset.totalHeld + (overPledge ? 0 : amountNum)
  const projectedAvailable = Math.max(0, selectedAsset.availableBalance - (overPledge ? 0 : amountNum))

  const assetPlatforms = mockPlatforms.map((p) => ({
    ...p,
    held: selectedAsset.claims
      .filter((c) => c.status === 'Active' && c.platformId === p.id)
      .reduce((s, c) => s + c.amount, 0),
  }))

  const handleSubmit = () => {
    if (overPledge) {
      setRejectionReason(selectedPlatform.id === 'alpha' ? 'over-pledge' : 'cross-instance')
      setShowRejection(true)
      return
    }
    if (!canSubmit) return
    setStatus('pending')
    setTimeout(() => setStatus('success'), 1400)
  }

  const reset = () => {
    setStatus('idle')
    setAmount('')
    setClaimantName('')
    setClaimantAddress('')
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
                <p className="text-xs text-text-muted">A record is published to the shared registry</p>
              </div>
            </div>

            {/* Asset select */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
              Select Asset
              {selectedAsset.img && (
                <span className="inline-flex relative w-6 h-6 rounded-md overflow-hidden border border-white/15 shrink-0">
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary bg-surface-raised">
                    {selectedAsset.symbol.slice(0, 2).toUpperCase()}
                  </span>
                  <img
                    src={selectedAsset.img}
                    alt=""
                    loading="lazy"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </span>
              )}
            </label>
              <div className="relative">
                <select
                  value={selectedAsset.address}
                  onChange={(e) => {
                    setSelectedAsset(mockAssets.find((a) => a.address === e.target.value) || mockAssets[0])
                    setAmount('')
                  }}
                  className="w-full appearance-none bg-black/30 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-text focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {mockAssets.map((asset) => (
                    <option key={asset.address} value={asset.address}>
                      {asset.name} ({asset.symbol}) — Available {formatCurrency(asset.availableBalance)}
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
                <span className="text-text-secondary">Available Balance</span>
                <span className="font-mono font-semibold text-primary">{formatCurrency(selectedAsset.availableBalance)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-black/40 border border-white/10 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-amber-400/80 to-orange-500/80 transition-all duration-700"
                  style={{ width: `${(selectedAsset.totalHeld / selectedAsset.totalBalance) * 100}%` }}
                />
                <div
                  className="h-full bg-emerald-500/30 transition-all duration-700"
                  style={{ width: `${(selectedAsset.availableBalance / selectedAsset.totalBalance) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-text-muted mt-2">
                <span>{formatCurrency(selectedAsset.totalHeld)} held</span>
                <span>{((selectedAsset.totalHeld / selectedAsset.totalBalance) * 100).toFixed(0)}% of {formatCurrency(selectedAsset.totalBalance)}</span>
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
                <input
                  type="text"
                  value={claimantAddress}
                  onChange={(e) => setClaimantAddress(e.target.value)}
                  placeholder="0x…"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-text font-mono placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-secondary">Amount (USD)</label>
                {amountNum > 0 && !overPledge && (
                  <span className="text-[11px] font-mono text-primary/80">
                    {formatCurrency(amountNum)} · ~{((amountNum / selectedAsset.totalBalance) * 100).toFixed(1)}% of asset
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
                  Exceeds available or already held on another platform — the registry will reject this.
                </p>
              ) : (
                amountNum > 0 && (
                  <p className="text-xs text-primary/80 mt-1.5 flex items-center gap-1.5">
                    Within the shared free balance — the registry will pass.
                  </p>
                )
              )}
            </div>

            {status === 'success' && (
              <div className="rounded-2xl bg-primary/10 border border-primary/30 p-4 flex items-start gap-3 animate-fade-in-up">
                <span className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <CircleCheckBig className="w-5 h-5 text-primary" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-text">Encumbrance registered on the shared ledger</div>
                  <div className="text-xs text-text-muted mt-1 leading-relaxed">
                    <span className="font-mono text-primary">{formatCurrency(amountNum)}</span> pledged to{' '}
                    <span className="text-text-secondary">{claimantName}</span> on {selectedAsset.symbol}
                    {' '}({selectedPlatform.name}). Available now{' '}
                    <span className="font-mono">{formatCurrency(projectedAvailable)}</span>.
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
                onClick={handleSubmit}
                disabled={!amountNum}
                className={cn(
                  'flex-1 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2',
                  canSubmit
                    ? 'liquid-glass liquid-cta liquid-glass-button'
                    : 'liquid-glass text-text-muted disabled:cursor-not-allowed'
                )}
              >
                {status === 'pending' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Broadcasting…
                  </>
                ) : overPledge && amountNum > 0 ? (
                  <>
                    <TriangleLabel /> Registry will reject
                  </>
                ) : (
                  'Register Pledge'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-6">
          <div className="liquid-glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <h3 className="text-sm font-semibold text-text">Live Position Preview</h3>
              <span className="ml-auto text-[10px] font-mono text-text-muted">simulated</span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-bold text-xs">
                  {selectedAsset.symbol.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-text">{selectedAsset.name}</div>
                  <div className="text-[10px] font-mono text-text-muted">{selectedAsset.symbol}</div>
                </div>
              </div>
              <Landmark className="w-4 h-4 text-text-muted" />
            </div>

            <div className="h-10 rounded-xl overflow-hidden flex bg-black/30 border border-white/10 mb-3">
              {selectedAsset.claims
                .filter((c) => c.status === 'Active')
                .map((claim, i) => (
                  <div
                    key={claim.claimId}
                    className={cn(
                      'h-full',
                      i === 0
                        ? 'bg-gradient-to-r from-amber-400/90 to-orange-500/90'
                        : 'bg-gradient-to-r from-sky-400/90 to-blue-500/90'
                    )}
                    style={{ width: `${(claim.amount / selectedAsset.totalBalance) * 100}%` }}
                  />
                ))}
              {amountNum > 0 && !overPledge && (
                <div
                  className="h-full bg-gradient-to-r from-emerald-400/80 to-teal-400/80 border-x-2 border-dashed border-white/40 animate-pulse"
                  style={{ width: `${(amountNum / selectedAsset.totalBalance) * 100}%` }}
                />
              )}
              <div
                className="h-full bg-emerald-500/20"
                style={{ width: `${(Math.max(0, projectedAvailable) / selectedAsset.totalBalance) * 100}%` }}
              />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Held</span>
                <span className="font-mono font-semibold text-warning">{formatCurrency(projectedHeld)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">New pledge</span>
                <span className="font-mono font-semibold text-emerald-300">
                  {amountNum > 0 && !overPledge ? formatCurrency(amountNum) : '—'}
                </span>
              </div>
              <div className="h-px bg-white/[0.07]" />
              <div className="flex justify-between">
                <span className="text-text-secondary">Remaining available</span>
                <span className="font-mono font-semibold text-primary">{formatCurrency(projectedAvailable)}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.07]">
              <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2">
                Registry Projection · {selectedAsset.symbol}
              </div>
              <div className="space-y-1.5">
                {assetPlatforms.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5',
                      selectedPlatform.id === p.id
                        ? 'bg-primary/[0.06] border border-primary/25'
                        : 'bg-black/20 border border-white/[0.05]'
                    )}
                  >
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      <span className={cn('w-1.5 h-1.5 rounded-full', p.held > 0 ? 'bg-warning' : 'bg-emerald-400/60')} />
                      {p.name.replace('Platform ', '')} <span className="font-mono text-text-muted">[{p.id.toUpperCase()}]</span>
                    </span>
                    <span className="font-mono text-text">{formatCurrency(p.held)} held</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-text mb-3">How the registry checks</h3>
            <div className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
              <p className="flex gap-2"><span className="text-primary">1.</span> The pledge is held on the origin platform via its token contract.</p>
              <p className="flex gap-2"><span className="text-primary">2.</span> The shared ledger checks the global projection across every participating platform.</p>
              <p className="flex gap-2"><span className="text-primary">3.</span> A conflict with any platform is rejected &amp; published to the HCS topic.</p>
            </div>
          </div>
        </div>
      </div>
      </div>

      <RejectionModal
        isOpen={showRejection}
        reason={rejectionReason}
        requestedAmount={amountNum}
        availableAmount={selectedAsset.availableBalance}
        heldOnInstance={selectedAsset.totalHeld}
        originPlatform={selectedPlatform.name}
        conflictedPlatform={platformById(selectedPlatform.id === 'alpha' ? 'beta' : 'alpha').name}
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