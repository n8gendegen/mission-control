# Rotating API Keys

Rotating keys keeps your automations secure without interrupting service. Follow this sequence for any OpenClaw/Mission Control integration (OpenAI, Supabase, Stripe, etc.).

1. **Prep the vault**  
   - Create the replacement key in your provider console.  
   - Store it in your 1Password/Bitwarden item next to the current key.

2. **Update running services**  
   - Update `.env`, Supabase secrets, and Vercel environment variables with the new value.  
   - Redeploy Mission Control (or restart the local agent) so env vars reload.

3. **Verify connectivity**  
   - Run `npm run healthcheck` in the Mission Control repo *or* hit `/api/health` to confirm success.  
   - Check agent logs for any `401/403` responses.

4. **Revoke the old key**  
   - Once requests succeed on the new key, revoke the old one in the provider console.  
   - Note the rotation timestamp in the vault entry for audit trail.

> **Heads up:** keep both keys active for a few minutes while the redeploy warms up. If you revoke the old key before the new build boots, chatbot installs will fail.
