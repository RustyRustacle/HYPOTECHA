import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, ShieldCheck, Loader2, LogOut, ArrowRight, Check, Copy, ExternalLink, QrCode } from 'lucide-react'
import QRCode from 'qrcode'
import { cn, formatAddress } from '@/lib/utils'

interface ConnectGateProps {
  connected: boolean
  evmAddress?: string | null
  accountId?: string | null
  pairingString?: string | null
  connectionState?: 'Connecting' | 'Connected' | 'Disconnected' | 'Paired' | null
  onConnect: () => void
  onDisconnect: () => void
  onDone: () => void
}

const ease = [0.32, 0.72, 0, 1] as const

export function ConnectGate({ connected, evmAddress, accountId, pairingString, connectionState, onConnect, onDisconnect, onDone }: ConnectGateProps) {
  const [ack, setAck] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])

  const [qrSrc, setQrSrc] = useState<string | null>(null)
  useEffect(() => {
    if (!pairingString || qrSrc) return
    QRCode.toDataURL(pairingString, { width: 160, margin: 1, color: { dark: '#f8fafc', light: '#090e1c' } }).then(setQrSrc).catch(() => {})
  }, [pairingString, qrSrc])

  const connecting = !connected && (connectionState === 'Connecting' || connectionState === 'Paired')

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-background px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3, ease } }}
      exit={{ opacity: 0, transition: { duration: 0.25, ease } }}
      role="dialog"
      aria-modal="true"
      aria-label="Connect wallet required"
    >
      <div className="absolute inset-0 mesh-gradient pointer-events-none" aria-hidden />
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" aria-hidden />
      <div className="orb w-[440px] h-[440px] bg-primary/15 top-[-130px] left-[12%] pointer-events-none" aria-hidden />
      <div className="orb w-[360px] h-[360px] bg-info/10 bottom-[-110px] right-[10%] pointer-events-none" style={{ animationDelay: '2s', animationDuration: '9s' }} aria-hidden />

      <div className="relative w-[min(94vw,440px)] rounded-3xl liquid-glass-strong noise-overlay p-7 sm:p-8 overflow-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-11 h-11">
            <img src="/logo.png" alt="Hypotheca" className="w-11 h-11 rounded-lg object-cover" />
            {connecting && (
              <span className="absolute inset-0 rounded-lg bg-primary/25 animate-ping" aria-hidden />
            )}
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-text">HYPOTECHA</div>
            <div className="text-[11px] font-mono text-text-muted">identity gate · hashpack</div>
          </div>
        </div>

        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl liquid-glass flex items-center justify-center mb-4">
            {connected ? (
              <ShieldCheck className="w-7 h-7 text-primary" />
            ) : (
              <Wallet className="w-7 h-7 text-text-secondary" />
            )}
          </div>

          <h1 className="text-xl font-bold tracking-tight text-text mb-1.5">
            {connected ? 'Wallet connected' : 'Connect your wallet'}
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            {connected
              ? 'Your identity is bound to the registry. You can open the dashboard.'
              : 'Every action is tied to a Hedera account. Link HashPack to unlock the dashboard.'}
          </p>
        </div>

        <div className="mt-6 rounded-2xl liquid-glass border border-white/[0.07] p-4 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">account</span>
            <span className="text-text-secondary">{connected ? (accountId ?? '—') : '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">evm</span>
            <span className="text-primary-light">{connected ? (evmAddress ? formatAddress(evmAddress) : '—') : '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">status</span>
            <span className={connected ? 'text-primary' : connecting ? 'text-warning-light' : 'text-text-muted'}>
              {connected ? 'paired' : connecting ? 'waiting…' : 'disconnected'}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          {connected ? (
            <button
              onClick={onDone}
              className={cn(
                'w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300',
                ack
                  ? 'liquid-glass liquid-cta liquid-glass-button'
                  : 'liquid-glass border border-primary/30 text-primary hover:bg-primary/10'
              )}
            >
              {ack ? <ArrowRight className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              Continue
            </button>
          ) : (
            <>
              <button
                onClick={onConnect}
                disabled={connecting}
                className={cn(
                  'w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300',
                  'liquid-glass liquid-cta liquid-glass-button',
                  connecting && 'opacity-70 pointer-events-none'
                )}
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                {connecting ? 'Waiting for HashPack…' : 'Open HashPack'}
              </button>

              {pairingString && (
                <>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/[0.07]" />
                    </div>
                    <div className="relative flex justify-center text-[10px]">
                      <span className="bg-background/80 px-2 text-text-muted font-mono">or scan QR / copy pairing string</span>
                    </div>
                  </div>

                  <div className="rounded-2xl liquid-glass border border-white/[0.07] p-4 flex flex-col items-center gap-3">
                    {qrSrc && (
                      <div className="rounded-xl overflow-hidden bg-background/60 p-2">
                        <img src={qrSrc} alt="HashPack pairing QR" className="w-[160px] h-[160px] block" />
                      </div>
                    )}

                    {!qrSrc && pairingString && (
                      <div className="w-[160px] h-[160px] rounded-xl liquid-glass flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
                      </div>
                    )}

                    <div className="w-full">
                      <div className="text-[10px] text-text-muted mb-1.5 font-mono flex items-center gap-1">
                        <QrCode className="w-3 h-3" />
                        pairing string
                      </div>
                      <button
                        onClick={() => {
                          if (!pairingString) return
                          navigator.clipboard.writeText(pairingString).catch(() => {})
                          setCopied(true)
                        }}
                        className="w-full rounded-xl liquid-glass border border-white/[0.07] px-3 py-2.5 text-left font-mono text-[11px] text-text-secondary hover:border-primary/30 transition-colors group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="break-all line-clamp-3 select-all">{pairingString}</span>
                          <span className="shrink-0 text-[10px] text-text-muted group-hover:text-primary flex flex-col items-center gap-0.5">
                            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                          </span>
                        </div>
                      </button>
                    </div>

                    <p className="text-[10px] text-text-muted text-center leading-relaxed">
                      Open HashPack → tap <b>Scan / Connect</b> → scan this QR or paste the string above.
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {connected && (
            <button
              onClick={onDisconnect}
              className="w-full py-2.5 rounded-xl text-xs font-medium text-text-muted hover:text-text flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Use a different wallet
            </button>
          )}
        </div>

        {!connected && (
          <p className="mt-5 text-center font-mono text-[10px] text-text-muted tracking-wider">
            HashPack extension opens on Connect. Pairing stays until you disconnect.
          </p>
        )}
      </div>
    </motion.div>
  )
}