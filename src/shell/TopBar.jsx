import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { getNavItemForPath } from '../config/navigation'
import { BRAND } from '../lib/branding'
import {
  Search,
  Bell,
  Maximize2,
  PanelRight,
  Activity,
  Shield,
  Gauge,
  Recycle,
  LogOut,
  ChevronDown,
  User,
} from 'lucide-react'

export function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [healthOpen, setHealthOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const menuRef = useRef(null)
  const healthRef = useRef(null)
  const {
    health,
    currentInitiative,
    dockOpen,
    setDockOpen,
    setFocusMode,
  } = useApp()

  const currentNav = getNavItemForPath(location.pathname)

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      if (healthRef.current && !healthRef.current.contains(e.target)) setHealthOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleHealth = () => {
    setHealthOpen((v) => !v)
    setMenuOpen(false)
  }

  const toggleMenu = () => {
    setMenuOpen((v) => !v)
    setHealthOpen(false)
  }

  const ribbonMetrics = [
    { label: 'Reuse', value: `${health.reuseRatio}%`, icon: Recycle },
    { label: 'Health', value: health.score, icon: Activity },
    { label: 'Evaluation', value: health.evaluationScore, icon: Gauge },
    { label: 'Governance', value: health.governanceStatus, icon: Shield },
    { label: 'Runtime', value: health.runtimeStatus, icon: Activity },
  ]

  return (
    <header className="shrink-0 h-12 border-b border-cx-line bg-cx-deep/75 backdrop-blur-2xl relative z-40 overflow-visible isolate">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/7 to-transparent" />

      <div className="h-full px-3 flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 shrink">
          <div className="min-w-0">
            <p className="font-display font-semibold text-sm text-cx-fg leading-tight truncate">
              {currentNav?.label ?? BRAND.name}
            </p>
            <p className="text-[10px] text-cx-fg-dim truncate max-w-[180px] sm:max-w-[240px]">
              {currentInitiative.title}
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-cx-border bg-cx-panel/50 shrink-0">
          <span className="font-mono text-[10px] text-cx-accent">PROD</span>
        </div>

        <div className="flex-1 min-w-0" />

        <div className="relative shrink-0 z-50" ref={healthRef}>
          <button
            type="button"
            onClick={toggleHealth}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-cx-border/50 bg-cx-panel/30 hover:border-cx-border-strong transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-cx-accent" strokeWidth={1.75} />
            <span className="text-[10px] text-cx-fg-dim hidden sm:inline">Health</span>
            <span className="text-xs font-mono text-cx-fg">{health.score || '—'}</span>
            <ChevronDown className={`w-3 h-3 text-cx-fg-dim transition-transform ${healthOpen ? 'rotate-180' : ''}`} />
          </button>

          {healthOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-cx-border bg-cx-panel shadow-2xl py-1 z-[100]">
              {ribbonMetrics.map((m) => (
                <div key={m.label} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="flex items-center gap-2 text-cx-fg-dim">
                    <m.icon className="w-3.5 h-3.5 text-cx-accent" strokeWidth={1.75} />
                    {m.label}
                  </span>
                  <span className="font-mono text-cx-fg">{m.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0">
          {searchOpen ? (
            <div className="relative w-44 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cx-accent" strokeWidth={1.75} />
              <input
                type="text"
                autoFocus
                placeholder="Search…"
                onBlur={() => setSearchOpen(false)}
                className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-cx-border bg-cx-panel/50 text-xs text-cx-fg placeholder:text-cx-fg-dim focus:outline-none focus:border-cx-accent/40"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-1.5 rounded-lg border border-cx-border hover:border-cx-accent/30 text-cx-fg-dim hover:text-cx-fg transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button className="p-1.5 rounded-lg border border-cx-border hover:border-cx-accent/30 text-cx-fg-dim hover:text-cx-fg transition-colors hidden sm:block">
            <Bell className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <button
            onClick={() => setFocusMode(true)}
            className="p-1.5 rounded-lg border border-cx-border hover:border-cx-accent/30 text-cx-fg-dim hover:text-cx-fg transition-colors hidden sm:block"
          >
            <Maximize2 className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <button
            onClick={() => setDockOpen(!dockOpen)}
            className={`p-1.5 rounded-lg border transition-colors ${
              dockOpen ? 'border-cx-accent/40 text-cx-accent bg-cx-accent/10' : 'border-cx-border text-cx-fg-dim hover:text-cx-fg'
            }`}
          >
            <PanelRight className="w-4 h-4" strokeWidth={1.75} />
          </button>

          <div className="relative z-50" ref={menuRef}>
            <button
              type="button"
              onClick={toggleMenu}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg border border-cx-border bg-cx-panel/50 hover:border-cx-border-strong transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cx-accent/30 to-cx-accent2/30 border border-cx-accent/30 flex items-center justify-center text-[9px] font-semibold text-cx-fg">
                {user?.avatar ?? 'U'}
              </div>
              <ChevronDown className={`w-3 h-3 text-cx-fg-dim transition-transform hidden sm:block ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-cx-border bg-cx-panel shadow-2xl py-1 z-[100]">
                <div className="px-3 py-2 border-b border-cx-border">
                  <p className="text-xs font-medium text-cx-fg truncate">{user?.name}</p>
                  <p className="text-[10px] text-cx-fg-dim truncate">{user?.role}</p>
                </div>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-cx-fg-dim hover:bg-cx-raised/50 hover:text-cx-fg"
                >
                  <User className="w-3.5 h-3.5" /> Profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-cx-danger hover:bg-cx-danger/10"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
