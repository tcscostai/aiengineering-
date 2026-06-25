import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function MetricCard({ label, value, suffix = '', trend, icon: Icon, delay = 0 }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-cx-success' : trend < 0 ? 'text-cx-danger' : 'text-cx-fg-dim'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="glass-panel p-4 group hover:border-cx-border-strong transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xs uppercase text-cx-fg-dim tracking-widest">{label}</span>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-cx-accent/10 border border-cx-accent/20">
            <Icon className="w-4 h-4 text-cx-accent" strokeWidth={1.75} />
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <motion.span
          className="font-display text-2xl font-semibold text-cx-fg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
        >
          {value}
        </motion.span>
        {suffix && <span className="text-sm text-cx-fg-dim mb-0.5">{suffix}</span>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{Math.abs(trend)}% vs last cycle</span>
        </div>
      )}
    </motion.div>
  )
}
