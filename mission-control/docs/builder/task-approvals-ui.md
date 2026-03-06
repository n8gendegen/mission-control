# Wire Approvals tab to data + markdown

## Summary
Implement the Approvals tab to display approval entries dynamically with ROI modeling, enabling Nate to review and approve projects before work begins.

## Definition of Done
The Approvals tab fetches and displays all relevant approval entries with associated ROI modeling data. Nate can view detailed ROI calculations and approve or reject entries within the app. All data updates reflect in real-time, and the UI matches the design specifications with markdown support for descriptions.

## Acceptance Criteria
- Approvals tab loads and displays all current approval entries from the backend.
- Each approval entry includes ROI modeling data calculated and presented clearly.
- Descriptions and notes support markdown formatting and render correctly.
- Nate can approve or reject each entry directly from the tab.
- Approval actions update the backend and reflect immediately in the UI.
- UI matches the approved design mockups for the Approvals tab.
- Error states and loading indicators are handled gracefully.

## Handoff Actions
1. Provide backend API endpoints for fetching approval entries and submitting approval decisions.
2. Share design mockups and markdown rendering guidelines with the frontend team.
3. Coordinate with Nate to confirm ROI modeling requirements and approval workflows.
4. Set up testing scenarios for approval flows and ROI data accuracy.
