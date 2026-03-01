# Bounty Lane Sources & First Target (2026-03-01)

## Source filters
1. **Replit Bounties** – filter for TypeScript/React/Next.js tags, payout $500+, SLA ≤14 days.
2. **Gitcoin/Stackr Improvements** – target AI agent or automation repos with clear acceptance tests, payout $750–$2k.
3. **OSS repo issues (Vercel, Supabase, LangChain)** – monitor `good first issue` + `help wanted` labels filtered by `nextjs` + `ts`. Use GitHub search saved query: `label:"help wanted" language:TypeScript is:issue repo:vercel/next.js` etc.
4. **Earn.com / Product Hunt Makers** – look for urgent bug bounties posted by YC/AI startups with Next.js frontends.

## Candidate Task #1
- **Source:** Replit Bounties (#21873)
- **Repo:** https://github.com/replit/clerk-app-template (private invite once accepted)
- **Summary:** Fix OAuth callback regression that breaks Google sign-in on the Clerk Next.js starter. Requires upgrading NextAuth middleware + Vercel edge config.
- **Acceptance criteria:**
  - Reproduce bug on provided project; add regression test for Google provider.
  - Upgrade Next.js route handlers to stable, ensure middleware uses `auth().protect()`.
  - Deploy preview (Vercel) showing working Google login + session persistence.
  - Provide patch + short Loom walkthrough. 
- **Payout:** $1,100 USD fixed.
- **Risk notes:**
  - Requires temporary access to Clerk dev account (credentials provided after acceptance).
  - Edge/middleware changes must not break existing email/password flow; need regression test.
  - Timeline 5 days; acceptance dependent on Loom demo.
- **Recommendation:** Good first target for Steve once concierge page is live; aligns with TS/Next skillset and pays >$1k for <2 days work.
