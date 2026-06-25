import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const icons = {
  success: CheckCircle,
  info: Info,
  warn: AlertTriangle,
}

const colors = {
  success: 'border-cx-success/40 text-cx-success',
  info: 'border-cx-accent/40 text-cx-accent',
  warn: 'border-cx-warn/40 text-cx-warn',
}

export function ToastContainer() {
  const { notifications } = useApp()

  return (
    <div className="fixed bottom-12 right-6 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {notifications.map((n) => {
          const Icon = icons[n.type] || Info
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              className={`glass-panel px-4 py-3 flex items-center gap-3 min-w-[280px] border ${colors[n.type] || colors.info}`}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span className="text-sm text-cx-fg">{n.message}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
