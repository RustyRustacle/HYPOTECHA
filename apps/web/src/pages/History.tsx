import { Activity } from 'lucide-react'
import { EventLog } from '@/components/EventLog'
import { PageHero } from '@/components/PageHero'
import type { PlatformContext } from '@/components/PlatformLanes'
import { mockEvents } from '@/data/mock'

const legend = [
  { label: 'HOLD_CREATED', dot: 'bg-primary', cls: 'text-primary border-primary/25 bg-primary/10' },
  { label: 'HOLD_RELEASED', dot: 'bg-info-light', cls: 'text-info border-info/25 bg-info/10' },
  { label: 'HOLD_EXECUTED', dot: 'bg-warning-light', cls: 'text-warning border-warning-light/25 bg-warning/10' },
  { label: 'CONFLICT_REJECTED', dot: 'bg-danger', cls: 'text-danger border-danger/25 bg-danger/10' },
]

interface HistoryProps {
  platformContext?: PlatformContext
}

export function History({ platformContext = 'registry' }: HistoryProps) {
  const scoped = platformContext !== 'registry'
  const visible = scoped ? mockEvents.filter((e) => e.platformId === platformContext) : mockEvents

  return (
    <div className="space-y-6">
      <div className="-mt-6">
        <PageHero
          badge="Audit · HCS Ledger"
        title="On-Chain"
        accent="History"
        subtitle="The immutable audit trail of every hold and registry event, streamed from the shared HCS topic."
        media={{ kind: 'video', src: '/app-bg/history.mp4', opacity: 46 }}
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass text-xs">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-text-secondary">{visible.length} events</span>
          </div>
        }
      />
      </div>

      <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {legend.map((item) => (
          <span
            key={item.label}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border ${item.cls}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
            {item.label}
          </span>
        ))}
        <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-text-muted font-mono">
          source · hcs topic 0.0.2947791
        </span>
      </div>

      <EventLog events={visible} maxHeight="max-h-[560px]" />
      </div>
    </div>
  )
}