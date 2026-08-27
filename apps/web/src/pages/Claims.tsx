import { ClaimsTable } from '@/components/ClaimsTable'
import { PageHero } from '@/components/PageHero'
import { mockAllClaims } from '@/data/mock'

export function Claims() {
  return (
    <div className="p-6 space-y-6">
      <PageHero
        badge="Registry"
        title="All Claims"
        subtitle="Complete list of encumbrance claims across all assets"
        media={{ kind: 'image', src: '/bg/silver-lines.jpg', opacity: 35 }}
      />
      <ClaimsTable
        claims={mockAllClaims}
        onRelease={(id) => console.log('Release', id)}
      />
    </div>
  )
}
