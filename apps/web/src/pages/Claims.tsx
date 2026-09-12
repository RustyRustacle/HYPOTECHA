import { useMemo } from 'react'
import { ClipboardList, CircleAlert } from 'lucide-react'
import { useWalletClient } from 'wagmi'
import { ClaimsTable } from '@/components/ClaimsTable'
import { PageHero } from '@/components/PageHero'
import { shapeClaimRows, useEvents, useOverview } from '@/lib/registry'
import { releaseEncumbrance } from '@/lib/hypotheca'
import type { ClaimRow } from '@/lib/registry'

export function Claims() {
  const { data: signer } = useWalletClient()
  const overview = useOverview()
  const eventsState = useEvents()
  const claimRows = useMemo(
    () => (overview.data ? shapeClaimRows(eventsState.events, overview.data.holder) : []),
    [eventsState.events, overview.data]
  )

  const handleRelease = async (row: ClaimRow) => {
    await releaseEncumbrance(row.key, signer, row.token)
    overview.refresh()
    eventsState.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="-mt-6">
        <PageHero
          badge="Registry · Records"
          title="Every"
          accent="Record"
          subtitle="The shared, on-chain record of every encumbrance across all assets, obligors, and claimants."
          media={{ kind: 'video', src: '/app-bg/claims.mp4', opacity: 50 }}
          actions={
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass text-xs">
              <ClipboardList className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-text-secondary">{claimRows.length} records</span>
            </div>
          }
        />
      </div>

      {overview.error && !overview.data && (
        <div className="rounded-xl bg-danger/10 border border-danger/30 p-3 flex items-start gap-2.5">
          <CircleAlert className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed font-mono">{overview.error}</p>
        </div>
      )}

      <ClaimsTable claims={claimRows} onRelease={handleRelease} />
    </div>
  )
}