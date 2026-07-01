import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Rocket, ArrowRight, ArrowLeft, Plus, Trash2, CheckCircle, Layers } from 'lucide-react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { PageHeader } from '../components/ui/PageHeader'
import { GlassPanel } from '../components/ui/GlassPanel'
import { ProgressBar } from '../components/ui/ProgressBar'
import { WorkspaceDomainCard } from '../components/workspace/WorkspaceDomainCard'
import { WorkspaceDomainPlanEditor } from '../components/workspace/WorkspaceDomainPlanEditor'
import {
  WORKSPACE_INDUSTRIES,
  WORKSPACE_DOMAIN_TEMPLATES,
  buildEmptyDomainPlans,
  buildDefaultDomainPlan,
} from '../data/workspaceDomains'
import { CATEGORIES } from '../lib/constants'
import { PLATFORM_TOOLS } from '../data/platformTools'
import { setActiveWorkspace } from '../services/initiativeService'

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-cx-border bg-cx-panel/50 text-sm text-cx-fg placeholder:text-cx-fg-dim focus:outline-none focus:border-cx-accent/40'

const STEPS = [
  { id: 'basics', label: 'Workspace' },
  { id: 'domains', label: 'Domains' },
  { id: 'plans', label: 'Domain plans' },
  { id: 'review', label: 'Review' },
]

function emptyForm() {
  return {
    title: '',
    description: '',
    industry: 'Healthcare',
    businessObjective: '',
    stakeholders: '',
    domainPlans: buildEmptyDomainPlans(),
  }
}

export default function NewWorkspaceProject() {
  const { initiatives, createInitiative, deleteInitiative, addNotification, agents, startEnterpriseFlow } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (location.state?.openForm) {
      setShowForm(true)
    }
    if (location.state?.prefill) {
      const prefill = location.state.prefill
      setForm((f) => ({
        ...f,
        title: prefill.title ?? f.title,
        description: prefill.description ?? f.description,
        industry: prefill.domain ?? prefill.industry ?? f.industry,
        businessObjective: prefill.businessObjective ?? f.businessObjective,
        stakeholders: prefill.stakeholders ?? f.stakeholders,
      }))
    }
    if (location.state?.category && location.state?.openForm) {
      setShowForm(true)
      setStep(1)
      setForm((f) => {
        const domainPlans = { ...f.domainPlans }
        const id = location.state.category
        if (domainPlans[id]) {
          domainPlans[id] = { ...buildDefaultDomainPlan(id), enabled: true }
        }
        return { ...f, domainPlans }
      })
    }
  }, [location.key, location.state])

  const enabledDomains = Object.entries(form.domainPlans)
    .filter(([, plan]) => plan.enabled)
    .map(([id]) => id)

  const toggleDomain = (domainId) => {
    setForm((f) => {
      const plan = f.domainPlans[domainId]
      const next = { ...plan, enabled: !plan.enabled }
      if (next.enabled && !plan.objective) {
        Object.assign(next, buildDefaultDomainPlan(domainId), { enabled: true })
      }
      return {
        ...f,
        domainPlans: { ...f.domainPlans, [domainId]: next },
      }
    })
  }

  const updateDomainPlan = (domainId, plan) => {
    setForm((f) => ({
      ...f,
      domainPlans: { ...f.domainPlans, [domainId]: plan },
    }))
  }

  const canNext = () => {
    if (step === 0) return form.title.trim() && form.description.trim()
    if (step === 1) return enabledDomains.length > 0
    if (step === 2) return enabledDomains.every((id) => form.domainPlans[id].objective?.trim())
    return true
  }

  const handleCreate = (goToOnboarding = true) => {
    if (!form.title.trim() || !form.description.trim() || !enabledDomains.length) {
      addNotification('Complete workspace name, description, and at least one domain', 'warn')
      return
    }
    const created = createInitiative({
      ...form,
      domains: enabledDomains,
      domainPlans: Object.fromEntries(
        Object.entries(form.domainPlans).map(([id, plan]) => [
          id,
          { ...plan, status: plan.enabled ? 'active' : 'planned' },
        ])
      ),
    })
    setActiveWorkspace(created.id)
    startEnterpriseFlow(created.id)
    addNotification(`Workspace "${created.title}" created with ${enabledDomains.length} domain(s)`, 'success')
    setForm(emptyForm())
    setShowForm(false)
    setStep(0)
    if (goToOnboarding) {
      navigate('/onboarding', {
        state: {
          project: created.title,
          category: enabledDomains[0],
          workspaceId: created.id,
        },
      })
    }
  }

  const resetForm = () => {
    setForm(emptyForm())
    setStep(0)
    setShowForm(false)
  }

  const agentsForWorkspace = (ws) =>
    agents.filter(
      (a) => a.project === ws.title || ws.linkedAgentIds?.includes(a.id)
    )

  return (
    <div>
      <PageHeader
        eyebrow="Workspace & Projects"
        title="New Workspace / Project"
        description="Create an engineering workspace spanning AD, AMS, and QE — configure platform planes per domain, then onboard agents."
        actions={
          <button
            onClick={() => {
              setShowForm(true)
              setStep(0)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm hover:bg-cx-accent/20"
          >
            <Plus className="w-4 h-4" /> New Workspace
          </button>
        }
      />

      {showForm && (
        <GlassPanel hero className="p-6 mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <span
                  className={`text-[10px] uppercase px-2 py-1 rounded-lg border ${
                    i === step
                      ? 'border-cx-accent/50 bg-cx-accent/10 text-cx-accent'
                      : i < step
                        ? 'border-cx-success/30 text-cx-success'
                        : 'border-cx-border text-cx-fg-dim'
                  }`}
                >
                  {i < step ? '✓ ' : ''}{s.label}
                </span>
                {i < STEPS.length - 1 && <span className="text-cx-fg-dim text-xs">→</span>}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1.5 block">Workspace / Project name *</label>
                  <input
                    className={inputClass}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Prior Authorization Automation"
                  />
                </div>
                <div>
                  <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1.5 block">Industry</label>
                  <select
                    className={inputClass}
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  >
                    {WORKSPACE_INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1.5 block">Description *</label>
                <textarea
                  className={`${inputClass} min-h-[80px]`}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What business outcome does this workspace deliver?"
                />
              </div>
              <div>
                <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1.5 block">Business objective</label>
                <textarea
                  className={`${inputClass} min-h-[60px]`}
                  value={form.businessObjective}
                  onChange={(e) => setForm({ ...form, businessObjective: e.target.value })}
                />
              </div>
              <div>
                <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1.5 block">Stakeholders</label>
                <input
                  className={inputClass}
                  value={form.stakeholders}
                  onChange={(e) => setForm({ ...form, stakeholders: e.target.value })}
                  placeholder="CIO, VP Engineering, Director of Operations…"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-cx-fg-dim">
                Select which engineering domains this workspace spans. Each domain gets its own platform plane and agent onboarding track.
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                {Object.keys(WORKSPACE_DOMAIN_TEMPLATES).map((domainId) => (
                  <WorkspaceDomainCard
                    key={domainId}
                    domainId={domainId}
                    enabled={form.domainPlans[domainId].enabled}
                    onToggle={toggleDomain}
                  />
                ))}
              </div>
              {enabledDomains.length === 0 && (
                <p className="text-xs text-cx-warn">Select at least one domain to continue.</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-cx-fg-dim">
                Configure objectives, platform planes, and deliverables for each selected domain.
              </p>
              {enabledDomains.map((domainId) => (
                <WorkspaceDomainPlanEditor
                  key={domainId}
                  domainId={domainId}
                  plan={form.domainPlans[domainId]}
                  onChange={updateDomainPlan}
                />
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-cx-border bg-cx-raised/30">
                <h3 className="font-display text-lg text-cx-fg mb-1">{form.title}</h3>
                <p className="text-xs text-cx-fg-dim mb-2">{form.industry}</p>
                <p className="text-sm text-cx-fg-dim">{form.description}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {enabledDomains.map((domainId) => {
                  const plan = form.domainPlans[domainId]
                  const template = WORKSPACE_DOMAIN_TEMPLATES[domainId]
                  const platform = PLATFORM_TOOLS[plan.platformTool]
                  return (
                    <div key={domainId} className="p-3 rounded-xl border border-cx-border bg-cx-raised/20">
                      <p className="text-xs font-medium text-cx-fg mb-1">{template.label}</p>
                      <p className="text-[10px] mb-2" style={{ color: platform.color }}>
                        {platform.fullName}
                      </p>
                      <p className="text-[10px] text-cx-fg-dim line-clamp-3">{plan.objective}</p>
                      <p className="text-[10px] text-cx-fg-dim mt-2">
                        {plan.deliverables.filter((d) => d.selected).length} deliverables · {plan.suggestedAgents.length} agents
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-cx-border">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-border text-sm text-cx-fg-dim"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                disabled={!canNext()}
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm hover:bg-cx-accent/20 disabled:opacity-50"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleCreate(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm hover:bg-cx-accent/20"
                >
                  <Rocket className="w-4 h-4" /> Create & Onboard Agents
                </button>
                <button
                  type="button"
                  onClick={() => handleCreate(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-border text-sm text-cx-fg-muted"
                >
                  Create workspace only
                </button>
              </>
            )}
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl border border-cx-border text-sm text-cx-fg-dim ml-auto">
              Cancel
            </button>
          </div>
        </GlassPanel>
      )}

      <GlassPanel className="p-6">
        <p className="text-2xs uppercase text-cx-accent2 tracking-widest mb-4">Workspaces Pipeline</p>
        {initiatives.length === 0 ? (
          <p className="text-sm text-cx-fg-dim text-center py-8">
            No workspaces yet. Create a project spanning AD, AMS, and/or QE to begin agent engineering.
          </p>
        ) : (
          <div className="space-y-4">
            {initiatives.map((ws, i) => {
              const linked = agentsForWorkspace(ws)
              const domainList = ws.domains ?? []
              return (
                <motion.div
                  key={ws.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl border border-cx-border bg-cx-raised/30 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-medium text-cx-fg">{ws.title}</h3>
                      <p className="text-xs text-cx-fg-dim">{ws.industry ?? ws.domain}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xs uppercase px-2 py-0.5 rounded-md ${
                        ws.status === 'active' ? 'bg-cx-success/10 text-cx-success' :
                        ws.status === 'completed' ? 'bg-cx-accent/10 text-cx-accent' :
                        'bg-cx-warn/10 text-cx-warn'
                      }`}>{ws.status}</span>
                      <button
                        onClick={() => {
                          setActiveWorkspace(ws.id)
                          addNotification(`Active workspace: ${ws.title}`, 'info')
                        }}
                        className="text-[10px] text-cx-accent hover:underline opacity-0 group-hover:opacity-100"
                      >
                        Set active
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this workspace?')) {
                            deleteInitiative(ws.id)
                            addNotification('Workspace deleted', 'info')
                          }
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 text-cx-fg-dim hover:text-cx-danger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {domainList.map((domainId) => {
                      const cat = CATEGORIES[domainId]
                      const platform = ws.domainPlans?.[domainId]?.platformTool
                      return (
                        <span
                          key={domainId}
                          className="text-[10px] uppercase px-1.5 py-0.5 rounded font-mono"
                          style={{ backgroundColor: `${cat?.color ?? '#5ec8f2'}20`, color: cat?.color }}
                          title={platform ? PLATFORM_TOOLS[platform]?.fullName : undefined}
                        >
                          {cat?.short}
                          {platform ? ` · ${PLATFORM_TOOLS[platform]?.name}` : ''}
                        </span>
                      )
                    })}
                  </div>

                  <p className="text-xs text-cx-fg-dim mb-3 line-clamp-2">{ws.description}</p>
                  <ProgressBar value={ws.progress} label="Progress" />
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-cx-fg-dim">
                    <span>{linked.length} agents linked</span>
                    {domainList.map((domainId) => (
                      <Link
                        key={domainId}
                        to={WORKSPACE_DOMAIN_TEMPLATES[domainId]?.engineeringPath ?? `/${domainId}`}
                        className="text-cx-accent hover:underline"
                      >
                        Open {CATEGORIES[domainId]?.short} →
                      </Link>
                    ))}
                    <Link
                      to="/onboarding"
                      state={{ project: ws.title, category: domainList[0], workspaceId: ws.id }}
                      className="text-cx-accent hover:underline flex items-center gap-1"
                    >
                      <Layers className="w-3 h-3" /> Onboard agents
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </GlassPanel>
    </div>
  )
}
