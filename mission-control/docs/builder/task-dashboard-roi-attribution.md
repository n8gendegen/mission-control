# Annotate builder PRs with ROI

## Summary
Automatically annotate builder pull requests with payout and effort metadata upon merge to enable Mission Control to display realized revenue over time and identify the most profitable automations.

## Definition of Done
When a builder PR is merged, the system logs the associated payout and effort metadata accurately. Mission Control can retrieve and display this data to show realized revenue trends and highlight the most profitable automations. The annotation process is reliable, does not impact merge performance, and is covered by tests.

## Acceptance Criteria
- Upon merging a builder PR, payout metadata is logged correctly.
- Upon merging a builder PR, effort metadata is logged correctly.
- Mission Control can access and display the logged payout and effort data for merged builder PRs.
- The annotation process does not delay or interfere with the PR merge operation.
- Automated tests cover the annotation logic and data retrieval.
- Error handling is in place for cases where metadata is missing or logging fails.

## Handoff Actions
1. Notify the Mission Control team about the new metadata fields available for display.
2. Provide documentation on the annotation process and data schema.
3. Coordinate with the UI team to update Mission Control dashboards to utilize the new data.
4. Ensure monitoring and alerting are set up for annotation failures.
