import { Landmark } from 'lucide-react'
import { formatCurrency, formatAddress, cn } from '@/lib/utils'

export interface AssetView {
  id: string
  evm: string
  name: string
  symbol: string
  decimals: number
  faceValue: string
  real: boolean
}

export interface HoldSlice {
  claimId: string
  claimant: string
  amount: number
}

interface LivePreviewProps {
  liveReal: boolean
  selectedAsset: AssetView | null
  activeSlices: HoldSlice[]
  liveTotal: number
  amountNum: number
  overPledge: boolean
  projectedHeld: number
  projectedAvailable: number
}

export function LivePreview({
  liveReal,
  selectedAsset,
  activeSlices,
  liveTotal,
  amountNum,
  overPledge,
  projectedHeld,
  projectedAvailable,
}: LivePreviewProps) {
  return (
    <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-6">
      <div className="liquid-glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h3 className="text-sm font-semibold text-text">Live Position Preview</h3>
          <span className="ml-auto text-[10px] font-mono text-text-muted">
            {liveReal ? 'registry projection' : 'simulated'}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-bold text-xs">
              {(selectedAsset?.symbol ?? '—').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-text">{selectedAsset?.name ?? '…'}</div>
              <div className="text-[10px] font-mono text-text-muted">
                {selectedAsset?.symbol ?? ''}
                {liveReal && selectedAsset ? ` · ${formatAddress(selectedAsset.evm)}` : ''}
              </div>
            </div>
          </div>
          <Landmark className="w-4 h-4 text-text-muted" />
        </div>

        <div className="h-10 rounded-xl overflow-hidden flex bg-black/30 border border-white/10 mb-3">
          {activeSlices.map((slice, i) => (
            <div
              key={slice.claimId}
              title={slice.claimant}
              className={cn(
                'h-full',
                i % 2 === 0
                  ? 'bg-gradient-to-r from-amber-400/90 to-orange-500/90'
                  : 'bg-gradient-to-r from-sky-400/90 to-blue-500/90'
              )}
              style={{ width: `${(liveTotal ? (slice.amount / liveTotal) * 100 : 0)}%` }}
            />
          ))}
          {amountNum > 0 && !overPledge && (
            <div
              className="h-full bg-gradient-to-r from-emerald-400/80 to-teal-400/80 border-x-2 border-dashed border-white/40 animate-pulse"
              style={{ width: `${(liveTotal ? (amountNum / liveTotal) * 100 : 0)}%` }}
            />
          )}
          <div
            className="h-full bg-emerald-500/20"
            style={{ width: `${(liveTotal ? (Math.max(0, projectedAvailable) / liveTotal) * 100 : 0)}%` }}
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
            Registry Projection · {selectedAsset?.symbol ?? ''}
          </div>
          <div className="space-y-1.5">
            {activeSlices.length === 0 && (
              <div className="text-xs text-text-muted py-2">
                No active holds — the full balance is unencumbered.
              </div>
            )}
            {activeSlices.map((slice) => (
              <div
                key={slice.claimId}
                className="flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5 bg-black/20 border border-white/[0.05]"
              >
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                  {formatAddress(slice.claimant)}
                </span>
                <span className="font-mono text-text">{formatCurrency(slice.amount)}</span>
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
  )
}