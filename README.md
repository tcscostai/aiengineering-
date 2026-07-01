# TCS AI Engineering

**Engineering AI at Enterprise Scale**

Enterprise AI Engineering Operating System — onboard, govern, evaluate, and reuse AI agents across Application Development, AMS, and Quality Engineering.

## Real Working Features (No Mock Data)

- **Persistent storage** via localStorage — all agents and initiatives survive page refresh
- **Agent Onboarding Studio** — AD, AMS, QE categories with full onboarding pipeline
- **Initiatives** — create and track engineering initiatives
- **Marketplace** — shows agents you publish through onboarding
- **Dashboard, Runtime, Evaluation, Governance** — computed from your real onboarded agents

## Tech Stack

React (Vite) · Tailwind CSS · Framer Motion · React Flow · Recharts · Lucide Icons

## Getting Started

```bash
cd horizon-ai-engineering
npm install
npm run dev:full    # UI + Reverse Engineering API (recommended)
# or separately:
npm run server      # RE API on :4174 — real Git clone & workspace scan
npm run dev         # UI on :5173
```

### Reverse Engineering Studio

Navigate to **Engineering → Reverse Engineering** for migration discovery:

- **Git Repository** — real `git clone` (public/private with token), branch & monorepo subpath
- **Local Path** — scan any folder on the machine running the API server
- **Upload ZIP** — extract and analyze a workspace archive

Outputs: Code Universe graph, AI copilot Q&A, migration blueprint, Initiative/Governance handoff.

> **Note:** GitHub Pages hosts the static UI only. Run `npm run server` locally (or deploy the `server/` API separately) for real scans.

## Agent Onboarding Flow

1. Go to **Agent Onboarding Studio**
2. Select category: **AD**, **AMS**, or **QE**
3. Click **Onboard New Agent** — register agents from any team/project
4. Fill in project, team, owner, purpose, skills, knowledge, tools
5. Complete evaluation and governance
6. **Advance** through stages: Draft → Configured → ... → **Published**
7. Published agents appear in **Marketplace**, **Runtime**, and **Evaluation Center**

## Initiatives

Create business initiatives under **New Initiative**, then onboard the agents required for that initiative in the studio.
