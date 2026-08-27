import { KPICard } from '@/components/KPICard'
import { EncumbranceBar } from '@/components/EncumbranceBar'
import { ClaimsTable } from '@/components/ClaimsTable'
import { EventLog } from '@/components/EventLog'
import { PageHero } from '@/components/PageHero'
import { mockAssets, mockAllClaims, mockEvents } from '@/data/mock'

interface DashboardProps {
  onNavigate: (page: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const totalHeld = mockAssets.reduce((sum, a) => sum + a.totalHeld, 0)
  const totalAvailable = mockAssets.reduce((sum, a) => sum + a.availableBalance, 0)
  const activeClaims = mockAllClaims.filter(c => c.status === 'Active').length

  return (
    <div className="p-6 space-y-6">
      <PageHero
        badge="Overview"
        title="Dashboard"
        subtitle="On-chain encumbrance overview across all tokenized assets"
        media={{ kind: 'video', src: '/bg/plexus.mp4', opacity: 55 }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Held"
          value={totalHeld}
          icon="🔒"
          change="+$200K"
          changeType="positive"
          subtext="Encumbered across all assets"
        />
        <KPICard
          title="Active Claims"
          value={activeClaims}
          prefix=""
          suffix=""
          icon="📋"
          change="+1 today"
          changeType="positive"
          subtext="Open encumbrance positions"
        />
        <KPICard
          title="Available Balance"
          value={totalAvailable}
          icon="💰"
          change="-$200K"
          changeType="negative"
          subtext="Available for new pledges"
        />
        <KPICard
          title="Compliance"
          value={0}
          prefix=""
          suffix=""
          icon="✓"
          change="All Clear"
          changeType="positive"
          subtext="All participants verified"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Asset Encumbrance</h2>
          <button
            onClick={() => onNavigate('assets')}
            className="text-sm text-info hover:underline"
          >
            View all assets →
          </button>
        </div>
        {mockAssets.map(asset => (
          <EncumbranceBar key={asset.address} asset={asset} onPledge={() => onNavigate('create')} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClaimsTable
          claims={mockAllClaims.slice(0, 5)}
          onRelease={(id) => console.log('Release', id)}
        />
        <EventLog events={mockEvents} />
      </div>
    </div>
  )
}
