import { motion } from 'framer-motion'
import { PageHeader } from '../components/ui/PageHeader'
import { GlassPanel } from '../components/ui/GlassPanel'
import learningData from '../data/learning.json'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function ContinuousLearning() {
  return (
    <div>
      <PageHeader
        eyebrow="Module 14"
        title="Continuous Learning"
        description="Observe, measure, evaluate, improve, publish, reuse, and scale — the ecosystem becomes smarter."
      />

      <GlassPanel hero className="p-8 mb-6 overflow-hidden relative">
        <div className="absolute inset-0 mesh-bg opacity-40" />
        <div className="relative flex flex-wrap justify-center items-center gap-4 md:gap-2">
          {learningData.loop.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2 md:gap-4">
              <motion.div
                animate={{
                  boxShadow: ['0 0 15px rgba(94,200,242,0.2)', '0 0 30px rgba(94,200,242,0.4)', '0 0 15px rgba(94,200,242,0.2)'],
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border border-cx-accent/40 bg-cx-accent/10 flex flex-col items-center justify-center text-center p-2"
              >
                <span className="text-2xs uppercase text-cx-accent tracking-widest mb-1">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-xs font-medium text-cx-fg">{step.label}</span>
              </motion.div>
              {i < learningData.loop.length - 1 && (
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  className="text-cx-accent text-xl hidden md:block"
                >
                  →
                </motion.span>
              )}
            </div>
          ))}
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(94,200,242,0.3), transparent, rgba(155,139,212,0.3), transparent)',
          }}
        />
      </GlassPanel>

      <GlassPanel className="p-6">
        <p className="text-2xs uppercase text-cx-accent tracking-widest mb-4">Ecosystem Intelligence Growth</p>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={learningData.improvements}>
              <XAxis dataKey="cycle" stroke="#8b9cb0" fontSize={11} tickFormatter={(v) => `Cycle ${v}`} />
              <YAxis stroke="#8b9cb0" fontSize={11} />
              <Tooltip contentStyle={{ background: '#10141d', border: '1px solid rgba(148,163,184,0.11)', borderRadius: '12px' }} />
              <Line type="monotone" dataKey="reuseRatio" stroke="#5ec8f2" strokeWidth={2} dot={{ fill: '#5ec8f2' }} name="Reuse %" />
              <Line type="monotone" dataKey="agents" stroke="#9b8bd4" strokeWidth={2} dot={{ fill: '#9b8bd4' }} name="Agents" />
              <Line type="monotone" dataKey="knowledge" stroke="#3ecf9b" strokeWidth={2} dot={{ fill: '#3ecf9b' }} name="Knowledge" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassPanel>
    </div>
  )
}
