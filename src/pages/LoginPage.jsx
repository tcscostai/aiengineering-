import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Shield,
  Bot,
  Network,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getTokenPreview } from '../services/authService'
import { ParticleBackground } from '../components/ui/ParticleBackground'
import { TcsLogo } from '../components/ui/TcsLogo'
import { BRAND } from '../lib/branding'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('form') // form | issuing | success
  const [issuedToken, setIssuedToken] = useState('')

  const from = location.state?.from?.pathname ?? '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setPhase('issuing')

    const result = await login(username, password, remember)
    if (!result.ok) {
      setPhase('form')
      setError(result.error)
      return
    }

    setIssuedToken(result.session.accessToken)
    setPhase('success')
    setTimeout(() => navigate(from, { replace: true }), 1800)
  }

  return (
    <div className="min-h-full flex bg-cx-void relative overflow-hidden">
      <ParticleBackground count={50} />

      {/* Ambient mesh */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 15% 40%, rgba(94,200,242,0.12) 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 85% 20%, rgba(155,139,212,0.1) 0%, transparent 50%), radial-gradient(ellipse 40% 40% at 70% 80%, rgba(62,207,155,0.06) 0%, transparent 45%)',
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row w-full min-h-full">
        {/* Left — brand */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 xl:p-16 border-r border-cx-line"
        >
          <div>
            <div className="mb-16">
              <TcsLogo variant="hero" className="mb-2" />
              <p className="text-[10px] uppercase tracking-[0.25em] text-cx-fg-dim mt-4">{BRAND.productName}</p>
            </div>

            <h1 className="font-display text-4xl xl:text-5xl font-semibold text-cx-fg leading-[1.1] mb-6 max-w-lg">
              Engineering AI at{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cx-accent to-cx-accent2">
                Enterprise Scale
              </span>
            </h1>
            <p className="text-cx-fg-dim text-base leading-relaxed max-w-md mb-12">
              {BRAND.loginSubtitle}
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-lg">
              {[
                { icon: Bot, label: '8 Agents', sub: 'AD · AMS · QE' },
                { icon: Network, label: 'Knowledge', sub: 'Graph + Debt' },
                { icon: Shield, label: 'Governed', sub: 'SOC2 ready' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="p-4 rounded-2xl border border-cx-border bg-cx-panel/40 backdrop-blur-xl"
                >
                  <item.icon className="w-5 h-5 text-cx-accent mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-cx-fg">{item.label}</p>
                  <p className="text-[10px] text-cx-fg-dim mt-0.5">{item.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-cx-fg-dim font-mono">
            {BRAND.footerLine} · {BRAND.version}
          </p>
        </motion.div>

        {/* Right — login */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-[420px]"
          >
            <div className="rounded-2xl border border-cx-border-strong bg-cx-panel/60 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.45)] overflow-hidden">
              <div className="h-px bg-gradient-to-r from-transparent via-cx-accent/40 to-transparent" />

              <div className="p-8 sm:p-10">
                <AnimatePresence mode="wait">
                  {phase === 'form' && (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <div className="mb-8 lg:hidden flex justify-center">
                        <TcsLogo variant="hero" className="!object-center max-w-[min(100%,320px)] sm:max-w-[min(100%,360px)]" />
                      </div>
                      <div className="mb-8">
                        <p className="text-2xs uppercase tracking-[0.22em] text-cx-accent mb-2">Secure Sign In</p>
                        <h2 className="font-display text-2xl font-semibold text-cx-fg">Welcome back</h2>
                        <p className="text-sm text-cx-fg-dim mt-1">Enter your credentials to access the platform</p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="text-2xs uppercase tracking-wider text-cx-fg-dim mb-1.5 block">
                            Username
                          </label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cx-fg-dim" />
                            <input
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              placeholder="Your name"
                              required
                              autoComplete="username"
                              className="w-full pl-10 pr-4 py-3 rounded-xl border border-cx-border bg-cx-void/50 text-sm text-cx-fg placeholder:text-cx-fg-dim focus:outline-none focus:border-cx-accent/50 focus:ring-1 focus:ring-cx-accent/20 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-2xs uppercase tracking-wider text-cx-fg-dim mb-1.5 block">
                            Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cx-fg-dim" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              autoComplete="current-password"
                              className="w-full pl-10 pr-11 py-3 rounded-xl border border-cx-border bg-cx-void/50 text-sm text-cx-fg placeholder:text-cx-fg-dim focus:outline-none focus:border-cx-accent/50 focus:ring-1 focus:ring-cx-accent/20 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-cx-fg-dim hover:text-cx-fg p-1"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={remember}
                              onChange={(e) => setRemember(e.target.checked)}
                              className="rounded border-cx-border bg-cx-void text-cx-accent focus:ring-cx-accent/30"
                            />
                            <span className="text-xs text-cx-fg-dim">Remember for 24h</span>
                          </label>
                        </div>

                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-cx-danger px-3 py-2 rounded-lg bg-cx-danger/10 border border-cx-danger/20"
                          >
                            {error}
                          </motion.p>
                        )}

                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-cx-accent/50 bg-gradient-to-r from-cx-accent/20 to-cx-accent2/15 text-cx-accent font-medium text-sm hover:from-cx-accent/30 hover:to-cx-accent2/25 transition-all shadow-[0_0_24px_rgba(94,200,242,0.12)]"
                        >
                          Sign in with JWT
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {phase === 'issuing' && (
                    <motion.div
                      key="issuing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-12 flex flex-col items-center text-center"
                    >
                      <div className="relative mb-6">
                        <div className="w-16 h-16 rounded-2xl border border-cx-accent/30 bg-cx-accent/10 flex items-center justify-center">
                          <KeyRound className="w-8 h-8 text-cx-accent" />
                        </div>
                        <Loader2 className="w-6 h-6 text-cx-accent absolute -bottom-1 -right-1 animate-spin" />
                      </div>
                      <p className="font-display text-lg font-semibold text-cx-fg mb-1">Issuing JWT</p>
                      <p className="text-sm text-cx-fg-dim">HS256 · validating credentials · signing token</p>
                    </motion.div>
                  )}

                  {phase === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-8 flex flex-col items-center text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="w-16 h-16 rounded-2xl border border-cx-success/40 bg-cx-success/10 flex items-center justify-center mb-6"
                      >
                        <CheckCircle2 className="w-8 h-8 text-cx-success" />
                      </motion.div>
                      <p className="font-display text-lg font-semibold text-cx-fg mb-1">Authenticated</p>
                      <p className="text-sm text-cx-fg-dim mb-4">Bearer token issued · redirecting to platform</p>
                      <div className="w-full p-3 rounded-xl border border-cx-border bg-cx-void/60 text-left">
                        <p className="text-[10px] uppercase text-cx-fg-dim mb-1">access_token</p>
                        <p className="font-mono text-[10px] text-cx-accent break-all leading-relaxed">
                          {getTokenPreview(issuedToken)}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="px-8 py-3 border-t border-cx-border bg-cx-void/30 flex items-center justify-center gap-2">
                <Lock className="w-3 h-3 text-cx-success" />
                <span className="text-[10px] text-cx-fg-dim font-mono">
                  TLS 1.3 · JWT HS256 · Session encrypted at rest
                </span>
              </div>
            </div>

            <p className="text-center text-[10px] text-cx-fg-dim mt-6">
              By signing in you agree to {BRAND.policiesLabel}.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
