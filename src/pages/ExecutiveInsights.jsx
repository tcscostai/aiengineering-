import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { GlassPanel } from '../components/ui/GlassPanel'
import insightsData from '../data/insights.json'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

export default function ExecutiveInsights() {
  return (
    <div>
      <PageHeader
        eyebrow="Module 15"
        title="Executive Insights"
        description="Engineering velocity, agent reuse, knowledge growth, automation, quality, and business value."
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {insightsData.kpis.map((kpi, i) => (
          <GlassPanel key={kpi.id} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs uppercase text-cx-fg-dim tracking-widest">{kpi.label}</span>
              <div className="flex items-center gap-1 text-cx-success text-xs">
                <TrendingUp className="w-3 h-3" />
                +{kpi.trend}%
              </div>
            </div>
            <p className="font-display text-2xl font-semibold text-cx-fg mb-3">
              {kpi.value}
              <span className="text-sm text-cx-fg-dim ml-1">{kpi.unit}</span>
            </p>
            <div className="h-[40px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpi.sparkline.map((v, idx) => ({ v, idx }))}>
                  <Area type="monotone" dataKey="v" stroke="#5ec8f2" fill="rgba(94,200,242,0.1)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>
        ))}
      </div>

      <GlassPanel hero className="p-8">
        <p className="text-2xs uppercase text-cx-accent tracking-widest mb-3">Executive Summary</p>
        <p className="text-lg text-cx-fg leading-relaxed max-w-4xl">{insightsData.executiveSummary}</p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 rounded-xl border border-cx-accent/30 bg-cx-accent/5"
        >
          <p className="text-sm text-cx-fg-muted italic text-center">
            "Horizon is building an Enterprise AI Engineering Operating System — not isolated AI agents."
          </p>
        </motion.div>
      </GlassPanel>
    </div>
  )
}
