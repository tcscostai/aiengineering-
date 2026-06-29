import {
  LayoutDashboard,
  UserPlus,
  Cpu,
  Network,
  GitBranch,
  ScanSearch,
  Code2,
  Headphones,
  FlaskConical,
  BarChart3,
  Shield,
  Play,
  DollarSign,
  Store,
  RefreshCw,
  LineChart,
  Rocket,
} from 'lucide-react'

export const navGroups = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
      { path: '/initiative', label: 'New Initiative', shortLabel: 'Initiative', icon: Rocket },
    ],
  },
  {
    id: 'engineering',
    label: 'Engineering',
    items: [
      { path: '/onboarding', label: 'Onboarding Studio', shortLabel: 'Onboarding', icon: UserPlus },
      { path: '/harness', label: 'AI Harness', shortLabel: 'Harness', icon: Cpu },
      { path: '/knowledge', label: 'Knowledge Fabric', shortLabel: 'Knowledge', icon: Network },
      { path: '/workflow', label: 'Workflow Designer', shortLabel: 'Workflows', icon: GitBranch },
      { path: '/reverse-engineering', label: 'Reverse Engineering', shortLabel: 'Reverse Eng', icon: ScanSearch },
    ],
  },
  {
    id: 'domains',
    label: 'Domains',
    items: [
      { path: '/ad', label: 'AD Engineering', shortLabel: 'AD', icon: Code2 },
      { path: '/ams', label: 'AMS Engineering', shortLabel: 'AMS', icon: Headphones },
      { path: '/qe', label: 'QE Engineering', shortLabel: 'QE', icon: FlaskConical },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { path: '/evaluation', label: 'Evaluation', shortLabel: 'Evaluation', icon: BarChart3 },
      { path: '/governance', label: 'Governance', shortLabel: 'Governance', icon: Shield },
      { path: '/finops', label: 'FinOps', shortLabel: 'FinOps', icon: DollarSign },
      { path: '/runtime', label: 'Agent Runtime', shortLabel: 'Runtime', icon: Play },
    ],
  },
  {
    id: 'ecosystem',
    label: 'Ecosystem',
    items: [
      { path: '/marketplace', label: 'Marketplace', shortLabel: 'Marketplace', icon: Store },
      { path: '/learning', label: 'Learning', shortLabel: 'Learning', icon: RefreshCw },
      { path: '/insights', label: 'Insights', shortLabel: 'Insights', icon: LineChart },
    ],
  },
]

export const navItems = navGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label }))
)

export function getNavItemForPath(pathname) {
  if (pathname === '/') return navItems.find((item) => item.path === '/') ?? null
  return navItems.find((item) => item.path !== '/' && pathname.startsWith(item.path)) ?? null
}
