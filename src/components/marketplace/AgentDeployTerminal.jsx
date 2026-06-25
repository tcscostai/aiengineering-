import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { buildAgentDeploySession } from '../../lib/agentDeployScript'

const LINE_COLORS = {
  prompt: '#3ecf9b',
  out: '#cbd5e1',
  ok: '#3ecf9b',
  warn: '#e8b84a',
  dim: '#6b7c90',
}

function MacTrafficLights({ onClose, disabled }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={disabled ? undefined : onClose}
        disabled={disabled}
        className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 disabled:opacity-80"
        aria-label="Close"
      />
      <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
      <span className="w-3 h-3 rounded-full bg-[#28c840]" />
    </div>
  )
}

function PromptLine({ text, showCursor }) {
  return (
    <div className="font-mono text-[13px] leading-[1.55] whitespace-pre-wrap break-all">
      <span className="text-[#3ecf9b]">engineer@horizon-mac</span>
      <span className="text-[#8b9cb0]">:</span>
      <span className="text-[#5ec8f2]">~/agents</span>
      <span className="text-[#8b9cb0]"> % </span>
      <span style={{ color: LINE_COLORS.prompt }}>{text}</span>
      {showCursor && <span className="inline-block w-2 h-4 bg-[#e8edf4] ml-0.5 animate-pulse align-middle" />}
    </div>
  )
}

function OutputLine({ line }) {
  return (
    <div
      className="font-mono text-[13px] leading-[1.55] whitespace-pre-wrap break-all"
      style={{ color: LINE_COLORS[line.kind] ?? LINE_COLORS.out }}
    >
      {line.text}
    </div>
  )
}

export function AgentDeployTerminal({ agent, open, onClose, onComplete }) {
  const [lines, setLines] = useState([])
  const [typingText, setTypingText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [done, setDone] = useState(false)
  const scrollRef = useRef(null)
  const idxRef = useRef(0)
  const completedRef = useRef(false)
  const sessionRef = useRef([])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    })
  }, [])

  useEffect(() => {
    if (!open || !agent) {
      setLines([])
      setTypingText('')
      setIsTyping(false)
      setDone(false)
      idxRef.current = 0
      completedRef.current = false
      return
    }

    sessionRef.current = buildAgentDeploySession(agent)
    setLines([])
    setTypingText('')
    setIsTyping(false)
    setDone(false)
    idxRef.current = 0
    completedRef.current = false
  }, [open, agent?.id, agent])

  useEffect(() => {
    if (!open || !agent || done) return

    const session = sessionRef.current
    const idx = idxRef.current

    if (idx >= session.length) {
      if (!completedRef.current) {
        completedRef.current = true
        setDone(true)
        setIsTyping(false)
        onComplete?.(agent)
      }
      return
    }

    const line = session[idx]

    if (isTyping) {
      const full = line.text
      if (typingText.length < full.length) {
        const t = setTimeout(() => {
          setTypingText(full.slice(0, typingText.length + 1))
        }, 12 + Math.random() * 18)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => {
        setLines((prev) => [...prev, line])
        setTypingText('')
        setIsTyping(false)
        idxRef.current = idx + 1
      }, 280)
      return () => clearTimeout(t)
    }

    if (line.kind === 'prompt') {
      setIsTyping(true)
      setTypingText('')
      return
    }

    const delay = line.kind === 'dim' ? 70 : line.kind === 'ok' ? 220 : 140
    const t = setTimeout(() => {
      setLines((prev) => [...prev, line])
      idxRef.current = idx + 1
    }, delay)
    return () => clearTimeout(t)
  }, [open, agent, done, isTyping, typingText, lines.length, onComplete])

  useEffect(() => {
    scrollToBottom()
  }, [lines, typingText, isTyping, scrollToBottom])

  if (!agent) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          style={{ backgroundColor: 'rgba(4, 5, 8, 0.85)' }}
          onClick={(e) => done && e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            className="w-full max-w-3xl rounded-xl overflow-hidden border border-[#3a3a3c]"
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.65)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center gap-3 px-4 py-2.5 border-b border-[#3a3a3c]"
              style={{ background: 'linear-gradient(180deg, #3d3d3f 0%, #2d2d2f 100%)' }}
            >
              <MacTrafficLights onClose={onClose} disabled={!done} />
              <div className="flex-1 text-center">
                <span className="text-[13px] text-[#b0b0b2] font-medium">
                  engineer — horizon-agent-deploy — zsh — 80×24
                </span>
              </div>
              <div className="w-14" />
            </div>

            <div
              ref={scrollRef}
              className="overflow-y-auto px-4 py-3 min-h-[420px] max-h-[min(520px,70vh)]"
              style={{ backgroundColor: '#1a1a1c' }}
            >
              {lines.map((line, i) =>
                line.kind === 'prompt' ? (
                  <PromptLine key={i} text={line.text} />
                ) : (
                  <OutputLine key={i} line={line} />
                )
              )}

              {isTyping && (
                <PromptLine text={typingText} showCursor />
              )}

              {!done && !isTyping && lines.length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-[#6b7c90] font-mono text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  running…
                </div>
              )}
            </div>

            <div
              className="flex items-center justify-between px-4 py-2 border-t border-[#3a3a3c] text-[11px] font-mono"
              style={{ backgroundColor: '#252527', color: '#8b9cb0' }}
            >
              <span className="truncate pr-4">
                {agent.name} · {agent.runtimeType} · v{agent.version}
              </span>
              {done ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 text-[#3ecf9b] hover:brightness-110 shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Done
                </button>
              ) : (
                <span className="flex items-center gap-1.5 shrink-0">
                  <Loader2 className="w-3 h-3 animate-spin text-[#5ec8f2]" />
                  Deploying
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
