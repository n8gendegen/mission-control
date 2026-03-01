# Clawbot Install Concierge + Mission Control Starter Pack

_Last updated: 2026-03-01_

## Persona & Problem
- **Who we serve:** Operators, tech leads, or founders running lean teams who need OpenClaw/Clawbot live fast without babysitting an install playbook.
- **Current pain:** They burn 8–12 hours wrangling configs (Homebrew, Node, OpenClaw CLI, Supabase/Vercel wiring) before they ever see a working Mission Control. Every hour burned on install is an hour not spent running revenue or ops experiments.
- **What they want:** A battle-tested concierge who sets up the agent stack, hardens secrets, deploys Mission Control, and leaves them with a working playbook + next steps.

## Offer Overview
| Tier | Name | What they get | Turnaround |
| --- | --- | --- | --- |
| Tier 1 | **Done-for-you Clawbot Install** | 1:1 kickoff call, environment prep (macOS/Linux), OpenClaw agent install, baseline automations (heartbeat + status), secrets audit, validation walkthrough, 7-day post-install DM support. | 3–5 business days |
| Tier 2 | **Mission Control Starter Pack** | Everything in Tier 1 plus: Mission Control deployed on Vercel + Supabase, Concierge landing module enabled, Revenue Lab & Tasks tabs templated, first heartbeat + report automations, 14-day coaching + async office hours, loom handoff of dashboards + maintenance checklist. | 5–7 business days |

### Deliverables per Tier
**Tier 1**
- Device readiness audit + dependency install script
- OpenClaw/Clawbot configured with at least 2 automations (heartbeat + status)
- Secure storage of required API keys (1Password or local vault)
- Smoke-test transcript + rollback plan

**Tier 2 (Starter Pack add-on)**
- Supabase + Vercel projects created and linked to OpenClaw repo
- Mission Control deployed with Tasks, Content, Approvals, Live Activity populated with starter data
- Concierge landing page + lead form skeleton configured
- Revenue Lab template + 3 seeded experiments loaded
- Custom status dashboard configured in-app
- 2 async office hour sessions (video or chat) for handoff/questions

## Pricing & Guarantees (proposed)
| Tier | Recommended Price | Alternatives | Notes |
| --- | --- | --- | --- |
| Tier 1 | **$1,950 flat** | $1,500 "lite" (no post-install support) or $2,250 premium (adds on-site session) | Anchored around ~12 hrs senior operator time incl. support buffer. |
| Tier 2 add-on | **+$2,400** (total $4,350) | +$2,000 fast-track (lighter templates), +$2,900 premium (includes KPI automation + extra office hour) | Includes design/dev time to deploy MC + Revenue Lab artifacts. |

**Guarantee options**
1. **"Go-Live or We Fix Free"** – If Clawbot agent isn’t running the agreed heartbeat + status automation within 7 days of kickoff, we continue working at no charge until it is.
2. **14-Day Stability Check** – If any install step we touched breaks within 14 days, we remediate in <24h or refund 20% of the fee.

(Risks & assumptions for Approvals captured separately.)

## Process Snapshot
1. **Discovery (30 min):** current stack, security constraints, goals.
2. **Prep Checklist:** share vault, confirm device access, schedule install window.
3. **Install & Validation:** run scripted install, configure automations, walk client through tests.
4. **Mission Control (Tier 2):** deploy MC to Vercel/Supabase, load starter data, configure concierge funnel.
5. **Handoff:** Loom/video walkthrough, SLA for post-install support, backlog of next experiments.

## FAQ (Top 10)
1. **What OS / hardware do you support?** macOS Sonoma, macOS Ventura, Ubuntu 22.04+, and most Apple silicon laptops. Windows via WSL2 is case-by-case (Tier 1 only).
2. **Do I need to share API keys?** We provision via your vault (1Password/Bitwarden). Keys never leave your environment; we set up scripts so you can rotate at any time.
3. **How long does install take?** Tier 1 completes in 3–5 business days from kickoff; Tier 2 adds ~2 days for Mission Control deployment + handoff.
4. **Can you work alongside our internal IT/security?** Yes—Tier 1 includes a security checklist and change log so infosec can review each step.
5. **What if I already have Mission Control partially running?** We audit what’s built, reuse components, and only bill for the remaining scope.
6. **Do you handle Vercel/Supabase billing?** No; we help you create org accounts and document expected monthly spend.
7. **Is there ongoing maintenance?** Tier 1 includes 7-day DM support. Longer retainers route into custom ops packages.
8. **Can we white-label the concierge assets?** Tier 2 includes editable copy + components so you can rebrand the landing page quickly.
9. **What’s needed before kickoff?** Admin access to the install machine, GitHub repo (or invite us to a fork), Vercel + Supabase accounts, and a list of required automations.
10. **Do you integrate with our CRM/helpdesk?** Tier 2 optionally pipes lead form submissions into Airtable/HubSpot/Zendesk; deeper integrations are scoped separately.
