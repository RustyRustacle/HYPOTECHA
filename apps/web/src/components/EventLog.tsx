import { formatCurrency, formatTimeAgo, formatAddress, cn } from '@/lib/utils'
import { useSectionReveal } from '@/lib/useSectionReveal'
import type { LiveEvent } from '@/data/mock'

interface EventLogProps {
  events: LiveEvent[]
  maxHeight?: string
}

const eventMeta: Record<LiveEvent['type'], { glyph: string; text: string }> = {
  EncumbranceCreated: { glyph: '↑', text: 'text-primary-light' },
  EncumbranceReleased: { glyph: '↓', text: 'text-info-light' },
  EncumbranceRejected: { glyph: '✕', text: 'text-danger' },
  EncumbranceDefaulted: { glyph: '⚠', text: 'text-warning-light' },
}

export function EventLog({ events, maxHeight = 'max-h-[520px]' }: EventLogProps) {
  const { ref, visible } = useSectionReveal<HTMLDivElement>(0.2)

  return (
    <div
      ref={ref}
      className={cn(
        'transition-opacity duration-500',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h3 className="text-sm font-semibold text-text">Live Event Stream</h3>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-[10px] text-primary font-mono">
          STREAMING
        </div>
      </div>

      <div className={cn('rounded-xl bg-black/40 border border-white/10 overflow-hidden', maxHeight)}>
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.07] bg-black/30">
          <span className="w-2.5 h-2.5 rounded-full bg-danger/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-primary/70" />
          <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-text-muted font-mono">
            mirror-node · encumbrance.events
          </span>
        </div>

        <div className="px-4 py-3 font-mono text-xs leading-7 overflow-y-auto [scrollbar-width:thin]">
          {events.map((event, i) => {
            const meta = eventMeta[event.type]
            return (
              <div
                key={event.id}
                className="flex items-start gap-2 animate-fade-in-up"
                style={{ animationDelay: `${140 + i * 180}ms` }}
              >
                <span className="text-text-muted select-none" aria-hidden>
                  ›
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={meta.text}>{meta.glyph}</span>
                    <span className={meta.text}>{event.type}</span>
                    <span className="text-text-secondary">{event.tokenName}</span>
                    <span className="text-text-muted">→</span>
                    <span className="text-text-secondary">{event.claimantName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-muted">
                    <span className={meta.text}>{formatCurrency(event.amount)}</span>
                    {event.detail && (
                      <>
                        <span>·</span>
                        <span className="text-danger truncate max-w-[220px]">{event.detail}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{formatTimeAgo(event.timestamp)}</span>
                    <span>·</span>
                    <a
                      href={`https://hashscan.io/testnet/transaction/${event.txHash}`}
                      target="_blank"
                      rel="noopener"
                      className="font-mono text-info hover:underline"
                    >
                      {formatAddress(event.txHash)}
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
          <div className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: `${160 + events.length * 180}ms` }}>
            <span className="text-text-muted select-none" aria-hidden>
              ›
            </span>
            <span className="text-primary inline-block animate-pulse">▍</span>
            <span className="text-text-muted">listening for events…</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-3">
        <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
          Every event verifiable on Hedera
        </span>
      </div>
    </div>
  )
}