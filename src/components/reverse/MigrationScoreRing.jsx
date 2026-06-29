import { motion } from 'framer-motion'

export function MigrationScoreRing({ score = 0, readiness = 'moderate', size = 140 }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? '#3ecf9b' : score >= 45 ? '#e8b84a' : '#f08984'

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="10" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 12px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-display font-semibold text-cx-fg">{score}</span>
        <span className="text-2xs uppercase tracking-widest text-cx-fg-dim">readiness</span>
      </div>
      <span className="mt-2 text-xs capitalize text-cx-fg-muted">{readiness}</span>
    </div>
  )
}
