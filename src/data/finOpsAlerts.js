/** Platform-wide practices that drive avoidable AI spend */

export const FINOPS_AVOID_GUIDELINES = [
  {
    id: 'avoid-frontier-classify',
    title: 'Do not use frontier models for simple classification',
    detail: 'GPT-4o and Claude Sonnet on tasks with <250 token outputs wastes 60–80% of budget.',
  },
  {
    id: 'avoid-full-knowledge',
    title: 'Do not inject full knowledge fabric on every harness run',
    detail: 'Unscoped RAG pulls inflate input tokens. Use category-scoped retrieval with salience limits.',
  },
  {
    id: 'avoid-no-cache',
    title: 'Do not run repeated prompts without semantic caching',
    detail: 'Architecture reviews, incident triage, and test generation often repeat — cache hits should exceed 35%.',
  },
  {
    id: 'avoid-unbounded-output',
    title: 'Do not leave max output tokens unbounded',
    detail: 'Agents without output caps can burn 10K+ tokens per run on runaway completions.',
  },
  {
    id: 'avoid-embedding-storm',
    title: 'Do not trigger full re-index during business hours',
    detail: 'Bulk embedding syncs can spike costs 3–4× in a single day.',
  },
  {
    id: 'avoid-retry-loops',
    title: 'Do not allow unlimited harness retries',
    detail: 'Failed tool calls with auto-retry multiply token spend without governance caps.',
  },
]
