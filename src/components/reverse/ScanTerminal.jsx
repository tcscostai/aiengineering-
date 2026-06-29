import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const KIND_COLORS = {
  info: '#8b9cb0',
  ok: '#3ecf9b',
  error: '#f08984',
  warn: '#e8b84a',
}

export function ScanTerminal({ logs = [], scanning = false, title = 'Scan pipeline' }) {
  const scrollRef = useRef(null)

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
      <div ref={scrollRef} className="h-56 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed space-y-1">
        {logs.length === 0 && (
          <p className="text-cx-fg-dim">Awaiting scan — connect a Git repo or local workspace to begin reverse engineering.</p>
        )}
        {logs.map((line, i) => (
          <div key={`${line.ts}-${i}`} style={{ color: KIND_COLORS[line.kind] ?? KIND_COLORS.info }}>
            <span className="text-cx-fg-dim/60">[{new Date(line.ts).toLocaleTimeString()}]</span> {line.message}
          </div>
        ))}
      </div>
    </div>
  )
}
