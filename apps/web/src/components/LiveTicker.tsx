const tickerItems = [
  { label: 'UST-123', value: '$1.0M', change: '+0.8%', up: true },
  { label: 'TCB-456', value: '$500K', change: '+1.2%', up: true },
  { label: 'REFT-789', value: '$2.5M', change: '-0.3%', up: false },
  { label: 'HEDERA', value: 'Tx/s', change: '12,408', up: true },
  { label: 'UST-123', value: '$1.0M', change: '+0.8%', up: true },
  { label: 'TCB-456', value: '$500K', change: '+1.2%', up: true },
  { label: 'REFT-789', value: '$2.5M', change: '-0.3%', up: false },
]

export function LiveTicker() {
  return (
    <div className="relative overflow-hidden border-y border-border/40 bg-surface/60 backdrop-blur-sm">
      <div className="flex w-max animate-[marquee_40s_linear_infinite] hover:[animation-play-state:paused]">
        {[...tickerItems, ...tickerItems].map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-8 py-3 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-text-secondary font-mono">{item.label}</span>
            <span className="text-xs font-mono text-text">{item.value}</span>
            <span className={`text-xs font-mono ${item.up ? 'text-primary' : 'text-danger'}`}>{item.change}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
