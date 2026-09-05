import { ClipboardList } from 'lucide-react'
import { ClaimsTable } from '@/components/ClaimsTable'
import { PageHero } from '@/components/PageHero'
import { mockAllClaims } from '@/data/mock'

export function Claims() {
  return (
    <div className="space-y-6">
      <div className="-mt-6">
        <PageHero
          badge="Registry · Claims"
        title="Every"
        accent="Claim"
        subtitle="The shared, on-chain record of every encumbrance across all assets, obligors, and claimants."
        media={{ kind: 'video', src: '/app-bg/claims.mp4', opacity: 50 }}
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass text-xs">
            <ClipboardList className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-text-secondary">{mockAllClaims.length} records</span>
          </div>
        }
      />
      </div>
      <ClaimsTable claims={mockAllClaims} onRelease={(id) => console.log('Release', id)} />
    </div>
  )
}