import { type ReactNode } from 'react'
import { LockKeyhole, ClipboardList, Coins, ShieldCheck, BadgePlus, ArrowRight } from 'lucide-react'
import { KPICard } from '@/components/KPICard'
import { EncumbranceBar } from '@/components/EncumbranceBar'
import { ClaimsTable } from '@/components/ClaimsTable'
import { EventLog } from '@/components/EventLog'
import { PageHero } from '@/components/PageHero'
import { mockAssets, mockAllClaims, mockEvents } from '@/data/mock'

interface DashboardProps {
  onNavigate: (page: string) => void
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-text">{title}</h2>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const totalHeld = mockAssets.reduce((sum, a) => sum + a.totalHeld, 0)
  const totalAvailable = mockAssets.reduce((sum, a) => sum + a.availableBalance, 0)
  const activeClaims = mockAllClaims.filter((c) => c.status === 'Active').length

  return (
    <div className="space-y-6">
      <PageHero
        badge="Overview · Encumbrance OS"
        title="On-Chain"
        accent="Oversight"
        subtitle="Live encumbrance state across every tokenized asset — what is held, what is free, and who holds it."
        media={{ kind: 'video', src: '/bg/plexus.mp4', opacity: 55 }}
        actions={
          <button
            onClick={() => onNavigate('create')}
            className="liquid-glass liquid-cta liquid-glass-button px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <BadgePlus className="w-4 h-4" />
            New Claim
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Held"
          value={totalHeld}
          icon={LockKeyhole}
          change="+$200K"
          changeType="positive"
          subtext="Encumbered across all assets"
          delay={0}
        />
        <KPICard
          title="Active Claims"
          value={activeClaims}
          prefix=""
          suffix=""
          icon={ClipboardList}
          change="+1 today"
          changeType="positive"
          subtext="Open encumbrance positions"
          delay={80}
        />
        <KPICard
          title="Available Balance"
          value={totalAvailable}
          icon={Coins}
          change="-$200K"
          changeType="negative"
          subtext="Free for new pledges"
          delay={160}
        />
        <KPICard
          title="Compliance"
          value={0}
          prefix=""
          suffix=""
          icon={ShieldCheck}
          change="All Clear"
          changeType="positive"
          subtext="All participants verified"
          delay={240}
        />
      </div>

      <div className="space-y-4">
        <SectionHeader
          title="Asset Encumbrance"
          sub="Available vs held, per token"
          action={
            <button
              onClick={() => onNavigate('assets')}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-info hover:text-primary-light transition-colors"
            >
              View all assets
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          }
        />
        <div className="grid grid-cols-1 gap-4">
          {mockAssets.map((asset) => (
            <EncumbranceBar key={asset.address} asset={asset} onPledge={() => onNavigate('create')} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <ClaimsTable claims={mockAllClaims.slice(0, 5)} onRelease={(id) => console.log('Release', id)} />
        <EventLog events={mockEvents} />
      </div>
    </div>
  )
}