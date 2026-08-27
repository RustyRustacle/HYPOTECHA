import { formatCurrency, formatTimeAgo, formatAddress, cn } from '@/lib/utils'
import type { LiveEvent } from '@/data/mock'

interface EventLogProps {
  events: LiveEvent[]
}

const eventStyles = {
  EncumbranceCreated: { icon: '●', color: 'text-primary', bg: 'bg-primary/10' },
  EncumbranceReleased: { icon: '●', color: 'text-info', bg: 'bg-info/10' },
  EncumbranceRejected: { icon: '✕', color: 'text-danger', bg: 'bg-danger/10' },
  EncumbranceDefaulted: { icon: '⚠', color: 'text-warning', bg: 'bg-warning/10' },
}

export function EventLog({ events }: EventLogProps) {
  return (
    <div className="bg-surface rounded-xl border border-border">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-base font-semibold text-text">Live Events</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-text-secondary">Streaming</span>
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {events.map((event) => {
          const style = eventStyles[event.type]
          return (
            <div key={event.id} className="px-6 py-3.5 hover:bg-surface-raised/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5', style.bg)}>
                  <span className={style.color}>{style.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn('text-sm font-medium', style.color)}>{event.type}</span>
                    <span className="text-xs text-text-muted">·</span>
                    <span className="text-xs text-text-secondary">{event.tokenName}</span>
                    <span className="text-xs text-text-muted">→</span>
                    <span className="text-xs text-text-secondary">{event.claimantName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="font-mono">{formatCurrency(event.amount)}</span>
                    {event.detail && (
                      <>
                        <span>·</span>
                        <span className="text-danger">{event.detail}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{formatTimeAgo(event.timestamp)}</span>
                    <span>·</span>
                    <a href={`https://hashscan.io/testnet/transaction/${event.txHash}`} target="_blank" rel="noopener" className="font-mono text-info hover:underline">
                      {formatAddress(event.txHash)}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
