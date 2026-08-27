import { formatCurrency } from '@/lib/utils'

interface RejectionModalProps {
  isOpen: boolean
  requestedAmount: number
  availableAmount: number
  onClose: () => void
  onRetry: () => void
}

export function RejectionModal({ isOpen, requestedAmount, availableAmount, onClose, onRetry }: RejectionModalProps) {
  if (!isOpen) return null

  const shortfall = requestedAmount - availableAmount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl border border-danger/30 shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="h-1 bg-danger" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
                <span className="text-danger text-lg">✕</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text">Transaction Rejected</h2>
                <p className="text-xs text-text-muted">On-chain guard check failed</p>
              </div>
            </div>
            <button onClick={onClose} className="text-text-muted hover:text-text transition-colors text-xl">×</button>
          </div>

          <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-warning text-sm">⚠</span>
              <span className="text-sm font-semibold text-danger">Over-Pledge Detected</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Requested</span>
                <span className="font-mono font-semibold text-text">{formatCurrency(requestedAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Available</span>
                <span className="font-mono font-semibold text-primary">{formatCurrency(availableAmount)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Shortfall</span>
                <span className="font-mono font-semibold text-danger">{formatCurrency(shortfall)}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-text-secondary mb-5 leading-relaxed">
            This transaction was rejected on-chain to prevent double-pledging of the same asset. The requested amount exceeds the available unencumbered balance.
          </p>

          <div className="flex gap-3">
            <a
              href="https://hashscan.io/testnet"
              target="_blank"
              rel="noopener"
              className="flex-1 px-4 py-2.5 rounded-lg bg-surface-raised border border-border text-sm font-medium text-text-secondary text-center hover:bg-surface-raised/80 transition-all"
            >
              View on HashScan
            </a>
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light transition-all"
            >
              Try Different Amount
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
