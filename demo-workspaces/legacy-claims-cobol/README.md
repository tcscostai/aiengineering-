# Legacy Claims Adjudication — COBOL Workspace

Synthetic mainframe-style healthcare claims codebase for **TCS Reverse Engineering Studio**.

## Scan this workspace

In **Reverse Engineering → Local Path**, use:

```
/Users/saurabhdubey/AI Engineering/horizon-ai-engineering/demo-workspaces/legacy-claims-cobol
```

Or click the **COBOL Claims (legacy)** quick-start chip in the scan panel.

## What's inside

| Area | Description |
|------|-------------|
| `cbl/` | COBOL programs — claims main, adjudication, eligibility, prior auth |
| `cpy/` | Copybooks — member, claim, eligibility record layouts |
| `jcl/` | Batch JCL for nightly claims cycle |
| `sql/` | DB2 DDL for claims tables |
| `config/` | Runtime properties |

## Expected RE results

- **Domain:** healthcare / claims
- **Languages:** COBOL, COBOL Copybook, JCL, SQL
- **Graph:** Architecture links between programs and copybooks; data-flow layers
- **Blueprint:** Suggests migration to Spring Boot or React (select target in Blueprint tab)

## Scenario

Simulates a 1990s–2000s payer claims monolith being reverse-engineered for cloud migration.
