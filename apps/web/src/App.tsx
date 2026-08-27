import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Landing } from '@/pages/Landing'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { Dashboard } from '@/pages/Dashboard'
import { Assets } from '@/pages/Assets'
import { Claims } from '@/pages/Claims'
import { CreateClaim } from '@/pages/CreateClaim'
import { History } from '@/pages/History'

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

export default function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing')
  const [activePage, setActivePage] = useState('dashboard')
  const [walletConnected, setWalletConnected] = useState(false)

  const handleLaunchApp = () => setView('app')
  const handleBackToLanding = () => setView('landing')

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={setActivePage} />
      case 'assets': return <Assets onNavigate={setActivePage} />
      case 'claims': return <Claims />
      case 'create': return <CreateClaim onNavigate={setActivePage} />
      case 'history': return <History />
      default: return <Dashboard onNavigate={setActivePage} />
    }
  }

  return (
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
          className="flex h-screen bg-background"
        >
          <Sidebar activePage={activePage} onNavigate={setActivePage} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header
              onConnectWallet={() => setWalletConnected(!walletConnected)}
              connected={walletConnected}
              onBackToLanding={handleBackToLanding}
            />
            <main className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePage}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {renderPage()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
