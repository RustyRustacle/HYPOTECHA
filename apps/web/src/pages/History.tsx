import { useMemo } from 'react'
import { Activity, CircleAlert } from 'lucide-react'
import { EventLog } from '@/components/EventLog'
import { PageHero } from '@/components/PageHero'
import { HCS_TOPIC_ID, shapeEventRows, useEvents } from '@/lib/registry'

const legend = [
  { label: 'HOLD_CREATED', dot: 'bg-primary', cls: 'text-primary border-primary/25 bg-primary/10' },
  { label: 'HOLD_RELEASED', dot: 'bg-info-light', cls: 'text-info border-info/25 bg-info/10' },
  { label: 'HOLD_EXECUTED', dot: 'bg-warning-light', cls: 'text-warning border-warning-light/25 bg-warning/10' },
  { label: 'CONFLICT_REJECTED', dot: 'bg-danger', cls: 'text-danger border-danger/25 bg-danger/10' },
  { label: 'VAULT_DEPOSITED', dot: 'bg-emerald-400', cls: 'text-emerald-300 border-emerald-400/25 bg-emerald-400/10' },
  { label: 'VAULT_WITHDRAWN', dot: 'bg-warning-light', cls: 'text-warning border-warning/25 bg-warning/10' },
]

export function History() {
  const { events, error } = useEvents()
  const rows = useMemo(() => shapeEventRows(events), [events])

  return (
    <div className="space-y-6">
      <div className="-mt-6">
        <PageHero
          badge="Audit · On-Chain Ledger"
          title="On-Chain"
          accent="History"
          subtitle="The immutable audit trail of every vault and hold event, emitted by the EncumbranceLedger itself."
          media={{ kind: 'video', src: '/app-bg/history.mp4', opacity: 46 }}
          actions={
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass text-xs">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-text-secondary">{rows.length} events</span>
            </div>
          }
        />
      </div>

      {error && (
        <div className="rounded-xl bg-danger/10 border border-danger/30 p-3 flex items-start gap-2.5">
          <CircleAlert className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed font-mono">{error}</p>
        </div>
      )}

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
            source · encumbrance-ledger · hcs {HCS_TOPIC_ID}
          </span>
        </div>

        <EventLog events={rows.slice(0, 60)} maxHeight="max-h-[560px]" />
      </div>
    </div>
  )
}