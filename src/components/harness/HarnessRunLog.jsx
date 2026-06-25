import { motion } from 'framer-motion'

export function HarnessRunLog({ logs, maxHeight = 240 }) {
  if (!logs?.length) {
    return <p className="text-xs text-cx-fg-dim">No logs yet.</p>
  }

  return (
    <div className="font-mono text-xs overflow-y-auto space-y-1" style={{ maxHeight }}>
      {logs.map((log, i) => (
        <motion.div
          key={`${log.time}-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2 py-0.5 border-b border-cx-line/40"
        >
          <span className="text-cx-fg-dim shrink-0">{new Date(log.time).toLocaleTimeString()}</span>
          <span className={`shrink-0 uppercase w-10 ${
            log.level === 'warn' ? 'text-cx-warn' : log.level === 'error' ? 'text-cx-danger' : 'text-cx-success'
          }`}>{log.level}</span>
          <span className="text-cx-fg-muted">{log.message}</span>
        </motion.div>
      ))}
    </div>
  )
}
