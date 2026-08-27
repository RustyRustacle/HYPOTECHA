import { SectionBackground } from '@/components/SectionBackground'

type PageHeroProps = {
  badge?: string
  title: string
  subtitle: string
  media: { kind: 'video' | 'image'; src: string; opacity?: number }
  actions?: React.ReactNode
}

export function PageHero({ badge, title, subtitle, media, actions }: PageHeroProps) {
  return (
    <div className="relative -m-6 p-6 overflow-hidden glass-strong border-b border-border/60 rounded-b-3xl">
      <SectionBackground kind={media.kind} src={media.src} opacity={media.opacity ?? 100} overlay="linear-gradient(to bottom, rgba(4,6,13,0.55), rgba(4,6,13,0.78))" />
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          {badge && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-[10px] font-medium uppercase tracking-wider mb-2">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" /> {badge}
            </div>
          )}
          <h1 className="text-2xl font-bold text-text">{title}</h1>
          <p className="text-sm text-text-secondary mt-1 max-w-xl">{subtitle}</p>
        </div>
        {actions && <div className="relative z-10">{actions}</div>}
      </div>
    </div>
  )
}
