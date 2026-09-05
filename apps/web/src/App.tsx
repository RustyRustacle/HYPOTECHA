import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Landing } from '@/pages/Landing'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { Dashboard } from '@/pages/Dashboard'
import { Assets } from '@/pages/Assets'
import { Claims } from '@/pages/Claims'
import { CreateClaim } from '@/pages/CreateClaim'
import { History } from '@/pages/History'
import { BootScreen } from '@/components/BootScreen'

const ease = [0.4, 0, 0.2, 1] as const

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease } },
}

const shellVariants = {
  initial: { opacity: 0, scale: 0.985 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.45, ease } },
  exit: { opacity: 0, scale: 1.01, transition: { duration: 0.3, ease } },
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  assets: 'Assets',
  claims: 'Claims',
  create: 'New Claim',
  history: 'History',
}

const SECTION_ACCENTS: Record<string, string> = {
  dashboard:
    'radial-gradient(at 15% 20%, rgba(59,130,246,0.16) 0%, transparent 55%), radial-gradient(at 85% 88%, rgba(96,165,250,0.12) 0%, transparent 50%)',
  assets:
    'radial-gradient(at 15% 20%, rgba(16,185,129,0.16) 0%, transparent 55%), radial-gradient(at 85% 88%, rgba(52,211,153,0.11) 0%, transparent 50%)',
  claims:
    'radial-gradient(at 15% 20%, rgba(148,163,184,0.15) 0%, transparent 55%), radial-gradient(at 85% 88%, rgba(203,213,225,0.1) 0%, transparent 50%)',
  create:
    'radial-gradient(at 15% 20%, rgba(245,158,11,0.15) 0%, transparent 55%), radial-gradient(at 85% 88%, rgba(251,191,36,0.1) 0%, transparent 50%)',
  history:
    'radial-gradient(at 15% 20%, rgba(139,92,246,0.16) 0%, transparent 55%), radial-gradient(at 85% 88%, rgba(167,139,250,0.11) 0%, transparent 50%)',
}

export default function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing')
  const [launching, setLaunching] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [walletConnected, setWalletConnected] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [mobileOpen])

  const handleLaunchApp = () => setLaunching(true)
  const handleBootDone = () => {
    setLaunching(false)
    setView('app')
  }
  const handleBackToLanding = () => setView('landing')

  const navigate = (page: string) => {
    setActivePage(page)
    setMobileOpen(false)
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={navigate} />
      case 'assets': return <Assets onNavigate={navigate} />
      case 'claims': return <Claims />
      case 'create': return <CreateClaim onNavigate={navigate} />
      case 'history': return <History />
      default: return <Dashboard onNavigate={navigate} />
    }
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.4 } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
          >
            <Landing onLaunchApp={handleLaunchApp} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            variants={shellVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative flex h-screen bg-background overflow-hidden"
          >
            {/* Ambient background layers */}
            <div className="fixed inset-0 mesh-gradient pointer-events-none" aria-hidden />
            <div className="fixed inset-0 grid-bg opacity-25 pointer-events-none" aria-hidden />
            <div className="orb w-[520px] h-[520px] bg-primary/15 top-[-140px] left-[20%] pointer-events-none" aria-hidden />
            <div className="orb w-[380px] h-[380px] bg-info/10 bottom-[-120px] right-[12%] pointer-events-none" style={{ animationDelay: '2.5s', animationDuration: '9s' }} aria-hidden />

            <AnimatePresence>
              <motion.div
                key={activePage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease }}
                className="fixed inset-0 pointer-events-none"
                style={{ background: SECTION_ACCENTS[activePage] ?? SECTION_ACCENTS.dashboard }}
                aria-hidden
              />
            </AnimatePresence>

            <Sidebar activePage={activePage} onNavigate={navigate} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
              <Header
                onConnectWallet={() => setWalletConnected(!walletConnected)}
                connected={walletConnected}
                onBackToLanding={handleBackToLanding}
                onOpenMobile={() => setMobileOpen(true)}
                pageTitle={PAGE_TITLES[activePage] ?? 'Dashboard'}
              />
              <main className="flex-1 overflow-y-auto px-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePage}
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="py-6"
                  >
                    {renderPage()}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {launching && <BootScreen onDone={handleBootDone} />}
      </AnimatePresence>
    </>
  )
}