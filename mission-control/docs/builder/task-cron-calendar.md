# Add Cron Jobs calendar to Calendar tab

## Summary
Implement a week-view calendar UI in the Calendar tab that displays static cron job schedules by expanding their cron expressions into this week's time slots.

## Definition of Done
The Calendar tab includes a new week-view calendar that visually displays all predefined static cron jobs. Cron expressions are correctly parsed and expanded to show scheduled occurrences within the current week. The UI is responsive and matches the existing design language. The feature is tested with multiple cron expressions and verified for accuracy and usability.

## Acceptance Criteria
- Static cron job definitions are stored and accessible within the application.
- A helper function correctly parses cron expressions and expands them into scheduled times for the current week.
- The Calendar tab includes a new week-view calendar UI component.
- The calendar visually displays all cron job occurrences for the current week in their respective time slots.
- The UI is responsive and consistent with the existing Calendar tab design.
- Edge cases such as cron jobs scheduled at midnight or spanning multiple days are handled correctly.
- Unit and integration tests cover the helper function and UI rendering of cron job schedules.

## Handoff Actions
1. Provide the static cron job definitions data structure to the frontend team.
2. Deliver the helper function code for parsing and expanding cron expressions.
3. Share UI mockups or design guidelines for the week-view calendar.
4. Coordinate with QA to prepare test cases covering various cron schedules.
5. Document the new calendar feature and usage instructions for future maintenance.
