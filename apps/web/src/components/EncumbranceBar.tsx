import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { TokenAsset } from '@/data/mock'

interface EncumbranceBarProps {
  asset: TokenAsset
  onPledge?: () => void
}

export function EncumbranceBar({ asset, onPledge }: EncumbranceBarProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

  const totalBalance = asset.totalBalance
  const claimSegments = asset.claims.filter(c => c.status === 'Active')
  const heldPercent = (asset.totalHeld / totalBalance) * 100
  const availablePercent = (asset.availableBalance / totalBalance) * 100

  const segmentColors = [
    { bg: 'bg-amber-500', hover: 'bg-amber-400', text: 'text-amber-500' },
    { bg: 'bg-orange-500', hover: 'bg-orange-400', text: 'text-orange-500' },
    { bg: 'bg-red-500', hover: 'bg-red-400', text: 'text-red-500' },
  ]

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text">{asset.name}</h3>
          <span className="text-xs font-mono text-text-muted">{asset.symbol} · {formatCurrency(totalBalance)}</span>
        </div>
        {onPledge && (
          <button
            onClick={onPledge}
            className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/30 hover:bg-primary/20 transition-all"
          >
            + Pledge Claim
          </button>
        )}
      </div>

      <div className="relative h-10 rounded-lg overflow-hidden flex bg-surface-raised mb-3">
        {claimSegments.map((claim, i) => {
          const percent = (claim.amount / totalBalance) * 100
          const color = segmentColors[i % segmentColors.length]
          return (
            <div
              key={claim.claimId}
              className={`h-full ${hoveredSegment === claim.claimId ? color.hover : color.bg} transition-all cursor-pointer relative`}
              style={{ width: `${percent}%` }}
              onMouseEnter={() => setHoveredSegment(claim.claimId)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              {hoveredSegment === claim.claimId && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs whitespace-nowrap z-10 shadow-lg">
                  <div className="font-semibold text-text">{claim.claimantName}</div>
                  <div className={`font-mono ${color.text}`}>{formatCurrency(claim.amount)}</div>
                </div>
              )}
            </div>
          )
        })}
        {asset.availableBalance > 0 && (
          <div
            className={`h-full transition-all ${hoveredSegment === 'available' ? 'bg-emerald-400' : 'bg-emerald-500/30'} cursor-pointer relative`}
            style={{ width: `${availablePercent}%` }}
            onMouseEnter={() => setHoveredSegment('available')}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            {hoveredSegment === 'available' && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs whitespace-nowrap z-10 shadow-lg">
                <div className="font-semibold text-text">Available</div>
                <div className="font-mono text-primary">{formatCurrency(asset.availableBalance)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          {claimSegments.map((claim, i) => (
            <div key={claim.claimId} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${segmentColors[i % segmentColors.length].bg}`} />
              <span className="text-text-secondary">{claim.claimantName}</span>
              <span className="font-mono text-text-muted">{formatCurrency(claim.amount)}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
            <span className="text-text-secondary">Available</span>
            <span className="font-mono text-primary">{formatCurrency(asset.availableBalance)}</span>
          </div>
        </div>
        <span className="font-mono text-text-muted">
          {heldPercent.toFixed(0)}% encumbered
        </span>
      </div>
    </div>
  )
}
