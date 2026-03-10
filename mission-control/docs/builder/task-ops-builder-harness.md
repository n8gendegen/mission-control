# Fix Steve builder harness + GitHub flow

## Summary
Update the Steve builder harness and GitHub flow to securely manage GitHub tokens, conditionally skip builder sessions when Steve is disabled, and automatically re-enable automation after the Power Ledger v1 release. This ensures secure operations, efficient resource use, and timely automation control aligned with release milestones.

## Definition of Done
"Steve builder harness skips runs when disabled, GitHub token/config is securely implemented, and automation re-enables automatically after Power Ledger v1 ships."

## Acceptance Criteria
- GitHub token or configuration is properly added and secured (e.g., stored in secrets, not hardcoded).
- Builder-session runner checks Steve's enabled/disabled status before execution.
- When Steve is disabled, builder-session runner skips without errors or unnecessary resource usage.
- Automation (e.g., CI/CD pipelines) is disabled until Power Ledger v1 ships.
- After Power Ledger v1 ships, automation re-enables automatically without manual intervention.
- Changes are tested in a non-production environment to verify functionality.
- Documentation is updated to reflect new configuration and behavior.

## Handoff Actions
1. Review and approve the updated builder harness code.
2. Update GitHub repository settings or CI/CD configuration with secure token.
3. Deploy changes to staging for validation.
4. Monitor initial runs to ensure skipping and re-enablement work as expected.
5. Communicate changes to relevant teams (e.g., dev, ops).
