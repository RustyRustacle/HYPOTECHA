import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { LockKeyhole } from 'lucide-react'

interface BootScreenProps {
  onDone: () => void
}

interface RegistryRow {
  symbol: string
  amount: string
  kind: 'HOLD' | 'FREE'
}

const REGISTRY_SETS: RegistryRow[][] = [
  [
    { symbol: 'UST-123', amount: '$1,000,000', kind: 'HOLD' },
    { symbol: 'REFT-456', amount: '$500,000', kind: 'HOLD' },
    { symbol: 'TBC-789', amount: '$2,500,000', kind: 'FREE' },
  ],
  [
    { symbol: 'CNS-231', amount: '$750,000', kind: 'HOLD' },
    { symbol: 'GLD-552', amount: '$300,000', kind: 'FREE' },
    { symbol: 'RWA-077', amount: '$1,800,000', kind: 'HOLD' },
  ],
]

const ease = [0.32, 0.72, 0, 1] as const

export function BootScreen({ onDone }: BootScreenProps) {
  const reduce = useReducedMotion()
  const [setIdx] = useState(() => Math.floor(Math.random() * REGISTRY_SETS.length))
  const [phase, setPhase] = useState(0)
  const lines = REGISTRY_SETS[setIdx]

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    if (reduce) {
      onDone()
      return
    }
    const timers = [
      setTimeout(() => setPhase(1), 480),
      setTimeout(() => setPhase(2), 1150),
      setTimeout(onDone, 1680),
    ]
    return () => timers.forEach(clearTimeout)
  }, [reduce, onDone])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') onDone()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-background px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3, ease } }}
      exit={{ opacity: 0, transition: { duration: 0.3, ease } }}
      onPointerDown={onDone}
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0 mesh-gradient pointer-events-none" aria-hidden />
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" aria-hidden />
      <div className="orb w-[420px] h-[420px] bg-primary/15 top-[-120px] left-[10%] pointer-events-none" aria-hidden />
      <div className="orb w-[340px] h-[340px] bg-info/10 bottom-[-100px] right-[8%] pointer-events-none" style={{ animationDelay: '2s' }} aria-hidden />

      <div className="relative w-[min(92vw,400px)] rounded-3xl liquid-glass-strong noise-overlay p-7 sm:p-8 overflow-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-11 h-11">
            <img src="/logo.png" alt="Hypotheca" className="w-11 h-11 rounded-lg object-cover" />
            {phase === 0 && (
              <span className="absolute inset-0 rounded-lg bg-primary/25 animate-ping" aria-hidden />
            )}
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-text">HYPOTECHA</div>
            <div className="text-[11px] font-mono text-text-muted">encumbrance os · power-on</div>
          </div>
        </div>

        <div className="space-y-2 font-mono text-[11px] sm:text-xs min-h-[132px]">
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease }}
          >
            <span className="text-text-muted">▸</span>{' '}
            <span className="text-text-secondary">handshake · hedera testnet 0.0.296</span>
            {phase >= 1 && <span className="text-primary-light"> ✓ ok</span>}
          </motion.div>

          {phase >= 1 && (
            <div className="space-y-1.5 pt-1">
              {lines.map((row, i) => (
                <motion.div
                  key={row.symbol}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, ease, delay: i * 0.16 }}
                >
                  <span className={row.kind === 'FREE' ? 'text-primary' : 'text-text-secondary'}>
                    {row.symbol}
                  </span>
                  <span className="text-text-muted"> · {row.amount} · </span>
                  <span className={row.kind === 'FREE' ? 'text-primary' : 'text-warning-light'}>
                    {row.kind}
                  </span>
                  {phase >= 2 && <span className="text-primary-light"> · OK</span>}
                </motion.div>
              ))}
            </div>
          )}

          {phase >= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, ease }}
              className="pt-1.5 flex items-center gap-2"
            >
              <LockKeyhole className="w-3.5 h-3.5 text-primary-light" />
              <span className="text-primary-light">guard armed · encumbrance live ✓</span>
            </motion.div>
          )}
        </div>

        <div className="mt-6 text-center font-mono text-[10px] text-text-muted tracking-wider">
          [ click / enter to skip ]
        </div>
      </div>
    </motion.div>
  )
}