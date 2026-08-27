import { cn } from '@/lib/utils'

interface HeaderProps {
  onConnectWallet: () => void
  connected: boolean
  onBackToLanding?: () => void
}

export function Header({ onConnectWallet, connected, onBackToLanding }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border/50 bg-surface/60 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-[10px]">H</div>
          <span className="font-semibold text-text text-sm tracking-tight">HYPOTECHA</span>
        </button>
        <span className="text-border/50 mx-1">|</span>
        <div className="text-text-secondary text-sm font-medium">Dashboard</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-border/50 text-xs">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-text-secondary font-mono">Testnet</span>
        </div>
        <button
          onClick={onConnectWallet}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
            connected
              ? 'glass border border-primary/30 text-primary'
              : 'bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20 hover:shadow-primary/40'
          )}
        >
          {connected ? '0x1234...ABCD' : 'Connect Wallet'}
        </button>
      </div>
    </header>
  )
}
