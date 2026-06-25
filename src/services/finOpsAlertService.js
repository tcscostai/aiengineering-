import { FINOPS_AVOID_GUIDELINES } from '../data/finOpsAlerts'
import { MODEL_CATALOG } from '../data/finOps'

const ISSUE_TYPES = {
  low_cache: 'Low prompt cache utilization',
  model_overspend: 'Over-provisioned model tier',
  context_bloat: 'Context / knowledge bloat',
  embedding_spike: 'High embedding overhead',
  output_waste: 'Unbounded output tokens',
  cost_score_low: 'Poor cost evaluation score',
  benchmark_outlier: 'Cost outlier vs peers',
  retry_risk: 'Retry / re-prompt risk',
}

function mean(values) {
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function makeAlert({
  agent,
  usage,
  issueType,
  severity,
  title,
  problem,
  avoid,
  recommendation,
  extraCostUsd,
  pctAboveBenchmark = 0,
}) {
  return {
    id: `${agent.id}_${issueType}`,
    agentId: agent.id,
    agentName: agent.name,
    category: agent.category,
    issueType,
    issueLabel: ISSUE_TYPES[issueType] ?? issueType,
    severity,
    title,
    problem,
    avoid,
    recommendation,
    extraCostUsd: Math.round(extraCostUsd),
    pctAboveBenchmark: Math.round(pctAboveBenchmark),
    mtdCostUsd: Math.round(usage?.costUsd ?? 0),
    detectedAt: new Date().toISOString(),
  }
}

export function computeAgentCostAlerts(agents = [], agentUsages = []) {
  if (!agentUsages.length) {
    return getDemoAgentAlerts()
  }

  const activeAgents = agents.filter((a) => a.stage && a.stage !== 'draft')
  const avgCostPer1K = mean(agentUsages.map((u) => u.costPer1KTokens))
  const avgCacheHit = mean(agentUsages.map((u) => u.cacheHitRate))
  const alerts = []

  agentUsages.forEach((usage) => {
    const agent = activeAgents.find((a) => a.id === usage.agentId)
    if (!agent) return

    const avgOutputPerCall = usage.invocations ? usage.outputTokens / usage.invocations : 0
    const embeddingRatio = usage.totalTokens ? usage.embeddingTokens / usage.totalTokens : 0
    const model = MODEL_CATALOG[usage.runtimeType]
    const isPremiumModel = ['bedrock', 'azure_foundry'].includes(usage.runtimeType)

    if (usage.cacheHitRate < 18 && usage.invocations > 3000) {
      alerts.push(
        makeAlert({
          agent,
          usage,
          issueType: 'low_cache',
          severity: usage.cacheHitRate < 12 ? 'high' : 'medium',
          title: `${agent.name} — cache hit rate critically low`,
          problem: `Only ${usage.cacheHitRate}% cache hits vs ${Math.round(avgCacheHit)}% platform average. Repeated prompts are re-billed at full input token rate.`,
          avoid: 'Do not disable semantic caching or run identical harness tasks without deduplication.',
          recommendation: 'Enable semantic prompt cache (≥0.88 similarity) and scope cache to agent template family.',
          extraCostUsd: usage.costUsd * 0.22,
          pctAboveBenchmark: Math.round(((18 - usage.cacheHitRate) / 18) * 100),
        })
      )
    }

    if (isPremiumModel && avgOutputPerCall < 280 && usage.invocations > 2000) {
      alerts.push(
        makeAlert({
          agent,
          usage,
          issueType: 'model_overspend',
          severity: 'high',
          title: `${agent.name} — frontier model on low-output tasks`,
          problem: `Running ${model?.model ?? usage.model} with avg ${Math.round(avgOutputPerCall)} output tokens/call. Classification-style workload detected.`,
          avoid: 'Do not route tier-1 triage, tagging, or short-answer tasks to GPT-4o / Claude Sonnet.',
          recommendation: 'Downgrade to GPT-4o-mini or enable tiered model routing in FinOps Prompt Rules.',
          extraCostUsd: usage.costUsd * 0.68,
          pctAboveBenchmark: 68,
        })
      )
    }

    if ((agent.knowledgeSources?.length ?? 0) > 5) {
      alerts.push(
        makeAlert({
          agent,
          usage,
          issueType: 'context_bloat',
          severity: 'medium',
          title: `${agent.name} — too many knowledge sources bound`,
          problem: `${agent.knowledgeSources.length} knowledge sources inflate context assembly. Input tokens are ${Math.round(usage.inputTokens / 1000)}K MTD.`,
          avoid: 'Do not attach full enterprise knowledge fabric — scope sources per workflow step.',
          recommendation: 'Reduce to ≤5 sources; use category-scoped retrieval with 12K token context cap.',
          extraCostUsd: usage.costUsd * 0.18,
          pctAboveBenchmark: 35,
        })
      )
    }

    if (embeddingRatio > 0.22 && usage.embeddingTokens > 500_000) {
      alerts.push(
        makeAlert({
          agent,
          usage,
          issueType: 'embedding_spike',
          severity: 'medium',
          title: `${agent.name} — embedding token overhead`,
          problem: `${Math.round(embeddingRatio * 100)}% of token volume is embeddings (${(usage.embeddingTokens / 1_000_000).toFixed(1)}M tokens).`,
          avoid: 'Do not trigger full knowledge re-index on every harness run or sync cycle.',
          recommendation: 'Schedule incremental embedding sync off-peak; enable embedding batch coalescing.',
          extraCostUsd: usage.costUsd * embeddingRatio * 0.4,
          pctAboveBenchmark: Math.round(embeddingRatio * 100),
        })
      )
    }

    const costEval = agent.evaluation?.Cost
    if (typeof costEval === 'number' && costEval < 86) {
      alerts.push(
        makeAlert({
          agent,
          usage,
          issueType: 'cost_score_low',
          severity: costEval < 80 ? 'high' : 'medium',
          title: `${agent.name} — cost evaluation score below threshold`,
          problem: `Cost dimension scored ${costEval}/100 in onboarding evaluation. Agent lacks cost governance sign-off.`,
          avoid: 'Do not publish to production without cost optimization review and output caps.',
          recommendation: 'Re-run evaluation, apply prompt rules, and obtain FinOps approval before scale-up.',
          extraCostUsd: usage.costUsd * 0.15,
          pctAboveBenchmark: 100 - costEval,
        })
      )
    }

    if (avgCostPer1K > 0 && usage.costPer1KTokens > avgCostPer1K * 1.45) {
      alerts.push(
        makeAlert({
          agent,
          usage,
          issueType: 'benchmark_outlier',
          severity: 'high',
          title: `${agent.name} — cost outlier vs peer agents`,
          problem: `$${usage.costPer1KTokens.toFixed(4)}/1K tokens vs $${avgCostPer1K.toFixed(4)} platform average (+${Math.round(((usage.costPer1KTokens / avgCostPer1K) - 1) * 100)}%).`,
          avoid: 'Do not increase invocation volume until root cause is identified.',
          recommendation: 'Review model tier, context size, and harness retry settings for this agent.',
          extraCostUsd: usage.costUsd * 0.3,
          pctAboveBenchmark: Math.round(((usage.costPer1KTokens / avgCostPer1K) - 1) * 100),
        })
      )
    }

    if ((agent.tools?.length ?? 0) > 5 && usage.invocations > 4000) {
      alerts.push(
        makeAlert({
          agent,
          usage,
          issueType: 'retry_risk',
          severity: 'low',
          title: `${agent.name} — high tool surface area`,
          problem: `${agent.tools.length} tools connected with ${usage.invocations.toLocaleString()} invocations — failed tool routing can trigger retry loops.`,
          avoid: 'Do not leave retry budget unlimited on multi-tool agents.',
          recommendation: 'Cap retries at 2, enable re-prompt budget rule, prune unused tool bindings.',
          extraCostUsd: usage.costUsd * 0.08,
          pctAboveBenchmark: 20,
        })
      )
    }
  })

  return alerts.sort((a, b) => {
    const sev = { critical: 0, high: 1, medium: 2, low: 3 }
    const diff = (sev[a.severity] ?? 4) - (sev[b.severity] ?? 4)
    return diff !== 0 ? diff : b.extraCostUsd - a.extraCostUsd
  })
}

function getDemoAgentAlerts() {
  return [
    {
      id: 'demo_arch_cache',
      agentId: 'demo_ad_arch_review',
      agentName: 'Architecture Review Agent',
      category: 'ad',
      issueType: 'low_cache',
      issueLabel: ISSUE_TYPES.low_cache,
      severity: 'high',
      title: 'Architecture Review Agent — cache hit rate critically low',
      problem: 'Only 12% cache hits vs 28% platform average. Repeated HLD review prompts are fully re-billed.',
      avoid: 'Do not disable semantic caching or run identical architecture reviews without template keys.',
      recommendation: 'Enable semantic prompt cache (≥0.88 similarity) on AD workflow templates.',
      extraCostUsd: 4200,
      pctAboveBenchmark: 33,
      mtdCostUsd: 12400,
    },
    {
      id: 'demo_incident_model',
      agentId: 'demo_ams_incident_class',
      agentName: 'Incident Classification Agent',
      category: 'ams',
      issueType: 'model_overspend',
      issueLabel: ISSUE_TYPES.model_overspend,
      severity: 'high',
      title: 'Incident Classification Agent — frontier model on low-output tasks',
      problem: 'GPT-4o (Azure) with avg 180 output tokens/call on P1/P2 classification workload.',
      avoid: 'Do not route tier-1 incident tagging to GPT-4o — use mini model or rules engine first.',
      recommendation: 'Downgrade to GPT-4o-mini via tiered model routing in Prompt Rules.',
      extraCostUsd: 6800,
      pctAboveBenchmark: 68,
      mtdCostUsd: 9800,
    },
    {
      id: 'demo_rca_context',
      agentId: 'demo_ams_rca',
      agentName: 'RCA Agent',
      category: 'ams',
      issueType: 'context_bloat',
      issueLabel: ISSUE_TYPES.context_bloat,
      severity: 'medium',
      title: 'RCA Agent — too many knowledge sources bound',
      problem: '7 knowledge sources inflate context assembly; input tokens 18.4M MTD.',
      avoid: 'Do not inject full ServiceNow + Confluence corpus on every RCA harness run.',
      recommendation: 'Scope to incident-linked KB articles only; cap context at 12K tokens.',
      extraCostUsd: 2400,
      pctAboveBenchmark: 35,
      mtdCostUsd: 11200,
    },
    {
      id: 'demo_api_cost',
      agentId: 'demo_ad_api_design',
      agentName: 'API Design Agent',
      category: 'ad',
      issueType: 'cost_score_low',
      issueLabel: ISSUE_TYPES.cost_score_low,
      severity: 'medium',
      title: 'API Design Agent — cost evaluation below threshold',
      problem: 'Cost dimension scored 84/100 — below 86 FinOps gate for scale-up.',
      avoid: 'Do not increase harness concurrency until cost review is complete.',
      recommendation: 'Apply output token cap and re-certify in Evaluation Center.',
      extraCostUsd: 1100,
      pctAboveBenchmark: 16,
      mtdCostUsd: 7600,
    },
  ]
}

export function summarizeAgentAlerts(alerts) {
  const totalExtraCost = alerts.reduce((s, a) => s + a.extraCostUsd, 0)
  const byAgent = {}
  alerts.forEach((a) => {
    if (!byAgent[a.agentId]) {
      byAgent[a.agentId] = {
        agentId: a.agentId,
        agentName: a.agentName,
        category: a.category,
        alertCount: 0,
        extraCostUsd: 0,
        highestSeverity: 'low',
        issues: [],
      }
    }
    byAgent[a.agentId].alertCount += 1
    byAgent[a.agentId].extraCostUsd += a.extraCostUsd
    byAgent[a.agentId].issues.push(a.issueLabel)
    const sev = { critical: 4, high: 3, medium: 2, low: 1 }
    if ((sev[a.severity] ?? 0) > (sev[byAgent[a.agentId].highestSeverity] ?? 0)) {
      byAgent[a.agentId].highestSeverity = a.severity
    }
  })

  return {
    totalAlerts: alerts.length,
    totalExtraCostUsd: totalExtraCost,
    agentsWithIssues: Object.keys(byAgent).length,
    agentRankings: Object.values(byAgent).sort((a, b) => b.extraCostUsd - a.extraCostUsd),
    avoidGuidelines: FINOPS_AVOID_GUIDELINES,
  }
}
