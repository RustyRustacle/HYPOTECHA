import { useState } from 'react'
import { ArrowUpRight, CircleDot, LockKeyhole, RotateCcw } from 'lucide-react'
import { formatCurrency, formatAddress, cn } from '@/lib/utils'
import { useSectionReveal } from '@/lib/useSectionReveal'
import type { EncumbranceClaim } from '@/data/mock'

interface ClaimsTableProps {
  claims: EncumbranceClaim[]
  onRelease?: (claimId: string) => void
}

type ClaimStatus = EncumbranceClaim['status']
type Filter = 'All' | ClaimStatus

const filters: Filter[] = ['All', 'Active', 'Released', 'Defaulted']

const statusStyles: Record<ClaimStatus, { badge: string; dot: string; label: string }> = {
  Active: { badge: 'bg-primary/10 text-primary border-primary/25', dot: 'bg-primary', label: 'Locked' },
  Released: { badge: 'bg-surface-raised text-text-secondary border-white/10', dot: 'bg-text-muted', label: 'Released' },
  Defaulted: { badge: 'bg-danger/10 text-danger border-danger/25', dot: 'bg-danger', label: 'Defaulted' },
}

export function ClaimsTable({ claims, onRelease }: ClaimsTableProps) {
  const [filter, setFilter] = useState<Filter>('All')
  const [pendingRelease, setPendingRelease] = useState<string | null>(null)
  const { ref, visible } = useSectionReveal<HTMLDivElement>(0.2)

  const filtered = filter === 'All' ? claims : claims.filter((c) => c.status === filter)
  const activeCount = claims.filter((c) => c.status === 'Active').length

  const handleRelease = (claimId: string) => {
    if (!onRelease) return
    setPendingRelease(claimId)
    setTimeout(() => {
      onRelease(claimId)
      setPendingRelease(null)
    }, 900)
  }

  return (
    <div
      ref={ref}
      className={cn(
        'relative liquid-glass rounded-2xl overflow-hidden transition-all duration-500',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      )}
    >
      <div className="px-6 py-5 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text">Encumbrance Claims</h3>
          <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
            <CircleDot className="w-3 h-3 text-primary" />
            {activeCount} active · {claims.length} total
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                filter === f
                  ? 'liquid-glass text-primary border border-primary/25'
                  : 'text-text-secondary hover:text-text'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-black/25 border-b border-white/[0.07]">
              {['Claim ID', 'Token', 'Obligor', 'Claimant', 'Amount', 'Status', 'Actions'].map((head) => (
                <th
                  key={head}
                  className={cn(
                    'px-6 py-3.5 text-[10px] font-medium text-text-muted uppercase tracking-[0.16em]',
                    head === 'Amount' ? 'text-right' : 'text-left',
                    head === 'Status' || head === 'Actions' ? 'text-center' : ''
                  )}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((claim) => {
              const style = statusStyles[claim.status]
              const releasing = pendingRelease === claim.claimId
              return (
                <tr
                  key={claim.claimId}
                  className="group border-b border-white/[0.045] hover:bg-primary/[0.04] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <LockKeyhole className="w-3 h-3 text-primary/50 group-hover:text-primary/90 transition-colors" />
                      <span className="font-mono text-xs text-text-secondary">{formatAddress(claim.claimId)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                        {claim.tokenName.slice(0, 2)}
                      </span>
                      <span className="text-sm text-text">{claim.tokenName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm text-text">{claim.obligorName}</div>
                      <div className="font-mono text-[11px] text-text-muted">{formatAddress(claim.obligor)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-info/20 border border-primary/25 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {claim.claimantName.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="text-sm text-text">{claim.claimantName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-sm font-semibold text-text">{formatCurrency(claim.amount)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border', style.badge)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', style.dot, claim.status === 'Active' && 'animate-pulse')} />
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {claim.status === 'Active' && onRelease && (
                      <button
                        onClick={() => handleRelease(claim.claimId)}
                        disabled={releasing}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border',
                          releasing
                            ? 'bg-warning/10 text-warning border-warning/30 cursor-wait'
                            : 'bg-surface-raised text-text-secondary border-white/10 hover:bg-warning/10 hover:text-warning hover:border-warning/30'
                        )}
                      >
                        {releasing ? (
                          <>
                            <RotateCcw className="w-3 h-3 animate-spin" /> Releasing
                          </>
                        ) : (
                          'Release'
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="px-6 py-16 text-center">
          <ArrowUpRight className="w-6 h-6 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No {filter === 'All' ? '' : filter.toLowerCase() + ' '}claims found</p>
          <p className="text-xs text-text-muted mt-1">Create an encumbrance to guard an asset on-chain.</p>
        </div>
      )}
    </div>
  )
}