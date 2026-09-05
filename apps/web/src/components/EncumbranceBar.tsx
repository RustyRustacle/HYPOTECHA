import { useEffect, useState } from 'react'
import { BadgePlus, CircleDot } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useSectionReveal } from '@/lib/useSectionReveal'
import { cn } from '@/lib/utils'
import type { TokenAsset } from '@/data/mock'

interface EncumbranceBarProps {
  asset: TokenAsset
  onPledge?: () => void
}

const segmentStyles = [
  { bar: 'bg-gradient-to-r from-amber-400/90 to-orange-500/90', dot: 'bg-gradient-to-br from-amber-400 to-orange-500', text: 'text-amber-300' },
  { bar: 'bg-gradient-to-r from-sky-400/90 to-blue-500/90', dot: 'bg-gradient-to-br from-sky-400 to-blue-500', text: 'text-sky-300' },
  { bar: 'bg-gradient-to-r from-violet-400/90 to-indigo-500/90', dot: 'bg-gradient-to-br from-violet-400 to-indigo-500', text: 'text-violet-300' },
]

export function EncumbranceBar({ asset, onPledge }: EncumbranceBarProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { ref, visible } = useSectionReveal<HTMLDivElement>(0.2)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150)
    return () => clearTimeout(t)
  }, [])

  const totalBalance = asset.totalBalance
  const activeClaims = asset.claims.filter((c) => c.status === 'Active')
  const heldPercent = (asset.totalHeld / totalBalance) * 100
  const width = (amount: number) => (mounted && visible ? `${(amount / totalBalance) * 100}%` : '0%')

  return (
    <div
      ref={ref}
      className={cn(
        'group relative liquid-glass rounded-2xl p-6 transition-all duration-500',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {asset.symbol.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-text truncate">{asset.name}</h3>
              <span className="text-xs font-mono text-text-muted">
                {asset.symbol} · <span className="text-text-secondary">{formatCurrency(totalBalance)}</span>
              </span>
            </div>
          </div>
          {onPledge && (
            <button
              onClick={onPledge}
              className="shrink-0 liquid-glass liquid-cta liquid-glass-button px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <BadgePlus className="w-3.5 h-3.5" />
              Pledge
            </button>
          )}
        </div>

        {/* Bar */}
        <div className="relative h-11 rounded-xl overflow-hidden flex bg-black/30 border border-white/10 mb-3">
          {activeClaims.map((claim, i) => {
            const style = segmentStyles[i % segmentStyles.length]
            return (
              <div
                key={claim.claimId}
                className={cn('h-full cursor-pointer relative transition-all duration-1000 ease-out', style.bar)}
                style={{ width: width(claim.amount) }}
                onMouseEnter={() => setHovered(claim.claimId)}
                onMouseLeave={() => setHovered(null)}
              >
                {hovered === claim.claimId && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0b1120] border border-white/15 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap z-20 shadow-2xl">
                    <div className="font-semibold text-text">{claim.claimantName}</div>
                    <div className={cn('font-mono', style.text)}>{formatCurrency(claim.amount)}</div>
                  </div>
                )}
              </div>
            )
          })}
          {asset.availableBalance > 0 && (
            <div
              className={cn(
                'h-full cursor-pointer relative transition-all duration-1000 ease-out',
                hovered === 'available' ? 'bg-emerald-400/60' : 'bg-emerald-500/25'
              )}
              style={{ width: width(asset.availableBalance) }}
              onMouseEnter={() => setHovered('available')}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === 'available' && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0b1120] border border-white/15 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap z-20 shadow-2xl">
                  <div className="font-semibold text-text">Available</div>
                  <div className="font-mono text-emerald-300">{formatCurrency(asset.availableBalance)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            {activeClaims.map((claim, i) => (
              <div key={claim.claimId} className="flex items-center gap-1.5">
                <span className={cn('w-2.5 h-2.5 rounded-full', segmentStyles[i % segmentStyles.length].dot)} />
                <span className="text-text-secondary">{claim.claimantName}</span>
                <span className="font-mono text-text-muted">{formatCurrency(claim.amount)}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-400/40" />
              <span className="text-text-secondary">Available</span>
              <span className="font-mono text-primary">{formatCurrency(asset.availableBalance)}</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-text-muted">
            <CircleDot className="w-3 h-3 text-primary" />
            {heldPercent.toFixed(0)}% encumbered · {activeClaims.length} claim{activeClaims.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}