# Run Stripe sandbox license test

## Summary
Run a Stripe test-mode checkout, capture the webhook payload, and verify `/api/concierge/license/redeem` issues a JWT + stores the license.

## Definition of Done
Test checkout completed, webhook log saved, Supabase shows the license row, and redeem endpoint returns valid JWT; attach log snippets to the task.

## Acceptance Criteria
- Uses provided test price ID for Tier 2
- Confirms webhook handler stores `customer_details.email` + license
- Calls `/api/concierge/license/redeem?license=<token>` and records response
- Uploads webhook + API logs to the task
- Marks task complete once validated

## Handoff Actions
1. Load test keys into `secrets/env.mission-control`
2. Run `npm run dev` or use deployed URL for checkout
3. Trigger webhook replay if needed
4. Document observed JWT + expiration
