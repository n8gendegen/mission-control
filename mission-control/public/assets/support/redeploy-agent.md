# Redeploying Your Agent

Use this runbook whenever you need to upgrade, patch, or debug the concierge install.

## 1. Snapshot current status
- `pnpm run agent:status` (or `openclaw status`) to confirm heartbeat.  
- Copy the latest agent logs (Mission Control → Tasks → Agent Health tile).

## 2. Pull the latest bundle
- Download the newest Mission Control release from the concierge portal.  
- Verify checksums if provided.

## 3. Redeploy by environment
- **Docker:** `docker pull <image>` → `docker compose up -d`.  
- **Kubernetes:** update the deployment image tag and run `kubectl rollout status`.  
- **Bare metal:** stop the systemd service, replace the binary, restart.

## 4. Validate
- Hit `https://<your-domain>/api/health`. Expect `200 OK`.  
- Run a smoke test task (e.g., `Heartbeat: self-check`).

## 5. Rollback if needed
- Keep the prior release tarball for at least 24 hours.  
- `git checkout <previous-tag>` or redeploy the older container tag if regressions surface.

Support is on-call during redeploys covered by your SLA tier. DM your concierge thread or email support@atlasagentsuite.com if anything blocks you.
