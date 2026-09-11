import { useEffect, useMemo, useState } from 'react'
import { LockKeyhole, ClipboardList, Coins, Network, BadgePlus, ArrowRight, CircleAlert } from 'lucide-react'
import { KPICard } from '@/components/KPICard'
import { EncumbranceBar } from '@/components/EncumbranceBar'
import { ClaimsTable } from '@/components/ClaimsTable'
import { EventLog } from '@/components/EventLog'
import { PageHero } from '@/components/PageHero'
import { PlatformLanes } from '@/components/PlatformLanes'
import {
  buildClaimsMap,
  shapeClaimRows,
  shapeEventRows,
  shapeLanes,
  shaperOverviewAssets,
  useEvents,
  useOverview,
  type AssetBarView,
  type ClaimRow,
} from '@/lib/registry'
import { releaseEncumbrance } from '@/lib/hypotheca'

interface DashboardProps {
  onNavigate: (page: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const overview = useOverview()
  const eventsState = useEvents()
  const [bars, setBars] = useState<AssetBarView[]>([])

  useEffect(() => {
    if (!overview.data) return
    let cancelled = false
    buildClaimsMap().then((claimsMap) => {
      if (cancelled) return
      setBars(shaperOverviewAssets(overview.data!, claimsMap))
    })
    return () => {
      cancelled = true
    }
  }, [overview.data])

  const ov = overview.data
  const claimRows = useMemo(() => (ov ? shapeClaimRows(eventsState.events, ov.holder) : []), [eventsState.events, ov])
  const eventRows = useMemo(() => shapeEventRows(eventsState.events), [eventsState.events])
  const lanes = useMemo(() => shapeLanes(bars), [bars])

  const handleRelease = async (row: ClaimRow) => {
    await releaseEncumbrance(row.key)
    overview.refresh()
    eventsState.refresh()
  }

  const totalHeld = Number(ov?.totals.held ?? 0)
  const totalAvailable = Number(ov?.totals.available ?? 0)
  const totalFace = Number(ov?.totals.faceValue ?? 0)
  const encumberedPct = ov?.totals.encumberedPct ?? 0
  const counts = ov?.counts

  return (
    <div className="space-y-6">
      <div className="-mt-6">
        <PageHero
          badge="Overview · Universal Registry"
          title="On-Chain"
          accent="Oversight"
          subtitle="Live encumbrance state across every registered asset — what is held, what is free, and who holds it, in one shared ledger."
          media={{ kind: 'video', src: '/bg/plexus.mp4', opacity: 55 }}
          actions={
            <button
              onClick={() => onNavigate('create')}
              className="liquid-glass liquid-cta liquid-glass-button px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
            >
              <BadgePlus className="w-4 h-4" />
              Register Pledge
            </button>
          }
        />
      </div>

      {overview.error && !ov && (
        <div className="rounded-xl bg-danger/10 border border-danger/30 p-3 flex items-start gap-2.5">
          <CircleAlert className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed font-mono">
            Registry API unreachable — {overview.error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Held"
          value={totalHeld}
          icon={LockKeyhole}
          change={overview.loading ? 'loading' : `${encumberedPct.toFixed(1)}%`}
          changeType="positive"
          subtext="Encumbered across all assets"
          delay={0}
        />
        <KPICard
          title="Active Claims"
          value={counts?.active ?? 0}
          prefix=""
          suffix=""
          icon={ClipboardList}
          change={counts && counts.rejected > 0 ? `${counts.rejected} rejected` : '0 rejected'}
          changeType="neutral"
          subtext="Open encumbrance positions"
          delay={80}
        />
        <KPICard
          title="Available Balance"
          value={totalAvailable}
          icon={Coins}
          change={`${totalFace.toLocaleString()} face`}
          changeType="neutral"
          subtext="Free for new pledges"
          delay={160}
        />
        <KPICard
          title="Registry Records"
          value={counts?.totalRecords ?? 0}
          prefix=""
          suffix=""
          icon={Network}
          change={counts ? `${counts.released} released` : 'synced'}
          changeType="positive"
          subtext="Immutably stored on HCS"
          delay={240}
        />
      </div>

      <PlatformLanes lanes={lanes} />

      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-text">Asset Encumbrance</h2>
            <p className="text-xs text-text-muted mt-0.5">Available vs held, per token</p>
          </div>
          <button
            onClick={() => onNavigate('assets')}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-info hover:text-primary-light transition-colors"
          >
            View all assets
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {bars.map((asset) => (
            <EncumbranceBar key={asset.id} asset={asset} onPledge={() => onNavigate('create')} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <ClaimsTable claims={claimRows.slice(0, 5)} onRelease={handleRelease} />
        <EventLog events={eventRows.slice(0, 20)} />
      </div>
    </div>
  )
}