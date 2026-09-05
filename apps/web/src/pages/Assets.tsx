import { Coins, LockKeyhole, ArrowUpRight, Boxes } from 'lucide-react'
import { EncumbranceBar } from '@/components/EncumbranceBar'
import { PageHero } from '@/components/PageHero'
import { useSectionReveal } from '@/lib/useSectionReveal'
import { cn } from '@/lib/utils'
import { mockAssets } from '@/data/mock'

interface AssetsProps {
  onNavigate: (page: string) => void
}

function AssetCard({ asset, onOpen }: { asset: (typeof mockAssets)[number]; onOpen: () => void }) {
  const { ref, visible } = useSectionReveal<HTMLDivElement>(0.2)
  const heldPct = (asset.totalHeld / asset.totalBalance) * 100

  return (
    <div
      ref={ref}
      onClick={onOpen}
      className={cn(
        'group relative liquid-glass rounded-2xl p-5 cursor-pointer transition-all duration-500 overflow-hidden',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <ArrowUpRight className="absolute top-4 right-4 w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div
            className={cn(
              'relative w-12 h-12 rounded-2xl overflow-hidden border shrink-0',
              asset.totalHeld > 0 ? 'border-primary/25' : 'border-white/10'
            )}
          >
            <div className="absolute inset-0 flex items-center justify-center text-primary font-bold text-sm bg-surface-raised">
              {asset.symbol.slice(0, 2).toUpperCase()}
            </div>
            {asset.img && (
              <img
                src={asset.img}
                alt={asset.name}
                loading="lazy"
                onError={(e) => (e.currentTarget.style.display = 'none')}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text truncate">{asset.name}</div>
            <div className="text-xs font-mono text-text-muted">{asset.symbol}</div>
          </div>
        </div>

        <div className="space-y-2.5 mb-4">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <Coins className="w-3.5 h-3.5 text-text-muted" /> Total Balance
            </span>
            <span className="font-mono font-semibold text-text">${asset.totalBalance.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <LockKeyhole className="w-3.5 h-3.5 text-warning" /> Held
            </span>
            <span className="font-mono font-semibold text-warning">${asset.totalHeld.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <Boxes className="w-3.5 h-3.5 text-primary" /> Available
            </span>
            <span className="font-mono font-semibold text-primary">${asset.availableBalance.toLocaleString()}</span>
          </div>
        </div>

        <div className="h-2 rounded-full bg-black/30 border border-white/10 overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-amber-400/80 to-orange-500/80 transition-all duration-1000"
            style={{ width: `${heldPct}%` }}
          />
          <div
            className="h-full bg-emerald-500/25 transition-all duration-1000"
            style={{ width: `${100 - heldPct}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {asset.claims.length} active claim{asset.claims.length !== 1 ? 's' : ''}
          </span>
          <span className="font-mono text-text-muted">{heldPct.toFixed(0)}% held</span>
        </div>
      </div>
    </div>
  )
}

export function Assets({ onNavigate }: AssetsProps) {
  return (
    <div className="space-y-6">
      <div className="-mt-6">
        <PageHero
          badge="Issuer · Portfolio"
        title="Tokenized"
        accent="Assets"
        subtitle="Every registered tokenized asset with its encumbrance status — total, held, and still free to pledge."
        media={{ kind: 'video', src: '/app-bg/assets.mp4', opacity: 55 }}
      />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockAssets.map((asset) => (
          <AssetCard key={asset.address} asset={asset} onOpen={() => onNavigate('claims')} />
        ))}
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-text">Detailed View</h2>
            <p className="text-xs text-text-muted mt-0.5">Encumbrance breakdown per claim, per asset</p>
          </div>
          <span className="text-xs font-mono text-text-muted">{mockAssets.length} assets</span>
        </div>
        {mockAssets.map((asset) => (
          <EncumbranceBar key={asset.address} asset={asset} onPledge={() => onNavigate('create')} />
        ))}
      </div>
    </div>
  )
}