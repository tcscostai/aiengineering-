import { FINOPS_BUDGET, MODEL_CATALOG, OPTIMIZATION_SIGNALS } from '../data/finOps'
import { CATEGORIES } from '../lib/constants'
import { computeAgentCostAlerts, summarizeAgentAlerts } from './finOpsAlertService'

function hashId(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

function formatUsd(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

function formatTokens(n) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function daysInCurrentMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

function dayOfMonth() {
  return new Date().getDate()
}

function getAgentModel(agent) {
  return MODEL_CATALOG[agent.runtimeType] ?? MODEL_CATALOG.python
}

export function computeAgentUsage(agent) {
  const h = hashId(agent.id)
  const stageMultiplier =
    agent.stage === 'published' ? 1.0 : agent.stage === 'certified' ? 0.55 : agent.stage === 'evaluated' ? 0.25 : 0.08
  const skillFactor = 1 + (agent.skills?.length ?? 0) * 0.12
  const knowledgeFactor = 1 + (agent.knowledgeSources?.length ?? 0) * 0.09
  const reuseFactor = 1 + (agent.reuseCount ?? 0) * 0.04

  const dailyInvocations = Math.round((180 + (h % 420)) * stageMultiplier * reuseFactor)
  const avgInputTokens = Math.round((1200 + (h % 2800)) * skillFactor)
  const avgOutputTokens = Math.round((380 + (h % 920)) * knowledgeFactor)
  const cacheHitRate = 0.08 + ((h % 37) / 100)
  const embeddingTokensPerDay = Math.round((h % 90) * 12_000 * stageMultiplier)

  const model = getAgentModel(agent)
  const mtdDays = dayOfMonth()
  const invocations = dailyInvocations * mtdDays

  const evalCostScore = typeof agent.evaluation?.Cost === 'number' ? agent.evaluation.Cost : 85

  const grossInput = invocations * avgInputTokens
  const cachedTokens = model.flatPerInvocation ? 0 : Math.round(grossInput * cacheHitRate)
  const inputTokens = model.flatPerInvocation ? grossInput : grossInput - cachedTokens
  const outputTokens = invocations * avgOutputTokens
  const embeddingTokens = model.flatPerInvocation ? 0 : embeddingTokensPerDay * mtdDays

  let costUsd = 0
  if (model.flatPerInvocation) {
    costUsd = invocations * model.flatPerInvocation
  } else {
    costUsd =
      (inputTokens / 1_000_000) * model.inputPer1M +
      (outputTokens / 1_000_000) * model.outputPer1M +
      (cachedTokens / 1_000_000) * (model.cacheReadPer1M ?? 0) +
      (embeddingTokens / 1_000_000) * 0.13
  }

  const totalTokens = inputTokens + outputTokens + cachedTokens + embeddingTokens

  return {
    agentId: agent.id,
    agentName: agent.name,
    category: agent.category,
    runtimeType: agent.runtimeType,
    model: model.model,
    provider: model.provider,
    invocations,
    inputTokens,
    outputTokens,
    cachedTokens,
    embeddingTokens,
    totalTokens,
    costUsd,
    cacheHitRate: Math.round(cacheHitRate * 100),
    costPer1KTokens: totalTokens ? (costUsd / totalTokens) * 1000 : 0,
    efficiencyScore: evalCostScore,
  }
}

function fixCostPer1K(usage) {
  const total = usage.inputTokens + usage.outputTokens + usage.cachedTokens + usage.embeddingTokens
  usage.totalTokens = total
  usage.costPer1KTokens = total ? (usage.costUsd / total) * 1000 : 0
  return usage
}

function buildDailyTrend(totalMtdCost, totalMtdTokens) {
  const days = dayOfMonth()
  const dim = daysInCurrentMonth()
  const weights = Array.from({ length: days }, (_, i) => {
    const weekday = new Date(new Date().getFullYear(), new Date().getMonth(), i + 1).getDay()
    return weekday === 0 || weekday === 6 ? 0.62 : 1.0
  })
  const weightSum = weights.reduce((a, b) => a + b, 0)

  return weights.map((w, i) => {
    const day = i + 1
    const cost = (totalMtdCost * w) / weightSum
    const tokens = Math.round((totalMtdTokens * w) / weightSum)
    const input = Math.round(tokens * 0.58)
    const output = Math.round(tokens * 0.28)
    const cached = Math.round(tokens * 0.09)
    const embedding = tokens - input - output - cached
    return {
      day: `${day}`,
      label: `Jun ${day}`,
      cost: Math.round(cost * 100) / 100,
      tokens,
      input,
      output,
      cached,
      embedding,
    }
  })
}

export function computeFinOpsDashboard(agents = []) {
  const activeAgents = agents.filter((a) => a.stage && a.stage !== 'draft')
  const agentUsages = activeAgents.map((a) => fixCostPer1K(computeAgentUsage(a)))

  const totals = agentUsages.reduce(
    (acc, u) => {
      acc.costUsd += u.costUsd
      acc.inputTokens += u.inputTokens
      acc.outputTokens += u.outputTokens
      acc.cachedTokens += u.cachedTokens
      acc.embeddingTokens += u.embeddingTokens
      acc.invocations += u.invocations
      return acc
    },
    { costUsd: 0, inputTokens: 0, outputTokens: 0, cachedTokens: 0, embeddingTokens: 0, invocations: 0 }
  )

  totals.totalTokens =
    totals.inputTokens + totals.outputTokens + totals.cachedTokens + totals.embeddingTokens

  // Platform baseline when no agents onboarded (demo telemetry)
  if (activeAgents.length === 0) {
    totals.costUsd = 42850
    totals.inputTokens = 38_400_000
    totals.outputTokens = 14_200_000
    totals.cachedTokens = 6_100_000
    totals.embeddingTokens = 4_800_000
    totals.totalTokens = totals.inputTokens + totals.outputTokens + totals.cachedTokens + totals.embeddingTokens
    totals.invocations = 184_200
  }

  const budget = FINOPS_BUDGET.monthlyCapUsd
  const budgetUsedPct = Math.min(100, Math.round((totals.costUsd / budget) * 100))
  const forecastUsd = Math.round((totals.costUsd / dayOfMonth()) * daysInCurrentMonth())
  const cacheSavingsUsd = agentUsages.reduce((s, u) => {
    const model = MODEL_CATALOG[u.runtimeType] ?? MODEL_CATALOG.python
    if (!model.inputPer1M || !u.cachedTokens) return s
    return s + (u.cachedTokens / 1_000_000) * (model.inputPer1M - (model.cacheReadPer1M ?? 0))
  }, activeAgents.length ? 0 : 4820)

  const avgCostPer1M = totals.totalTokens ? (totals.costUsd / totals.totalTokens) * 1_000_000 : 0
  const efficiencyIndex =
    activeAgents.length > 0
      ? Math.round(
          agentUsages.reduce((s, u) => s + u.efficiencyScore, 0) / agentUsages.length
        )
      : 84

  const byCategory = Object.keys(CATEGORIES).map((catId) => {
    const items = agentUsages.filter((u) => u.category === catId)
    const costUsd = items.reduce((s, u) => s + u.costUsd, 0)
    const tokens = items.reduce((s, u) => s + u.totalTokens, 0)
    return {
      id: catId,
      label: CATEGORIES[catId].short,
      color: CATEGORIES[catId].color,
      costUsd,
      tokens,
      agents: items.length,
    }
  })

  if (activeAgents.length === 0) {
    byCategory[0].costUsd = 18200
    byCategory[0].tokens = 28_400_000
    byCategory[0].agents = 3
    byCategory[1].costUsd = 16450
    byCategory[1].tokens = 22_100_000
    byCategory[1].agents = 3
    byCategory[2].costUsd = 8200
    byCategory[2].tokens = 13_000_000
    byCategory[2].agents = 2
  }

  const byModel = Object.entries(MODEL_CATALOG)
    .map(([runtimeType, model]) => {
      const items = agentUsages.filter((u) => u.runtimeType === runtimeType)
      const costUsd = items.reduce((s, u) => s + u.costUsd, 0)
      const tokens = items.reduce((s, u) => s + u.totalTokens, 0)
      return {
        runtimeType,
        model: model.model,
        provider: model.provider,
        costUsd,
        tokens,
        sharePct: totals.costUsd ? Math.round((costUsd / totals.costUsd) * 100) : 0,
      }
    })
    .filter((m) => m.costUsd > 0 || activeAgents.length === 0)
    .sort((a, b) => b.costUsd - a.costUsd)

  if (activeAgents.length === 0) {
    byModel.length = 0
    byModel.push(
      { runtimeType: 'bedrock', model: 'Claude 3.5 Sonnet', provider: 'AWS Bedrock', costUsd: 16800, tokens: 31_200_000, sharePct: 39 },
      { runtimeType: 'azure_foundry', model: 'GPT-4o', provider: 'Azure OpenAI', costUsd: 14200, tokens: 24_800_000, sharePct: 33 },
      { runtimeType: 'python', model: 'GPT-4o-mini', provider: 'OpenAI router', costUsd: 6200, tokens: 18_400_000, sharePct: 14 },
      { runtimeType: 'api_endpoint', model: 'Now Assist GenAI', provider: 'ServiceNow', costUsd: 3850, tokens: 4_200_000, sharePct: 9 },
      { runtimeType: 'container', model: 'Llama 3.1 70B', provider: 'Self-hosted EKS', costUsd: 1800, tokens: 4_100_000, sharePct: 5 }
    )
  }

  const topAgents = [...agentUsages].sort((a, b) => b.costUsd - a.costUsd).slice(0, 8)

  const tokenMix = [
    { id: 'input', label: 'Input tokens', value: totals.inputTokens, color: '#5ec8f2' },
    { id: 'output', label: 'Output tokens', value: totals.outputTokens, color: '#9b8bd4' },
    { id: 'cached', label: 'Cache reads', value: totals.cachedTokens, color: '#3ecf9b' },
    { id: 'embedding', label: 'Embeddings', value: totals.embeddingTokens, color: '#e8b84a' },
  ]

  const dailyTrend = buildDailyTrend(totals.costUsd, totals.totalTokens)

  const alerts = []
  if (budgetUsedPct >= FINOPS_BUDGET.alertThresholdPct) {
    alerts.push({
      id: 'budget',
      level: 'warn',
      message: `MTD spend at ${budgetUsedPct}% of $${(budget / 1000).toFixed(0)}K monthly cap`,
    })
  }
  if (forecastUsd > budget) {
    alerts.push({
      id: 'forecast',
      level: 'critical',
      message: `Projected month-end ${formatUsd(forecastUsd)} exceeds budget by ${formatUsd(forecastUsd - budget)}`,
    })
  }
  if (totals.cachedTokens / totals.totalTokens < 0.12) {
    alerts.push({
      id: 'cache',
      level: 'info',
      message: 'Cache hit rate below 12% — review prompt caching on high-volume agents',
    })
  }

  const agentCostAlerts = computeAgentCostAlerts(agents, agentUsages)
  const agentAlertSummary = summarizeAgentAlerts(agentCostAlerts)

  if (agentAlertSummary.agentsWithIssues > 0) {
    alerts.push({
      id: 'agent-cost',
      level: 'warn',
      message: `${agentAlertSummary.agentsWithIssues} agent(s) driving ${formatUsd(agentAlertSummary.totalExtraCostUsd)} avoidable extra cost — review Cost Alerts`,
    })
  }

  return {
    budget,
    budgetUsedPct,
    mtdSpendUsd: totals.costUsd,
    forecastUsd,
    totalTokens: totals.totalTokens,
    invocations: totals.invocations,
    cacheSavingsUsd,
    avgCostPer1M,
    efficiencyIndex,
    tokenMix,
    byCategory,
    byModel,
    topAgents,
    dailyTrend,
    alerts,
    agentCostAlerts,
    agentAlertSummary,
    optimizations: OPTIMIZATION_SIGNALS,
    agentUsages,
    formatUsd,
    formatTokens,
    fiscalPeriod: FINOPS_BUDGET.fiscalPeriod,
    costCenter: FINOPS_BUDGET.costCenter,
    lastSync: '4 min ago',
  }
}
