import { EncumbranceBar } from '@/components/EncumbranceBar'
import { PageHero } from '@/components/PageHero'
import { mockAssets } from '@/data/mock'

interface AssetsProps {
  onNavigate: (page: string) => void
}

export function Assets({ onNavigate }: AssetsProps) {
  return (
    <div className="p-6 space-y-6">
      <PageHero
        badge="Issuer"
        title="Tokenized Assets"
        subtitle="All registered tokenized assets and their encumbrance status"
        media={{ kind: 'video', src: '/bg/wave.mp4', opacity: 55 }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockAssets.map(asset => (
          <div key={asset.address} className="bg-surface rounded-xl border border-border p-5 hover:border-primary/30 transition-all cursor-pointer"
            onClick={() => onNavigate('claims')}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {asset.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="text-sm font-semibold text-text">{asset.name}</div>
                <div className="text-xs font-mono text-text-muted">{asset.symbol}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Total Balance</span>
                <span className="font-mono font-semibold text-text">
                  ${asset.totalBalance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Held</span>
                <span className="font-mono font-semibold text-warning">
                  ${asset.totalHeld.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Available</span>
                <span className="font-mono font-semibold text-primary">
                  ${asset.availableBalance.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-surface-raised overflow-hidden flex">
              {asset.totalHeld > 0 && (
                <div
                  className="h-full bg-warning"
                  style={{ width: `${(asset.totalHeld / asset.totalBalance) * 100}%` }}
                />
              )}
              <div
                className="h-full bg-primary/30"
                style={{ width: `${(asset.availableBalance / asset.totalBalance) * 100}%` }}
              />
            </div>
            <div className="mt-3 text-xs text-text-muted">
              {asset.claims.length} active claim{asset.claims.length !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 mt-8">
        <h2 className="text-lg font-semibold text-text">Detailed View</h2>
        {mockAssets.map(asset => (
          <EncumbranceBar key={asset.address} asset={asset} onPledge={() => onNavigate('create')} />
        ))}
      </div>
    </div>
  )
}
