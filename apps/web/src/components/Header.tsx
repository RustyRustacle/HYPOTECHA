import { Menu, Wallet, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onConnectWallet: () => void
  connected: boolean
  onBackToLanding?: () => void
  onOpenMobile?: () => void
  pageTitle?: string
}

export function Header({ onConnectWallet, connected, onBackToLanding, onOpenMobile, pageTitle = 'Dashboard' }: HeaderProps) {
  return (
    <header className="relative h-16 shrink-0 flex items-center justify-between gap-4 px-4 md:px-6 bg-[rgba(9,14,28,0.6)] backdrop-blur-2xl border-b border-white/[0.07]">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="lg:hidden w-9 h-9 rounded-xl liquid-glass flex items-center justify-center text-text-secondary hover:text-text"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <button
          onClick={onBackToLanding}
          className="hidden sm:flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0"
        >
          <img src="/logo.png" alt="Hypotheca" className="w-7 h-7 rounded-md object-cover" />
          <span className="font-bold text-text text-sm tracking-tight">HYPOTECHA</span>
        </button>

        <ChevronRight className="hidden sm:block w-3.5 h-3.5 text-text-muted" />
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs md:text-sm font-medium text-text-secondary truncate">{pageTitle}</span>
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-[10px] text-primary font-medium">
            <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass text-[11px]">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-text-secondary font-mono">Hedera Testnet</span>
        </div>

        <button
          onClick={onConnectWallet}
          className={cn(
            'px-4 md:px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2',
            connected
              ? 'liquid-glass border border-primary/30 text-primary'
              : 'liquid-glass liquid-cta liquid-glass-button'
          )}
        >
          <Wallet className="w-4 h-4" strokeWidth={2} />
          <span className="hidden sm:inline">{connected ? '0x1234…ABCD' : 'Connect Wallet'}</span>
          <span className="sm:hidden">{connected ? '✓' : 'Connect'}</span>
        </button>
      </div>
    </header>
  )
}