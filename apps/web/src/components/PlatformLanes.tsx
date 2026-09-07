import { CircleDot, RadioTower } from 'lucide-react'
import { mockAllClaims, mockPlatforms } from '@/data/mock'
import { formatCurrency, cn } from '@/lib/utils'
import { useSectionReveal } from '@/lib/useSectionReveal'

export type PlatformContext = 'registry' | 'alpha' | 'beta'

interface PlatformLanesProps {
  active: PlatformContext
}

export function PlatformLanes({ active }: PlatformLanesProps) {
  const { ref, visible } = useSectionReveal<HTMLDivElement>(0.2)
  const topic = '0.0.2947791'

  return (
    <div
      ref={ref}
      className={cn(
        'liquid-glass rounded-2xl p-5 transition-all duration-500',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h3 className="text-sm font-semibold text-text">Two Platforms · One Ledger</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-[10px] font-mono text-primary">
          <RadioTower className="w-3 h-3" />
          hcs {topic}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mockPlatforms.map((p) => {
          const records = mockAllClaims.filter((c) => c.status === 'Active' && c.platformId === p.id)
          const held = records.reduce((s, c) => s + c.amount, 0)
          const isActive = active === p.id
          return (
            <div
              key={p.id}
              className={cn(
                'rounded-xl border p-4 transition-all duration-300',
                isActive ? 'bg-primary/[0.06] border-primary/25' : 'bg-black/25 border-white/10'
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', isActive ? 'bg-primary' : 'bg-text-muted')} />
                  <span className="text-sm font-semibold text-text">
                    {p.name.replace('Platform ', '')}
                  </span>
                  <span className="text-[10px] font-mono text-text-muted">{p.operator}</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-raised border border-white/10 text-[9px] font-mono text-text-muted">
                  {p.id.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="font-mono text-primary">{formatCurrency(held)} held</span>
                <span className="flex items-center gap-1 text-text-muted">
                  <CircleDot className="w-3 h-3" />
                  {records.length} record{records.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}