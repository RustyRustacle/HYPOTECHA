import { ClipboardList } from 'lucide-react'
import { ClaimsTable } from '@/components/ClaimsTable'
import { PageHero } from '@/components/PageHero'
import type { PlatformContext } from '@/components/PlatformLanes'
import { mockAllClaims } from '@/data/mock'

interface ClaimsProps {
  platformContext?: PlatformContext
}

export function Claims({ platformContext = 'registry' }: ClaimsProps) {
  const scoped = platformContext !== 'registry'
  const visible = scoped ? mockAllClaims.filter((c) => c.platformId === platformContext) : mockAllClaims

  return (
    <div className="space-y-6">
      <div className="-mt-6">
        <PageHero
          badge="Registry · Records"
        title="Every"
        accent="Record"
        subtitle="The shared, on-chain record of every encumbrance across all assets, obligors, claimants, and participating platforms."
        media={{ kind: 'video', src: '/app-bg/claims.mp4', opacity: 50 }}
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass text-xs">
            <ClipboardList className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-text-secondary">{visible.length} records</span>
          </div>
        }
      />
      </div>
      <ClaimsTable claims={visible} onRelease={(id) => console.log('Release', id)} />
    </div>
  )
}