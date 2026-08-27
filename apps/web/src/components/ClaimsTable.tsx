import { formatCurrency, formatAddress, cn } from '@/lib/utils'
import type { EncumbranceClaim } from '@/data/mock'

interface ClaimsTableProps {
  claims: EncumbranceClaim[]
  onRelease?: (claimId: string) => void
}

const statusStyles = {
  Active: 'bg-primary/10 text-primary border-primary/30',
  Released: 'bg-surface-raised text-text-secondary border-border',
  Defaulted: 'bg-danger/10 text-danger border-danger/30',
}

export function ClaimsTable({ claims, onRelease }: ClaimsTableProps) {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-base font-semibold text-text">Encumbrance Claims</h3>
        <div className="flex items-center gap-2">
          {(['All', 'Active', 'Released', 'Defaulted'] as const).map((filter) => (
            <button
              key={filter}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filter === 'All' ? 'bg-surface-raised text-text' : 'text-text-secondary hover:bg-surface-raised hover:text-text'
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Claim ID</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Token</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Obligor</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Claimant</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Amount</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.claimId} className="border-b border-border/50 hover:bg-surface-raised/50 transition-colors">
                <td className="px-6 py-3.5">
                  <span className="font-mono text-xs text-text-secondary">{formatAddress(claim.claimId)}</span>
                </td>
                <td className="px-6 py-3.5">
                  <span className="text-sm text-text">{claim.tokenName}</span>
                </td>
                <td className="px-6 py-3.5">
                  <div>
                    <div className="text-sm text-text">{claim.obligorName}</div>
                    <div className="font-mono text-xs text-text-muted">{formatAddress(claim.obligor)}</div>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <div>
                    <div className="text-sm text-text">{claim.claimantName}</div>
                    <div className="font-mono text-xs text-text-muted">{formatAddress(claim.claimant)}</div>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <span className="font-mono text-sm font-semibold text-text">{formatCurrency(claim.amount)}</span>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                    statusStyles[claim.status]
                  )}>
                    {claim.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center">
                  {claim.status === 'Active' && onRelease && (
                    <button
                      onClick={() => onRelease(claim.claimId)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-raised text-text-secondary border border-border hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-all"
                    >
                      Release
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {claims.length === 0 && (
        <div className="px-6 py-12 text-center text-text-muted text-sm">
          No claims found
        </div>
      )}
    </div>
  )
}
