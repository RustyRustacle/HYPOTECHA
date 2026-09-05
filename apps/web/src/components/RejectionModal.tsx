import { AnimatePresence, motion } from 'framer-motion'
import { TriangleAlert, X, ExternalLink, RotateCcw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface RejectionModalProps {
  isOpen: boolean
  requestedAmount: number
  availableAmount: number
  onClose: () => void
  onRetry: () => void
}

export function RejectionModal({ isOpen, requestedAmount, availableAmount, onClose, onRetry }: RejectionModalProps) {
  const shortfall = Math.max(0, requestedAmount - availableAmount)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative liquid-glass-strong rounded-3xl w-full max-w-md overflow-hidden border-danger/30"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          >
            <div className="h-1 bg-gradient-to-r from-danger via-danger-light to-danger" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-danger/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-danger/15 border border-danger/30 flex items-center justify-center">
                    <TriangleAlert className="w-5 h-5 text-danger" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text">Transaction Rejected</h2>
                    <p className="text-xs text-text-muted font-mono">on-chain guard check · FAILED</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl liquid-glass flex items-center justify-center text-text-muted hover:text-text transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="glow-border rounded-2xl bg-danger/5 border border-danger/20 p-4 mb-5 relative">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-danger uppercase tracking-wider">Over-Pledge Detected</span>
                  <span className="text-[10px] font-mono text-danger/70">#GUARD-001</span>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Requested</span>
                    <span className="font-mono font-semibold text-text">{formatCurrency(requestedAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Available unencumbered</span>
                    <span className="font-mono font-semibold text-primary">{formatCurrency(availableAmount)}</span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-danger/40 to-transparent" />
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Shortfall</span>
                    <span className="font-mono font-semibold text-danger">{formatCurrency(shortfall)}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                This request was rejected on-chain to prevent double-pledging of the same asset.
                The amount exceeds the available unencumbered balance.
              </p>

              <div className="flex gap-3">
                <a
                  href="https://hashscan.io/testnet"
                  target="_blank"
                  rel="noopener"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl liquid-glass liquid-glass-button text-sm font-medium text-text-secondary transition-all duration-300"
                >
                  <ExternalLink className="w-4 h-4" />
                  HashScan
                </a>
                <button
                  onClick={onRetry}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl liquid-glass liquid-cta liquid-glass-button text-sm font-semibold"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Amount
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}