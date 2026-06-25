/** Enterprise FinOps reference data — model rates, budgets, optimization signals */

export const FINOPS_BUDGET = {
  monthlyCapUsd: 185000,
  alertThresholdPct: 85,
  fiscalPeriod: 'FY2026 Q2',
  costCenter: 'CC-4482 · Enterprise AI Platform',
  currency: 'USD',
}

export const MODEL_CATALOG = {
  bedrock: {
    id: 'claude-35-sonnet-bedrock',
    model: 'Claude 3.5 Sonnet',
    provider: 'AWS Bedrock',
    region: 'us-east-1',
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    cacheReadPer1M: 0.3,
    cacheWritePer1M: 3.75,
  },
  azure_foundry: {
    id: 'gpt-4o-azure',
    model: 'GPT-4o',
    provider: 'Azure OpenAI',
    region: 'eastus2',
    inputPer1M: 2.5,
    outputPer1M: 10.0,
    cacheReadPer1M: 1.25,
    cacheWritePer1M: 0,
  },
  python: {
    id: 'gpt-4o-mini-router',
    model: 'GPT-4o-mini',
    provider: 'OpenAI (platform router)',
    region: 'multi',
    inputPer1M: 0.15,
    outputPer1M: 0.6,
    cacheReadPer1M: 0.075,
    cacheWritePer1M: 0,
  },
  container: {
    id: 'llama-31-70b-eks',
    model: 'Llama 3.1 70B',
    provider: 'Self-hosted EKS',
    region: 'us-east-1',
    inputPer1M: 0.38,
    outputPer1M: 0.38,
    cacheReadPer1M: 0,
    cacheWritePer1M: 0,
  },
  api_endpoint: {
    id: 'now-assist',
    model: 'Now Assist GenAI',
    provider: 'ServiceNow',
    region: 'instance',
    inputPer1M: 0,
    outputPer1M: 0,
    flatPerInvocation: 0.082,
  },
}

export const OPTIMIZATION_SIGNALS = [
  {
    id: 'cache',
    severity: 'high',
    title: 'Prompt cache underutilized on AD agents',
    detail: 'Architecture Review Agent shows 12% cache hit rate vs 45% platform target. Estimated $4.2K/mo recoverable.',
    action: 'Enable semantic cache on repeated HLD prompts',
  },
  {
    id: 'model-rightsize',
    severity: 'medium',
    title: 'GPT-4o over-provisioned for classification tasks',
    detail: 'Incident Classification Agent avg output 180 tokens — candidate for GPT-4o-mini with 78% cost reduction.',
    action: 'Route tier-1 classification to mini model',
  },
  {
    id: 'idle',
    severity: 'low',
    title: 'Reserved Bedrock throughput idle 18%',
    detail: 'Provisioned 2K TPM reserved capacity; peak usage 1,640 TPM. Consider reducing reservation next cycle.',
    action: 'Review reservation in AWS Cost Explorer',
  },
  {
    id: 'embedding',
    severity: 'medium',
    title: 'Embedding re-index spike detected',
    detail: 'Knowledge Fabric sync drove 8.4M embedding tokens (+340% vs baseline) on Jun 22.',
    action: 'Schedule incremental re-index during off-peak',
  },
]
