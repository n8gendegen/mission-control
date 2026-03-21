# Build Agent Hierarchy + Persona Catalog UI

## Summary
Ship a Mission Control /personas tab that displays every agent persona with live queue status, responsibilities, and deep links so ops can see who is idle vs overloaded at a glance.

## Definition of Done
Responsive /personas page launched with persona cards for Henry, Steve, Splitter, Spy, Sweeper, Janet, Atlas; cards pull queue counts/status from Supabase; filters for Active/Idle/All work; CTA filters the task board; telemetry events recorded when the tab/cards are used.

## Acceptance Criteria
- Left-nav entry + /personas route renders without breaking existing navigation
- Persona cards show emoji, short mission statement, queue length, and primary tools
- Active/Idle/All filter toggles update the grid without reload
- Card CTA appends ?agent=<initials> filter to the board view
- Supabase query or RPC returns queue counts with <300ms latency
- logActivity events fired for tab view and card clicks

## Handoff Actions
1. Create static persona metadata JSON (emoji, mission, tooling) that can be moved to Supabase later
2. Build Supabase view or RPC combining agent_health_status + tasks for queue stats
3. Implement PersonaFilters + AgentCard components with Storybook stories
4. Add telemetry hooks to logActivity
5. QA on desktop + tablet breakpoints and document how to add new personas
