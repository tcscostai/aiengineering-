import { Link } from 'react-router-dom'
import { UserPlus, Cpu, Network, GitBranch, DollarSign, AlertTriangle } from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'

const ACTIONS = [
  { id: 'onboard', label: 'Onboard Agent', icon: UserPlus, path: '/onboarding', hint: 'Register external agent' },
  { id: 'harness', label: 'Run Harness', icon: Cpu, path: '/harness', hint: 'Execute pipeline' },
  { id: 'knowledge', label: 'Knowledge Fabric', icon: Network, path: '/knowledge', hint: 'Graph + debt' },
  { id: 'workflow', label: 'Workflows', icon: GitBranch, path: '/harness', hint: 'Multi-agent compose' },
  { id: 'finops', label: 'FinOps', icon: DollarSign, path: '/finops', hint: 'Cost + rules' },
]

export function DomainQuickActions({ category, metrics }) {
  return (
    <GlassPanel className="p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="text-2xs uppercase text-cx-fg-dim tracking-widest">Platform actions</p>
        {metrics?.alertCount > 0 && (
          <Link
            to="/finops"
            className="flex items-center gap-1.5 text-[10px] text-cx-danger px-2 py-1 rounded-lg border border-cx-danger/30 bg-cx-danger/10"
          >
            <AlertTriangle className="w-3 h-3" />
            {metrics.alertCount} cost alert{metrics.alertCount > 1 ? 's' : ''}
          </Link>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <Link
            key={action.id}
            to={action.path}
            state={action.id === 'harness' ? { category, tab: 'overview' } : action.id === 'knowledge' ? { category } : action.id === 'workflow' ? { category, tab: 'library' } : undefined}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-cx-border bg-cx-raised/30 hover:border-cx-accent/40 hover:bg-cx-accent/5 transition-colors group"
          >
            <action.icon className="w-4 h-4 text-cx-accent shrink-0" />
            <div>
              <p className="text-xs font-medium text-cx-fg">{action.label}</p>
              <p className="text-[9px] text-cx-fg-dim">{action.hint}</p>
            </div>
          </Link>
        ))}
      </div>
    </GlassPanel>
  )
}
