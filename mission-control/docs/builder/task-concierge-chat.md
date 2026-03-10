# Design minimal guided install/chat flow

## Summary
Create a minimal guided installation and chat flow that interactively asks users about their OS and software stack, guides them through key installation steps, and escalates to Concierge support if the user encounters blockers.

## Definition of Done
A fully functional interactive chat flow that prompts users for their OS and stack, guides them through essential installation steps, detects when users are blocked, and escalates the conversation to Concierge support seamlessly. The flow should be tested across supported OSes and stacks, with clear user prompts and escalation triggers implemented.

## Acceptance Criteria
- The chat flow prompts the user to select or input their operating system.
- The chat flow prompts the user to select or input their software stack.
- The flow guides the user through the key installation steps relevant to their OS and stack.
- If the user indicates they are blocked or unable to proceed, the flow escalates to Concierge support automatically.
- Escalation to Concierge includes transferring context about the user's OS, stack, and current step.
- The flow is minimal and user-friendly, avoiding unnecessary questions or steps.
- The flow is tested and verified on all supported OS and stack combinations.

## Handoff Actions
1. Provide the development team with detailed OS and stack options and corresponding installation steps.
2. Share escalation criteria and process details with the Concierge team.
3. Coordinate with UX designers to finalize chat flow prompts and UI elements.
4. Set up testing scenarios covering all supported OS and stack combinations.
5. Prepare documentation for support teams on how the escalation works.
