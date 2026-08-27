import { cn } from '@/lib/utils'

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  )},
  { id: 'assets', label: 'Assets', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
  )},
  { id: 'claims', label: 'Claims', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  )},
  { id: 'create', label: 'New Claim', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
  )},
  { id: 'history', label: 'History', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  )},
]

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-60 border-r border-border/50 bg-surface/80 backdrop-blur-xl flex flex-col min-h-screen shrink-0">
      <div className="p-5 border-b border-border/50">
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">H</div>
          <span className="font-semibold text-text text-base tracking-tight">HYPOTECHA</span>
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left',
              activePage === item.id
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-text-secondary hover:bg-surface-raised hover:text-text border border-transparent'
            )}
          >
            <span className={cn(
              'flex items-center justify-center w-7 h-7 rounded-lg transition-all',
              activePage === item.id ? 'bg-primary/15' : 'bg-surface-raised'
            )}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass border border-border/50 text-xs">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-text-secondary font-mono">Hedera Testnet</span>
        </div>
      </div>
    </aside>
  )
}
