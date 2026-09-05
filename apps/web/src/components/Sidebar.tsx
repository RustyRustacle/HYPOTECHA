import { type ElementType } from 'react'
import { LayoutDashboard, Boxes, ClipboardList, BadgePlus, ScrollText, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type PageId = 'dashboard' | 'assets' | 'claims' | 'create' | 'history'

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

const navItems: { id: PageId; label: string; icon: ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'assets', label: 'Assets', icon: Boxes },
  { id: 'claims', label: 'Claims', icon: ClipboardList },
  { id: 'create', label: 'New Claim', icon: BadgePlus },
  { id: 'history', label: 'History', icon: ScrollText },
]

function SidebarContent({ activePage, onNavigate }: Pick<SidebarProps, 'activePage' | 'onNavigate'>) {
  return (
    <>
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <img
            src="/logo.png"
            alt="Hypotheca"
            className="w-9 h-9 rounded-lg object-cover shadow-lg shadow-black/50"
          />
          <div className="text-left">
            <div className="text-[15px] font-bold tracking-tight text-text">HYPOTECHA</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Encumbrance OS</div>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-[0.2em] text-text-muted">Protocol</div>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left relative',
                active
                  ? 'liquid-glass text-primary border border-primary/25'
                  : 'text-text-secondary hover:bg-white/[0.04] hover:text-text border border-transparent'
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                  active
                    ? 'bg-primary/15 text-primary shadow-inner'
                    : 'bg-surface-raised text-text-muted group-hover:text-text'
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </span>
              {item.label}
              {item.id === 'create' && (
                <span className="ml-auto text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">
                  New
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/[0.06] space-y-2">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl liquid-glass text-[11px]">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-text-secondary font-medium">Hedera Testnet</span>
          <span className="ml-auto font-mono text-text-muted">0.0.296</span>
        </div>
        <p className="px-3 text-[10px] leading-relaxed text-text-muted">
          Every claim guarded on-chain against double-pledging.
        </p>
      </div>
    </>
  )
}

export function Sidebar({ activePage, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-64 flex-col shrink-0 bg-[rgba(9,14,28,0.72)] backdrop-blur-2xl border-r border-white/[0.07] min-h-screen">
        <SidebarContent activePage={activePage} onNavigate={onNavigate} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden transition-opacity duration-300',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
        <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface flex flex-col border-r border-white/10 shadow-2xl transition-transform duration-300"
          style={{ transform: mobileOpen ? 'translateX(0)' : 'translateX(-110%)' }}
        >
          <button
            onClick={onCloseMobile}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl liquid-glass flex items-center justify-center text-text-secondary hover:text-text"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
          <SidebarContent activePage={activePage} onNavigate={onNavigate} />
        </aside>
      </div>
    </>
  )
}