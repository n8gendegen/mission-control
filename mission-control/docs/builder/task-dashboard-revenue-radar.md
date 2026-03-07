# Ship Revenue Radar tile

## Summary
Implement the Revenue Radar tile to display the latest spy and builder specs including payout, ETA, and owner, with direct links to associated tasks and PRs for easy access by revenue operations.

## Definition of Done
The Revenue Radar tile is deployed and visible on the dashboard, showing up-to-date spy and builder specs with payout, ETA, and owner information. Each spec entry includes clickable links to the corresponding tasks and pull requests. The data refreshes automatically to ensure freshness. The feature is tested across supported browsers and devices, and documentation is updated accordingly.

## Acceptance Criteria
- The tile displays a list of the most recent spy and builder specs.
- Each spec entry shows payout amount, estimated time of arrival (ETA), and owner name.
- Each spec entry includes direct clickable links to the related tasks and pull requests.
- Data shown in the tile is refreshed automatically at a defined interval (e.g., every 5 minutes) to ensure freshness.
- The tile is accessible and renders correctly on all supported browsers and devices.
- Revenue operations users can easily identify and select the next play without needing to search elsewhere.
- Documentation is updated to include usage instructions and any relevant technical details.

## Handoff Actions
1. Provide API endpoints or data sources for fetching the latest spy and builder specs with payout, ETA, owner, tasks, and PR links.
2. Share design mockups or UI guidelines for the Revenue Radar tile.
3. Coordinate with backend team to ensure data freshness and availability.
4. Prepare test cases covering data accuracy, link functionality, and UI responsiveness.
5. Update user documentation and internal knowledge base with the new feature details.
