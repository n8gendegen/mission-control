# Adding Additional Agents

Follow this when scaling beyond your first Launchpad agent.

1. **Plan the workload**  
   - Name, purpose, and ownership of the new agent.  
   - Required secrets + integrations.  
   - Budget guardrails (monthly cap, provider mix).

2. **Provision credentials**  
   - Duplicate the Mission Control `.env.example` block for the new agent.  
   - Create a unique API key + GitHub deployment token.  
   - Store everything in your shared vault entry.

3. **Deploy**  
   - Run `pnpm run agent:create --name <agent>` to scaffold tasks + cron rows.  
   - Add the agent to the Mission Control sidebar (Projects → Agents → “Add agent”).

4. **Verify routing**  
   - Assign a low-risk task and watch the Agent Status cards for completion.  
   - Confirm spend shows up under the new agent in Data → Usage.

5. **Document + monitor**  
   - Update your Agent Ops Brief with the new agent’s scope.  
   - Add alerts for failures (Mission Control → Alerts tab → +Condition).

> Billing reminder: concierge plans include up to 3 concurrent agents. Contact us if you need custom scaling or geographic placement.
