import { motion } from 'framer-motion'

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {eyebrow && (
        <p className="text-2xs uppercase text-cx-accent tracking-widest mb-2">{eyebrow}</p>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cx-fg tracking-tight">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-cx-fg-dim max-w-2xl leading-relaxed">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </motion.div>
  )
}
