# Add Agent Capacity meter

## Summary
Implement an Agent Capacity meter using splitter/builder heartbeat metrics to visualize agent load, showing assigned versus skipped tasks, and provide warnings when a lane approaches saturation to prevent backlog stalls.

## Definition of Done
The system displays a real-time Agent Capacity meter reflecting assigned and skipped tasks per agent using heartbeat metrics. It triggers warnings when any lane's load nears saturation thresholds, with visual indicators integrated into the dashboard. The feature is tested for accuracy, performance, and usability.

## Acceptance Criteria
- Agent Capacity meter accurately reflects assigned and skipped tasks per agent based on heartbeat metrics.
- Visual representation differentiates between assigned and skipped tasks clearly.
- Warning notifications trigger when a lane's load reaches a predefined saturation threshold.
- Warnings are visible on the dashboard and update in real-time.
- The meter updates dynamically as heartbeat metrics change without requiring page reload.
- The feature is tested and verified in staging environment before deployment.
- Documentation is updated to include the new Agent Capacity meter functionality.

## Handoff Actions
1. Provide UI/UX design mockups for the Agent Capacity meter and warning indicators.
2. Share updated API endpoints or data schema for heartbeat metrics used in the meter.
3. Deliver test cases and scenarios covering normal and edge cases for agent load visualization and warnings.
4. Coordinate with the monitoring team to integrate alerts into existing dashboards.
5. Update user documentation and training materials to include the new feature.
