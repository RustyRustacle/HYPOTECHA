import { CircleDot, RadioTower } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { useSectionReveal } from '@/lib/useSectionReveal'
import { HCS_TOPIC_ID, type RegistryLane } from '@/lib/registry'

export type PlatformContext = 'registry'

interface PlatformLanesProps {
  lanes: RegistryLane[]
}

export function PlatformLanes({ lanes }: PlatformLanesProps) {
  const { ref, visible } = useSectionReveal<HTMLDivElement>(0.2)

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
          <h3 className="text-sm font-semibold text-text">One Universal Registry</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-[10px] font-mono text-primary">
          <RadioTower className="w-3 h-3" />
          hcs {HCS_TOPIC_ID}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {lanes.map((lane) => (
          <div
            key={lane.id}
            className="rounded-xl border border-white/10 bg-black/25 p-4 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-semibold text-text">{lane.label}</span>
                <span className="text-[10px] font-mono text-text-muted">{lane.operator}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="font-mono text-primary">{formatCurrency(lane.held)} held</span>
              <span className="flex items-center gap-1 text-text-muted">
                <CircleDot className="w-3 h-3" />
                {lane.records} record{lane.records !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}