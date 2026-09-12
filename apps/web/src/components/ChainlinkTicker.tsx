import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { fetchLivePrices, formatUsd, type ChainlinkQuote } from '@/lib/chainlink'
import { cn } from '@/lib/utils'

interface ChainlinkTickerProps {
  intervalMs?: number
}

export function ChainlinkTicker({ intervalMs = 15_000 }: ChainlinkTickerProps) {
  const [quotes, setQuotes] = useState<ChainlinkQuote[]>([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const rows = await fetchLivePrices()
        if (cancelled) return
        setQuotes(rows)
        setFailed(false)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }
    run()
    const timer = setInterval(run, intervalMs)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [intervalMs])

  const healthy = quotes.filter((q) => !q.error && !q.stale)

  return (
    <div className="liquid-glass rounded-xl overflow-hidden border border-white/10">
      <div className="flex items-stretch">
        <div className="hidden sm:flex items-center gap-2 border-r border-white/10 bg-black/25 px-4 py-2.5 shrink-0">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            Chainlink
          </span>
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              failed ? 'bg-danger' : healthy.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            )}
          />
        </div>
        <div className="relative flex-1 overflow-hidden py-2.5">
          {quotes.length === 0 ? (
            <span className="px-4 font-mono text-xs text-text-muted">
              {failed ? 'live prices unavailable on testnet' : 'loading live prices…'}
            </span>
          ) : (
            <div className="flex w-max animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused]">
              {[0, 1].map((copy) => (
                <div key={copy} className="flex items-center gap-8 px-6 whitespace-nowrap" aria-hidden={copy === 1}>
                  {quotes
                    .filter((q) => !q.error)
                    .map((q) => (
                      <TickerItem key={`${copy}-${q.pair}`} quote={q} />
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TickerItem({ quote }: { quote: ChainlinkQuote }) {
  const fresh = quote.ageSec < 60
  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          quote.stale ? 'bg-amber-400' : fresh ? 'bg-emerald-400' : 'bg-emerald-400/50'
        )}
      />
      <span className="text-text-secondary">{quote.pair}</span>
      <span className="text-primary font-semibold tracking-tight">{formatUsd(quote.price)}</span>
      <span className="text-text-muted">
        {quote.stale ? `stale ${Math.floor(quote.ageSec / 3600)}h` : `${quote.ageSec}s`}
      </span>
    </div>
  )
}