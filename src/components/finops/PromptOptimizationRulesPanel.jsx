import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings2,
  Shield,
  ChevronDown,
  Plus,
  RotateCcw,
  Trash2,
  Save,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'
import { ProgressBar } from '../ui/ProgressBar'
import {
  ENFORCEMENT_MODES,
  RULE_CATEGORIES,
  SCOPE_OPTIONS,
} from '../../data/promptOptimizationRules'

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
    const isPct = paramKey.includes('Threshold') || paramKey.includes('Pct') || paramKey.includes('Confidence')
    const max = isPct && value <= 1 ? 1 : paramKey.includes('Tokens') ? 32000 : paramKey.includes('Hours') ? 72 : 5000
    const step = isPct && max === 1 ? 0.01 : 1
    return (
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(paramKey, Number(e.target.value))}
          className="flex-1 accent-cx-accent"
        />
        <span className="font-mono text-xs text-cx-fg w-14 text-right">
          {isPct && max === 1 ? value.toFixed(2) : value}
        </span>
      </div>
    )
  }

  if (Array.isArray(value)) {
    return <span className="text-xs text-cx-fg-dim font-mono">{value.join(', ') || '—'}</span>
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(paramKey, e.target.value)}
      className={inputClass}
    />
  )
}

function formatParamLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
}

export function PromptOptimizationRulesPanel({ rulesHook, formatUsd }) {
  const {
    config,
    impact,
    toggleRule,
    updateRuleParam,
    updateRule,
    setEnforcementMode,
    resetToDefaults,
    addCustomRule,
    deleteCustomRule,
  } = rulesHook

  const [expandedId, setExpandedId] = useState('semantic_cache')
  const [showAddForm, setShowAddForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customScope, setCustomScope] = useState('all')
  const [customCategory, setCustomCategory] = useState('compression')
  const [customMaxTokens, setCustomMaxTokens] = useState(4096)

  const handleAddCustom = () => {
    if (!customName.trim()) return
    addCustomRule({
      name: customName.trim(),
      category: customCategory,
      scope: customScope,
      maxInputTokens: customMaxTokens,
    })
    setCustomName('')
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-4">
        <GlassPanel hero className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-2xs uppercase text-cx-accent tracking-widest mb-1">Policy Engine</p>
              <h2 className="font-display text-lg font-semibold text-cx-fg">Prompt Optimization Rules</h2>
              <p className="text-sm text-cx-fg-dim mt-1 max-w-xl">
                Control how the platform reduces token spend — caching, compression, routing, and context limits.
                Rules apply at harness invocation and runtime gateway.
              </p>
            </div>
            <button
              type="button"
              onClick={resetToDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cx-border text-xs text-cx-fg-dim hover:text-cx-fg hover:border-cx-border-strong shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset defaults
            </button>
          </div>

          <p className="text-2xs uppercase text-cx-fg-dim mb-3">Global enforcement mode</p>
          <div className="grid sm:grid-cols-3 gap-2 mb-6">
            {ENFORCEMENT_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setEnforcementMode(mode.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  config.enforcementMode === mode.id
                    ? 'border-cx-accent/50 bg-cx-accent/10 shadow-[0_0_20px_rgba(94,200,242,0.08)]'
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
            <p className="text-2xs uppercase text-cx-fg-dim">Active rules ({impact.activeCount}/{impact.totalRules})</p>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 text-xs text-cx-accent hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Custom rule
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
                  <p className="text-xs font-medium text-cx-fg">New custom rule</p>
                  <input
                    type="text"
                    placeholder="Rule name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className={inputClass}
                  />
                  <div className="flex flex-wrap gap-2">
                    <select value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className={selectClass}>
                      {Object.entries(RULE_CATEGORIES).map(([id, c]) => (
                        <option key={id} value={id}>{c.label}</option>
                      ))}
                    </select>
                    <select value={customScope} onChange={(e) => setCustomScope(e.target.value)} className={selectClass}>
                      {SCOPE_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={customMaxTokens}
                      onChange={(e) => setCustomMaxTokens(Number(e.target.value))}
                      className={`${selectClass} w-28`}
                      placeholder="Max tokens"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cx-accent/40 bg-cx-accent/10 text-xs text-cx-accent"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save rule
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            {config.rules.map((rule) => {
              const cat = RULE_CATEGORIES[rule.category]
              const isOpen = expandedId === rule.id

              return (
                <div
                  key={rule.id}
                  className={`rounded-xl border transition-colors ${
                    rule.enabled ? 'border-cx-border bg-cx-raised/20' : 'border-cx-border/50 bg-cx-void/30 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    <button
                      type="button"
                      onClick={() => toggleRule(rule.id, !rule.enabled)}
                      className={`shrink-0 ${rule.enabled ? 'text-cx-success' : 'text-cx-fg-dim'}`}
                      title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                    >
                      {rule.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : rule.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-cx-fg">{rule.name}</p>
                        {rule.custom && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded border border-cx-accent/30 text-cx-accent">
                            custom
                          </span>
                        )}
                        <span
                          className="text-[9px] uppercase px-1.5 py-0.5 rounded"
                          style={{ color: cat?.color, backgroundColor: `${cat?.color}15` }}
                        >
                          {cat?.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-cx-fg-dim truncate mt-0.5">{rule.description}</p>
                    </button>

                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="font-mono text-xs text-cx-success">{formatUsd(rule.estimatedSavingsUsdMonthly)}/mo</p>
                      <p className="text-[9px] text-cx-fg-dim">{SCOPE_OPTIONS.find((s) => s.id === rule.scope)?.label}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : rule.id)}
                      className="p-1 text-cx-fg-dim"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {rule.custom && (
                      <button
                        type="button"
                        onClick={() => deleteCustomRule(rule.id)}
                        className="p-1 text-cx-danger hover:bg-cx-danger/10 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-0 border-t border-cx-border/50 mx-3">
                          <div className="grid sm:grid-cols-2 gap-3 mt-3 mb-3">
                            <div>
                              <label className="text-[10px] uppercase text-cx-fg-dim mb-1 block">Scope</label>
                              <select
                                value={rule.scope}
                                onChange={(e) => updateRule(rule.id, { scope: e.target.value })}
                                className={selectClass}
                              >
                                {SCOPE_OPTIONS.map((s) => (
                                  <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] uppercase text-cx-fg-dim mb-1 block">Rule enforcement</label>
                              <select
                                value={rule.enforcement}
                                onChange={(e) => updateRule(rule.id, { enforcement: e.target.value })}
                                className={selectClass}
                              >
                                <option value="monitor">Monitor</option>
                                <option value="recommend">Recommend</option>
                                <option value="enforce">Enforce</option>
                              </select>
                            </div>
                          </div>

                          <p className="text-[10px] uppercase text-cx-fg-dim mb-2">Parameters</p>
                          <div className="space-y-3">
                            {Object.entries(rule.params ?? {}).map(([key, val]) => (
                              <div key={key}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-cx-fg-muted">{formatParamLabel(key)}</span>
                                </div>
                                <ParamControl
                                  paramKey={key}
                                  value={val}
                                  onChange={(k, v) => updateRuleParam(rule.id, k, v)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </GlassPanel>

        <div className="space-y-4">
          <GlassPanel className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-cx-accent" />
              <p className="text-sm font-medium text-cx-fg">Rules impact</p>
            </div>
            <p className="font-display text-3xl font-semibold text-cx-success mb-1">
              {formatUsd(impact.projectedSavingsUsdMonthly)}
            </p>
            <p className="text-xs text-cx-fg-dim mb-4">projected monthly savings</p>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-cx-fg-dim">Active rules</span>
                <span className="font-mono text-cx-fg">{impact.activeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cx-fg-dim">Est. token reduction</span>
                <span className="font-mono text-cx-accent">{impact.tokenReductionPct}%</span>
              </div>
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
          </GlassPanel>

          <GlassPanel className="p-5">
            <p className="text-2xs uppercase text-cx-fg-dim mb-3">Savings by category</p>
            <div className="space-y-3">
              {Object.entries(impact.byCategory).map(([catId, savings]) => {
                const cat = RULE_CATEGORIES[catId]
                const pct = impact.projectedSavingsUsdMonthly
                  ? Math.round((savings / impact.projectedSavingsUsdMonthly) * 100)
                  : 0
                return (
                  <div key={catId}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: cat?.color }}>{cat?.label}</span>
                      <span className="font-mono text-cx-fg">{formatUsd(savings)}</span>
                    </div>
                    <ProgressBar value={pct} />
                  </div>
                )
              })}
              {Object.keys(impact.byCategory).length === 0 && (
                <p className="text-xs text-cx-fg-dim">Enable rules to see projected savings.</p>
              )}
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-cx-fg-dim" />
              <p className="text-xs font-medium text-cx-fg">How rules are applied</p>
            </div>
            <ul className="text-[11px] text-cx-fg-dim space-y-2 leading-relaxed">
              <li><strong className="text-cx-fg-muted">Harness</strong> — rules run before each pipeline step that assembles prompts.</li>
              <li><strong className="text-cx-fg-muted">Runtime gateway</strong> — enforced rules block or rewrite requests at the API edge.</li>
              <li><strong className="text-cx-fg-muted">FinOps</strong> — token and cost metrics reflect rule-adjusted projections.</li>
            </ul>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
