import { Activity } from 'lucide-react'
import { EventLog } from '@/components/EventLog'
import { PageHero } from '@/components/PageHero'
import { mockEvents } from '@/data/mock'

const legend = [
  { label: 'EncumbranceCreated', dot: 'bg-primary', cls: 'text-primary border-primary/25 bg-primary/10' },
  { label: 'EncumbranceReleased', dot: 'bg-info-light', cls: 'text-info border-info/25 bg-info/10' },
  { label: 'EncumbranceRejected', dot: 'bg-danger', cls: 'text-danger border-danger/25 bg-danger/10' },
  { label: 'EncumbranceDefaulted', dot: 'bg-warning-light', cls: 'text-warning border-warning-light/25 bg-warning/10' },
]

export function History() {
  return (
    <div className="space-y-6 max-w-5xl">
      <PageHero
        badge="Audit · Mirror Node"
        title="Transaction"
        accent="History"
        subtitle="The immutable audit trail of every encumbrance event, streamed from the Hedera Mirror Node."
        media={{ kind: 'video', src: '/app-bg/history.mp4', opacity: 46 }}
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass text-xs">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-text-secondary">{mockEvents.length} events</span>
          </div>
        }
      />

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
          source · testnet.mirrornode.hedera.com
        </span>
      </div>

      <EventLog events={mockEvents} maxHeight="max-h-[560px]" />
    </div>
  )
}