import { motion } from 'framer-motion'

export function ProgressBar({ value, label, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between mb-1.5">
          <span className="text-2xs uppercase text-cx-fg-dim tracking-widest">{label}</span>
          <span className="text-xs font-mono text-cx-accent">{value}%</span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-cx-border overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cx-accent to-cx-accent2"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}
