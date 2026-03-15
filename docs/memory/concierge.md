# Concierge Service Memory

## Purpose
Automated deployment/configuration of OpenClaw & Mission Control stacks for enterprise clients via paid service.

## Modules (2026-03-14)
**Live**:
- **Module 0**: Base container provisioning
- **Module 1**: Stripe checkout integration (test-mode validation pending)

**In Development**:
- **Module 2**: License management (`licenses` table)
- **Module 3**: Content pipeline automation
- **Module 4**: Multi-tenant RBAC controls

## Core Workflows
1. **Checkout Flow**
   - Tier selection → Stripe → `subscriptions` table
   - Webhook → JWT generation (v0.8 implemented)
   - TODO: Auto license provisioning

2. **Security Spine**:
   - Cloudflare Full Strict TLS
   - Vercel preview/prod isolation
   - Signed JWTs for API access

## 'Sell-Ready Tonight' Criteria
✅ Tier picker + checkout UI
✅ Test-mode Stripe session creation
✅ Auth0 scaffolding
❌ License revocation automation
❌ Audit logging system

## Key TODOs
1. Finalize schema relationships:
   - `customers` ↔ `licenses` ↔ `subscriptions`
2. Build license revocation CLI
3. Implement tenant permission boundaries
4. Content pipeline API rate limiting

---
*Rebuilt from mission-control/docs + Stripe/webhook implementation logs*