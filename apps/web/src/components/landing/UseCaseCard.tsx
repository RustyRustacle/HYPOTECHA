interface UseCaseCardProps {
  image: string
  name: string
  desc: string
  metric: string
  sub: string
  active: boolean
  onClick: () => void
}

export function UseCaseCard({ image, name, desc, metric, sub, active, onClick }: UseCaseCardProps) {
  return (
    <button
      onClick={onClick}
      className={`liquid-glass rounded-xl group cursor-pointer text-left transition-all duration-300 focus:outline-none relative overflow-hidden ${active ? 'ring-1 ring-primary/50 border-primary/30' : ''}`}
    >
      <div className="relative h-24 shrink-0 overflow-hidden">
        <img src={image} alt={name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-[#0b1120]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-90" />
        <span className={`absolute top-2 right-2 text-xs font-mono px-2 py-0.5 rounded-full backdrop-blur-md ${active ? 'bg-primary/25 text-primary-light border border-primary/30' : 'bg-black/40 text-text-muted border border-white/10'}`}>{metric}</span>
      </div>
      <div className="relative z-10 p-5 pt-3">
        <div className="text-sm font-semibold text-text mb-1">{name}</div>
        <div className="text-xs text-text-secondary leading-relaxed">{desc}</div>
        <div className={`text-[10px] text-primary mt-2 font-medium transition-all duration-300 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}>{sub}</div>
      </div>
    </button>
  )
}