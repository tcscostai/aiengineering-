import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ChevronDown, Triangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { navGroups } from '../config/navigation'

function groupHasActiveRoute(items, pathname) {
  return items.some(
    (item) =>
      item.path === '/'
        ? pathname === '/'
        : pathname === item.path || pathname.startsWith(`${item.path}/`)
  )
}

export function NavRail() {
  const { navExpanded, setNavExpanded } = useApp()
  const { pathname } = useLocation()
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(navGroups.map((g) => [g.id, groupHasActiveRoute(g.items, pathname)]))
  )

  useEffect(() => {
    const activeGroup = navGroups.find((g) => groupHasActiveRoute(g.items, pathname))
    if (activeGroup) {
      setOpenGroups((prev) => ({ ...prev, [activeGroup.id]: true }))
    }
  }, [pathname])

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  return (
    <motion.aside
      animate={{ width: navExpanded ? 220 : 68 }}
      transition={{ type: 'spring', stiffness: 400, damping: 42, mass: 0.7 }}
      className="shrink-0 h-full flex flex-col bg-cx-deep/80 backdrop-blur-2xl border-r border-cx-line relative"
    >
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-cx-accent/30 via-transparent to-cx-accent2/20" />

      <div className="p-3 border-b border-cx-line">
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-cx-accent/20 to-cx-accent2/20 border border-cx-accent/30 flex items-center justify-center">
            <Triangle className="w-4 h-4 text-cx-accent" strokeWidth={1.75} />
          </div>
          {navExpanded && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="min-w-0">
              <p className="font-display font-semibold text-sm text-cx-fg truncate">HORIZON</p>
              <p className="text-[9px] uppercase text-cx-fg-dim tracking-widest truncate">AI Engineering</p>
            </motion.div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-1.5 space-y-1">
        {navGroups.map((group) => {
          const isOpen = openGroups[group.id] ?? true

          return (
            <div key={group.id}>
              {navExpanded ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[9px] uppercase tracking-wider text-cx-fg-dim hover:text-cx-fg-muted transition-colors"
                >
                  <span>{group.label}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                </button>
              ) : (
                <div className="h-px mx-2 my-1.5 bg-cx-border/60 first:hidden" />
              )}

              <AnimatePresence initial={false}>
                {(isOpen || !navExpanded) && (
                  <motion.div
                    initial={navExpanded ? { height: 0, opacity: 0 } : false}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-0.5 overflow-hidden"
                  >
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        title={item.label}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all group ${
                            isActive
                              ? 'bg-cx-accent/10 border-l-2 border-cx-accent text-cx-fg shadow-[0_0_20px_rgba(94,200,242,0.08)]'
                              : 'text-cx-fg-dim hover:text-cx-fg-muted hover:bg-white/[0.03] border-l-2 border-transparent'
                          }`
                        }
                      >
                        <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                        {navExpanded && (
                          <span className="text-xs font-medium truncate">{item.shortLabel ?? item.label}</span>
                        )}
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      <div className="p-2 border-t border-cx-line">
        <button
          onClick={() => setNavExpanded(!navExpanded)}
          className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg border border-cx-border bg-white/[0.03] hover:border-cx-border-strong hover:bg-white/[0.05] text-cx-fg-dim hover:text-cx-fg-muted transition-colors"
        >
          {navExpanded ? (
            <>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="text-[9px] uppercase tracking-widest">Collapse</span>
            </>
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </motion.aside>
  )
}
