import { useState } from 'react'
import { motion } from 'framer-motion'
import { Rocket, ArrowRight, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { PageHeader } from '../components/ui/PageHeader'
import { GlassPanel } from '../components/ui/GlassPanel'
import { ProgressBar } from '../components/ui/ProgressBar'

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-cx-border bg-cx-panel/50 text-sm text-cx-fg placeholder:text-cx-fg-dim focus:outline-none focus:border-cx-accent/40'

export default function NewInitiative() {
  const { initiatives, createInitiative, deleteInitiative, addNotification } = useApp()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    domain: '',
    businessObjective: '',
    stakeholders: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      addNotification('Title and description are required', 'warn')
      return
    }
    const created = createInitiative(form)
    addNotification(`Initiative "${created.title}" created`, 'success')
    setForm({ title: '', description: '', domain: '', businessObjective: '', stakeholders: '' })
    setShowForm(false)
    navigate('/onboarding')
  }

  return (
    <div>
      <PageHeader
        eyebrow="Engineering Initiatives"
        title="New Engineering Initiative"
        description="Register business initiatives that require AI agent engineering across AD, AMS, and QE — then onboard agents in the studio."
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm hover:bg-cx-accent/20"
          >
            <Plus className="w-4 h-4" /> New Initiative
          </button>
        }
      />

      {showForm && (
        <GlassPanel hero className="p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1.5 block">Title *</label>
                <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Prior Authorization Automation" required />
              </div>
              <div>
                <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1.5 block">Domain</label>
                <input className={inputClass} value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="e.g. Healthcare" />
              </div>
            </div>
            <div>
              <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1.5 block">Description *</label>
              <textarea className={`${inputClass} min-h-[80px]`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div>
              <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1.5 block">Business Objective</label>
              <textarea className={`${inputClass} min-h-[60px]`} value={form.businessObjective} onChange={(e) => setForm({ ...form, businessObjective: e.target.value })} />
            </div>
            <div>
              <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1.5 block">Stakeholders</label>
              <input className={inputClass} value={form.stakeholders} onChange={(e) => setForm({ ...form, stakeholders: e.target.value })} placeholder="CIO, VP Engineering, ..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm hover:bg-cx-accent/20">
                <Rocket className="w-4 h-4" /> Create & Onboard Agents
                <ArrowRight className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-cx-border text-sm text-cx-fg-dim">
                Cancel
              </button>
            </div>
          </form>
        </GlassPanel>
      )}

      <GlassPanel className="p-6">
        <p className="text-2xs uppercase text-cx-accent2 tracking-widest mb-4">Initiatives Pipeline</p>
        {initiatives.length === 0 ? (
          <p className="text-sm text-cx-fg-dim text-center py-8">
            No initiatives yet. Create one to begin engineering AI agents for your business objective.
          </p>
        ) : (
          <div className="space-y-4">
            {initiatives.map((init, i) => (
              <motion.div
                key={init.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl border border-cx-border bg-cx-raised/30 group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-medium text-cx-fg">{init.title}</h3>
                    <p className="text-xs text-cx-fg-dim">{init.domain}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xs uppercase px-2 py-0.5 rounded-md ${
                      init.status === 'active' ? 'bg-cx-success/10 text-cx-success' :
                      init.status === 'completed' ? 'bg-cx-accent/10 text-cx-accent' :
                      'bg-cx-warn/10 text-cx-warn'
                    }`}>{init.status}</span>
                    <button
                      onClick={() => {
                        if (confirm('Delete this initiative?')) {
                          deleteInitiative(init.id)
                          addNotification('Initiative deleted', 'info')
                        }
                      }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 text-cx-fg-dim hover:text-cx-danger"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-cx-fg-dim mb-3">{init.description}</p>
                <ProgressBar value={init.progress} label="Progress" />
                <p className="text-[10px] text-cx-fg-dim mt-2">
                  {init.linkedAgentIds?.length ?? 0} agents linked
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  )
}
