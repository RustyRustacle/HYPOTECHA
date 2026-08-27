import { EventLog } from '@/components/EventLog'
import { PageHero } from '@/components/PageHero'
import { mockEvents } from '@/data/mock'

export function History() {
  return (
    <div className="p-6 space-y-6">
      <PageHero
        badge="Audit"
        title="Transaction History"
        subtitle="Complete audit trail of all encumbrance events from Hedera Mirror Node"
        media={{ kind: 'video', src: '/bg/vortex.mp4', opacity: 50 }}
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> EncumbranceCreated
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-info/10 border border-info/30 text-xs text-info">
          <span className="w-1.5 h-1.5 rounded-full bg-info" /> EncumbranceReleased
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-danger/10 border border-danger/30 text-xs text-danger">
          <span className="w-1.5 h-1.5 rounded-full bg-danger" /> EncumbranceRejected
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/30 text-xs text-warning">
          <span className="w-1.5 h-1.5 rounded-full bg-warning" /> EncumbranceDefaulted
        </div>
      </div>

      <EventLog events={mockEvents} />
    </div>
  )
}
