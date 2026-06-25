import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { NavRail } from './NavRail'
import { TopBar } from './TopBar'
import { StatusStrip } from './StatusStrip'
import { RightDock } from './RightDock'
import { ToastContainer } from '../components/ui/ToastContainer'
import { ParticleBackground } from '../components/ui/ParticleBackground'

export function AppShell() {
  const location = useLocation()
  const { focusMode, setFocusMode } = useApp()

  if (focusMode) {
    return (
      <div className="h-full relative bg-cx-void">
        <ParticleBackground count={30} />
        <button
          onClick={() => setFocusMode(false)}
          className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl border border-cx-border bg-cx-panel/80 text-xs text-cx-fg-dim hover:text-cx-fg"
        >
          Exit Focus Mode
        </button>
        <div className="h-full overflow-y-auto p-8 mesh-bg grid-bg relative">
          <Outlet />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex min-h-0 bg-cx-void">
      <NavRail />
      <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
        <TopBar />
        <div className="flex-1 flex min-h-0 relative z-0">
          <main className="flex-1 min-h-0 overflow-y-auto relative z-0 mesh-bg grid-bg">
            <ParticleBackground count={35} />
            <div className="relative p-6 lg:p-8 min-h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname + location.search}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
          <RightDock />
        </div>
        <StatusStrip />
      </div>
      <ToastContainer />
    </div>
  )
}
