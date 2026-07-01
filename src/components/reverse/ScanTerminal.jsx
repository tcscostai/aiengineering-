import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const KIND_COLORS = {
  info: '#8b9cb0',
  ok: '#3ecf9b',
  error: '#f08984',
  warn: '#e8b84a',
}

function normalizeLog(line) {
  if (typeof line === 'string') {
    const kind = line.startsWith('✓') ? 'ok' : line.includes('[HIGH]') || line.includes('risk') ? 'warn' : 'info'
    return { ts: new Date().toISOString(), message: line, kind }
  }
  return {
    ts: line.ts ?? new Date().toISOString(),
    message: line.message ?? '',
    kind: line.kind ?? 'info',
  }
}

export function ScanTerminal({ logs = [], scanning = false, title = 'Scan pipeline' }) {
  const scrollRef = useRef(null)
  const normalized = logs.map(normalizeLog)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [logs])

  return (
    <div className="rounded-xl border border-cx-border overflow-hidden bg-[#0a0c12] shadow-[inset_0_2px_24px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-cx-border bg-cx-panel/80">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-xs text-cx-fg-dim font-mono">{title}</span>
        {scanning && (
          <motion.span
            className="ml-auto text-2xs text-cx-accent font-mono"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            scanning…
          </motion.span>
        )}
      </div>
      <div ref={scrollRef} className="h-72 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-1">
        {normalized.length === 0 && (
          <p className="text-cx-fg-dim">Awaiting scan — connect a Git repo or local workspace to begin reverse engineering.</p>
        )}
        <AnimatePresence initial={false}>
          {normalized.map((line, i) => (
            <motion.div
              key={`${line.ts}-${i}-${line.message.slice(0, 20)}`}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              style={{ color: KIND_COLORS[line.kind] ?? KIND_COLORS.info }}
            >
              <span className="text-cx-fg-dim/50 select-none">
                [{new Date(line.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
              </span>{' '}
              {line.message}
            </motion.div>
          ))}
        </AnimatePresence>
        {scanning && normalized.length > 0 && (
          <motion.div
            className="text-cx-accent/70"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            ▸ analyzing…
          </motion.div>
        )}
      </div>
    </div>
  )
}
