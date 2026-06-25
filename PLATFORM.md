# HORIZON AI Engineering Platform

**Engineering AI at Enterprise Scale**

---

## The Problem

Enterprises are building AI agents everywhere — in AWS Bedrock, Azure AI Foundry, Python services, ServiceNow, internal repos, vendor tools, and team sandboxes. Each team ships something useful, but the organization ends up with:

- **Fragmented agents** with no single inventory or ownership model  
- **No shared governance** — security, PII, responsible AI, and approvals are inconsistent  
- **No evaluation standard** — quality, groundedness, and cost are measured differently per team  
- **No reuse** — skills, workflows, and knowledge are trapped in silos  
- **Runaway cost** — token spend, model tiering, and prompt waste are invisible until finance asks  
- **No operational layer** — harnessing, orchestration, runtime, and observability are rebuilt per project  

**Horizon exists to solve this.** Teams can **build agents anywhere**. They **onboard them here**. The platform handles **everything else**.

---

## Core Idea: Build Anywhere, Onboard Here

```
┌─────────────────────────────────────────────────────────────────┐
│  Teams build agents in their preferred stack                     │
│  Bedrock · Azure Foundry · Python · Containers · APIs · SN...   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Onboard
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              HORIZON AI ENGINEERING PLATFORM                     │
│  Register · Connect · Evaluate · Govern · Harness · Run · Cost  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   Reuse & Share           Operate Safely          Prove Value
   Marketplace            Runtime + FinOps         Insights
```

You do **not** need to rebuild your agent inside Horizon. You **register** what already exists — point to an ARN, repo, deployment, or API — and the platform wraps it with enterprise engineering discipline.

---

## Why We Need This Platform

| Without Horizon | With Horizon |
|-----------------|--------------|
| Agents live in spreadsheets and slide decks | Single system of record for all agents |
| “Is this production-ready?” is a meeting | Evaluation Center with scored dimensions |
| Governance is a checklist PDF | Governance Center with approvals and audit trail |
| Harness tests are manual scripts | AI Harness runs a 10-step enterprise pipeline |
| Knowledge is scattered across tools | Knowledge Fabric binds graphs to agents |
| Cost surprises at month-end | FinOps with token analytics, alerts, and prompt rules |
| Every team reinvents orchestration | Workflow Composer + Library for multi-agent flows |
| No reuse across AD, AMS, QE | Domain workspaces + Marketplace for published agents |

Horizon is not another agent builder. It is the **Enterprise AI Engineering Operating System** — the control plane for agents that already exist or are being built.

---

## Platform Usefulness (What You Get)

### For engineering teams
- Onboard agents in minutes without migrating code  
- Run agents through a **real harness** (context → prompt → tools → policy → approval)  
- Bind **knowledge graphs** and debt intelligence to agents  
- Compose **multi-agent workflows** with drag-and-drop and exportable JSON  

### For platform / architecture teams
- Standardize evaluation across AD, AMS, and QE  
- Enforce governance gates before publish  
- Track initiatives and tie agents to business outcomes  
- See which agents are **cost outliers** and what to avoid  

### For leadership
- Executive Dashboard and Insights — health, reuse, velocity, value  
- FinOps visibility — spend, forecast, budget, optimization levers  
- Proof that AI engineering is **managed**, not experimental  

---

## Feature Overview

### Overview

| Module | What it does |
|--------|----------------|
| **Executive Dashboard** | Live health of initiatives, agents, reuse, evaluation, and governance — computed from onboarded data |
| **New Initiative** | Create and track engineering initiatives; agents onboard against business goals |

### Engineering

| Module | What it does |
|--------|----------------|
| **Agent Onboarding Studio** | Register agents from any team/project. Categories: **AD**, **AMS**, **QE**. Capture purpose, skills, knowledge sources, tools, runtime connection, evaluation, and governance |
| **AI Harness Engineering** | Execute single-agent runs or compose multi-agent workflows. 10-step pipeline: context assembly, prompt build, memory, tools, workflow routing, collaboration, evaluation, policy, observability, human approval |
| **Knowledge Fabric** | Per-category knowledge graphs + **Debt Profiler** — bind enterprise knowledge and technical debt signals to agents |
| **Workflow Designer** | Design and visualize agent workflows for enterprise reuse |

### Domains

| Module | What it does |
|--------|----------------|
| **AD Engineering** | Application Development agents — architecture, API design, code review |
| **AMS Engineering** | Application Management Services — RCA, incident classification, runbooks |
| **QE Engineering** | Quality Engineering — regression, API testing, automation |

### Operations

| Module | What it does |
|--------|----------------|
| **Evaluation Center** | Aggregated quality scores — groundedness, security, cost, latency, coverage, and more |
| **Governance Center** | Responsible AI, PII, security, human approval, version control, audit trail |
| **FinOps Center** | Token consumption, model cost mix, budget tracking, **Cost Alerts** (which agents waste money and what to avoid), **Prompt Rules** (caching, compression, routing, caps) |
| **Agent Runtime** | Operational view of published agents and runtime status |

### Ecosystem

| Module | What it does |
|--------|----------------|
| **Agent Marketplace** | Discover and deploy published agents — terminal-style deployment UX for enterprise demos |
| **Continuous Learning** | Feedback loops and improvement signals across the agent portfolio |
| **Executive Insights** | Velocity, reuse, automation opportunity, and business value trends |

---

## Agent Lifecycle on the Platform

```
  Build anywhere          Onboard here              Platform does the rest
       │                       │                              │
       ▼                       ▼                              ▼
  Team creates          Agent Onboarding              Harness · Evaluate
  agent in their        Studio: register              · Govern · Knowledge
  stack (Bedrock,       connection, skills,           · Workflow · Runtime
  Foundry, Python,      knowledge, tools              · FinOps · Marketplace
  ServiceNow, etc.)
       │                       │                              │
       └───────────────────────┴──────────────────────────────┘
                               │
                    Draft → Configured → Evaluated
                         → Certified → Published
```

**Supported runtime types** (connect, don’t rebuild):

- AWS Bedrock Agent  
- Azure AI Foundry  
- Python service (Git repo + entry point)  
- Container / EKS deployment  
- API endpoint (e.g. ServiceNow, internal gateways)  

Once **published**, the agent appears across Dashboard, Marketplace, Runtime, Evaluation, Governance, and FinOps — automatically.

---

## AI Harness: What “Everything Else” Means

When an onboarded agent runs through the harness, the platform orchestrates:

1. **Context Assembly** — pull from Jira, Confluence, ServiceNow, repos, policies  
2. **Prompt Assembly** — purpose, skills, family, task  
3. **Memory Retrieval** — enterprise memory and artifacts  
4. **Tool Routing** — GitHub, Jira, Confluence, ServiceNow, etc.  
5. **Workflow Routing** — place agent in enterprise flow  
6. **Agent Collaboration** — coordinate with skills and peer agents  
7. **Evaluation** — quality gates on dimensions  
8. **Policy Enforcement** — governance, PII, responsible AI  
9. **Observability** — telemetry, traces, audit  
10. **Human Approval** — pause when policy requires a person  

Teams build the **agent brain**. Horizon builds the **enterprise nervous system** around it.

---

## FinOps: Cost Intelligence Built In

FinOps is not an afterthought. The platform tracks:

- **MTD spend**, token volume, budget utilization, forecast  
- **Per-agent cost** — invocations, tokens, cache hit rate, $/1K tokens  
- **Cost Alerts** — which agents are doing the wrong thing (low cache, wrong model tier, context bloat) and explicit **“do not”** guidance  
- **Prompt Rules** — user-controlled optimization: semantic cache, compression, model downgrade routing, context truncation, output caps, retry budgets  

This turns AI spend from a black box into an **engineering discipline**.

---

## Knowledge Fabric & Debt Profiler

Agents are only as good as what they know. Knowledge Fabric provides:

- **Per-category knowledge graphs** (AD, AMS, QE)  
- **ServiceNow incident graphs**, architecture repos, runbooks, test assets  
- **Debt Profiler** — technical debt signals linked to agents and knowledge nodes  

So onboarding an agent is not just registering code — it is **binding** the agent to enterprise context.

---

## Security & Access

- JWT-based secure sign-in  
- Role-based platform access (Administrator)  
- Session persistence with enterprise auth patterns  
- Governance and audit trail for agent changes  

---

## Who Is This For?

| Persona | Primary use |
|---------|-------------|
| **AI / software engineer** | Onboard agents, run harness, compose workflows |
| **AMS / SRE lead** | Incident and RCA agents, knowledge binding, runtime |
| **QE lead** | Test automation agents, evaluation, coverage |
| **Enterprise architect** | Governance, initiatives, cross-domain reuse |
| **Platform engineering** | FinOps, prompt rules, runtime, marketplace |
| **Executive sponsor** | Dashboard, insights, cost and velocity proof |

---

## One-Line Pitch

> **Your teams build agents anywhere. Horizon onboards them once and runs the enterprise layer — evaluate, govern, harness, orchestrate, observe, optimize cost, and reuse — so AI engineering scales like real engineering.**

---

## Getting Started

```bash
cd horizon-ai-engineering
npm install
npm run dev
```

1. Sign in with your platform credentials  
2. Open **Agent Onboarding Studio**  
3. Register an agent (any runtime type)  
4. Run it in **AI Harness**  
5. Review **Evaluation**, **Governance**, and **FinOps**  
6. **Publish** to **Marketplace** when ready  

**Step-by-step navigation:** see [NAVIGATION_GUIDE.md](./NAVIGATION_GUIDE.md) for a full click-by-click walkthrough of every module.

---

## Summary

Horizon AI Engineering is the **single place** where enterprise agents land after they are built. It does not replace your AI stack — it **completes** it with the operating system that large organizations need: inventory, quality, governance, orchestration, knowledge, cost control, and reuse.

**Build anywhere. Onboard here. The platform does everything else.**
