import type { ReactNode } from 'react'

interface SectionLabelProps {
  children: ReactNode
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full liquid-glass text-[11px] text-text-muted uppercase tracking-[0.2em] mb-5">
      {children}
    </div>
  )
}