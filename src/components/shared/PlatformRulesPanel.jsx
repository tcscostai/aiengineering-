import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  ChevronDown,
  Plus,
  RotateCcw,
  Trash2,
  Save,
  Upload,
  Download,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-cx-border bg-cx-void/50 text-sm text-cx-fg focus:outline-none focus:border-cx-accent/40'

const selectClass =
  'px-2 py-1 rounded-lg border border-cx-border bg-cx-void/50 text-xs text-cx-fg focus:outline-none focus:border-cx-accent/40'

function ParamControl({ paramKey, value, onChange }) {
  if (typeof value === 'boolean') {
    return (
      <button
        type="button"
        onClick={() => onChange(paramKey, !value)}
        className={`flex items-center gap-2 text-xs ${value ? 'text-cx-success' : 'text-cx-fg-dim'}`}
      >
        {value ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
        {value ? 'On' : 'Off'}
      </button>
    )
  }
  if (typeof value === 'number') {
    const max = paramKey.includes('threshold') || paramKey.includes('Score') || paramKey.includes('min') ? 100 : 32000
    return (
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(paramKey, Number(e.target.value))}
          className="flex-1 accent-cx-accent"
        />
        <span className="font-mono text-xs text-cx-fg w-10 text-right">{value}</span>
      </div>
    )
  }
  if (Array.isArray(value)) {
    return (
      <input
        type="text"
        value={value.join(', ')}
        onChange={(e) => onChange(paramKey, e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
        className={inputClass}
      />
    )
  }
  return (
    <input type="text" value={value ?? ''} onChange={(e) => onChange(paramKey, e.target.value)} className={inputClass} />
  )
}

function formatParamLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
}

export function PlatformRulesPanel({
  title,
  subtitle,
  itemLabel = 'rule',
  config,
  impact,
  rules,
  enforcementModes,
  categories,
  scopeOptions,
  ruleTypes,
  enforcementOptions,
  onToggle,
  onUpdateParam,
  onUpdateRule,
  onSetEnforcementMode,
  onReset,
  onAddCustom,
  onDeleteCustom,
  onExport,
  onImport,
  addNotification,
}) {
  const [expandedId, setExpandedId] = useState(rules[0]?.id ?? null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [customScope, setCustomScope] = useState('all')
  const [customCategory, setCustomCategory] = useState(Object.keys(categories)[0])
  const [customRuleType, setCustomRuleType] = useState(ruleTypes[0]?.id)
  const fileInputRef = useRef(null)

  const handleAdd = () => {
    if (!customName.trim()) return
    onAddCustom({
      name: customName.trim(),
      description: customDesc.trim(),
      category: customCategory,
      scope: customScope,
      ruleType: customRuleType,
    })
    setCustomName('')
    setCustomDesc('')
    setShowAddForm(false)
    addNotification?.(`Custom ${itemLabel} saved`, 'success')
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        onImport(JSON.parse(reader.result))
        addNotification?.(`${itemLabel}s imported`, 'success')
      } catch (err) {
        addNotification?.(err.message || 'Invalid JSON', 'warn')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <GlassPanel hero className="lg:col-span-2 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-2xs uppercase text-cx-accent tracking-widest mb-1">Rules Engine</p>
            <h2 className="font-display text-lg font-semibold text-cx-fg">{title}</h2>
            <p className="text-sm text-cx-fg-dim mt-1 max-w-xl">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cx-border text-xs text-cx-fg-dim hover:text-cx-fg"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cx-border text-xs text-cx-fg-dim hover:text-cx-fg"
            >
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cx-border text-xs text-cx-fg-dim hover:text-cx-fg"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>

        <p className="text-2xs uppercase text-cx-fg-dim mb-3">Global enforcement mode</p>
        <div className="grid sm:grid-cols-3 gap-2 mb-6">
          {enforcementModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSetEnforcementMode(mode.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                config.enforcementMode === mode.id
                  ? 'border-cx-accent/50 bg-cx-accent/10'
                  : 'border-cx-border bg-cx-raised/20 hover:border-cx-border-strong'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Shield className={`w-4 h-4 ${config.enforcementMode === mode.id ? 'text-cx-accent' : 'text-cx-fg-dim'}`} />
                <span className="text-sm font-medium text-cx-fg">{mode.label}</span>
              </div>
              <p className="text-[10px] text-cx-fg-dim leading-relaxed">{mode.description}</p>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-2xs uppercase text-cx-fg-dim">
            {itemLabel}s ({impact.activeCount}/{impact.totalRules ?? impact.totalGuardrails})
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 text-xs text-cx-accent hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Create custom {itemLabel}
          </button>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-4 rounded-xl border border-dashed border-cx-accent/40 bg-cx-accent/5 space-y-3">
                <input type="text" placeholder={`${itemLabel} name`} value={customName} onChange={(e) => setCustomName(e.target.value)} className={inputClass} />
                <input type="text" placeholder="Description (optional)" value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} className={inputClass} />
                <div className="flex flex-wrap gap-2">
                  <select value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className={selectClass}>
                    {Object.entries(categories).map(([id, c]) => (
                      <option key={id} value={id}>{c.label}</option>
                    ))}
                  </select>
                  <select value={customScope} onChange={(e) => setCustomScope(e.target.value)} className={selectClass}>
                    {scopeOptions.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  {ruleTypes?.length > 0 && (
                    <select value={customRuleType} onChange={(e) => setCustomRuleType(e.target.value)} className={selectClass}>
                      {ruleTypes.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  )}
                </div>
                <button type="button" onClick={handleAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cx-accent/40 bg-cx-accent/10 text-xs text-cx-accent">
                  <Save className="w-3.5 h-3.5" /> Save {itemLabel}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {rules.map((rule) => {
            const cat = categories[rule.category]
            const isOpen = expandedId === rule.id
            return (
              <div
                key={rule.id}
                className={`rounded-xl border ${rule.enabled ? 'border-cx-border bg-cx-raised/20' : 'border-cx-border/50 opacity-75'}`}
              >
                <div className="flex items-center gap-3 p-3">
                  <button type="button" onClick={() => onToggle(rule.id, !rule.enabled)} className={rule.enabled ? 'text-cx-success' : 'text-cx-fg-dim'}>
                    {rule.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button type="button" onClick={() => setExpandedId(isOpen ? null : rule.id)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-cx-fg">{rule.name}</p>
                      {rule.custom && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded border border-cx-accent/30 text-cx-accent">custom</span>}
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded" style={{ color: cat?.color, backgroundColor: `${cat?.color}15` }}>{cat?.label}</span>
                      {rule.enforcement && (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cx-raised text-cx-fg-dim">{rule.enforcement}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-cx-fg-dim truncate mt-0.5">{rule.description}</p>
                  </button>
                  <button type="button" onClick={() => setExpandedId(isOpen ? null : rule.id)} className="p-1 text-cx-fg-dim">
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {rule.custom && (
                    <button type="button" onClick={() => onDeleteCustom(rule.id)} className="p-1 text-cx-danger hover:bg-cx-danger/10 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-3 pb-3 pt-0 border-t border-cx-border/50 mx-3">
                        <div className="grid sm:grid-cols-2 gap-3 mt-3 mb-3">
                          <div>
                            <label className="text-[10px] uppercase text-cx-fg-dim mb-1 block">Scope</label>
                            <select value={rule.scope} onChange={(e) => onUpdateRule(rule.id, { scope: e.target.value })} className={selectClass}>
                              {scopeOptions.map((s) => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                          {enforcementOptions && (
                            <div>
                              <label className="text-[10px] uppercase text-cx-fg-dim mb-1 block">{itemLabel} enforcement</label>
                              <select value={rule.enforcement} onChange={(e) => onUpdateRule(rule.id, { enforcement: e.target.value })} className={selectClass}>
                                {enforcementOptions.map((o) => (
                                  <option key={o} value={o}>{o}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        {Object.keys(rule.params ?? {}).length > 0 && (
                          <>
                            <p className="text-[10px] uppercase text-cx-fg-dim mb-2">Parameters</p>
                            <div className="space-y-3">
                              {Object.entries(rule.params).map(([key, val]) => (
                                <div key={key}>
                                  <span className="text-xs text-cx-fg-muted">{formatParamLabel(key)}</span>
                                  <ParamControl paramKey={key} value={val} onChange={(k, v) => onUpdateParam(rule.id, k, v)} />
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </GlassPanel>

      <GlassPanel className="p-5 h-fit">
        <p className="text-sm font-medium text-cx-fg mb-4">{itemLabel}s summary</p>
        <div className="space-y-3 text-xs">
          <div className="flex justify-between">
            <span className="text-cx-fg-dim">Active</span>
            <span className="font-mono text-cx-success">{impact.activeCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cx-fg-dim">Custom</span>
            <span className="font-mono text-cx-fg">{impact.customCount ?? 0}</span>
          </div>
          {impact.blockCount != null && (
            <div className="flex justify-between">
              <span className="text-cx-fg-dim">Block enforcement</span>
              <span className="font-mono text-cx-warn">{impact.blockCount}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-cx-fg-dim">Global mode</span>
            <span className="font-mono text-cx-fg">{impact.enforcementLabel}</span>
          </div>
        </div>
        {config.updatedAt && (
          <p className="text-[10px] text-cx-fg-dim mt-4 pt-3 border-t border-cx-border">
            Last saved {new Date(config.updatedAt).toLocaleString()}
          </p>
        )}
        <ul className="text-[11px] text-cx-fg-dim space-y-2 mt-4 leading-relaxed">
          <li><strong className="text-cx-fg-muted">Export</strong> — download JSON to share across environments.</li>
          <li><strong className="text-cx-fg-muted">Upload</strong> — import rule packs from compliance or FinOps teams.</li>
          <li><strong className="text-cx-fg-muted">Harness</strong> — enforced rules gate pipeline evaluation step.</li>
        </ul>
      </GlassPanel>
    </div>
  )
}
