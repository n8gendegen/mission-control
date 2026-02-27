# Mission Control UI – 15:00 Reference Spec

_Source imagery: [Full](./reference/ui-15min-full.jpg) · [Left rail](./reference/ui-15min-left.jpg) · [Main](./reference/ui-15min-main.jpg)_

## Layout Map
- **Canvas**: 1181×760 screenshot (approx 16:10); full-bleed dark background (#090909).
- **Sidebar**: fixed 240–260 px width on the left with stacked nav; spans full height, top padding 24 px.
- **Header bar**: 64 px tall horizontal strip above main content with product name ("Mission Control"), search box, pause toggle, avatar.
- **Main grid**: three columns within remaining ~920 px width.
  - Column A (Backlog): width ~280 px.
  - Column B (In Progress): width ~280 px with 32 px gutter.
  - Column C (Live Activity): width ~260 px on the right with 32 px gutter.
- **Row stack**: top metrics row (counts + dropdowns) sits between header and cards with 16 px top margin.

## Component Inventory
1. **Sidebar navigation list**: icons + text for Tasks, Content, Approvals, Council, Calendar, Projects, Memory, Docs, People, Office, Team, plus user avatar at bottom.
2. **Header actions**: product title, search field (with CMD/), Pause toggle, Ping action, settings glyph.
3. **Metrics strip**: three stats ("3 this week", "3 in progress", "25 total") plus completion percentage ("40% Completion").
4. **Filters row**: "New task" button, agent chips (Alex, Henry), project dropdown.
5. **Backlog column**: list of four cards with title, description, owner chip, source icon (YouTube, Clawdbot, Agents, etc.), and "X days ago" timestamp.
6. **In Progress column**: three similar cards with purple status dot and owner avatar initial.
7. **Live Activity feed**: vertical list of compact activity items showing agent name, message text, and timestamp.

## Typography
- **Base font**: Inter or similar grotesk (geometric sans).
- **Header (Mission Control)**: 18 px, medium weight (#F4F4F5).
- **Sidebar labels**: 15 px normal weight (#C8CBD2), uppercase first letter.
- **Section headings (Backlog, In Progress, Live Activity)**: 13 px uppercase, letter spaced (#8F93A1).
- **Card titles**: 16 px semibold (#F8F8F8).
- **Card body**: 13 px regular (#A9ADB9).
- **Meta text (days ago, owners)**: 12 px (#7B7F8C).

## Color & Visual Tokens
- **Background**: #050505 to #0B0B0F gradient (very dark neutral).
- **Sidebar**: #0E0F13 with highlight for active item (#1E1F24) and accent bar (#6C63FF).
- **Card background**: #16171E with subtle inner shadow; border radius 16 px; border #1F2028 1 px.
- **Accent colors**:
  - Green metrics ("3 this week"): #56F39A.
  - Blue metrics ("3 in progress"): #63A2FF.
  - Purple completion: #A786FF.
  - Tag dots (YouTube red #FF4F56, purple #A06BFF, teal #4FE0C9, amber #F5A65B).
- **Buttons**:
  - "New task" pill: #5d5bff background, text #FDFDFF.
  - Active agent chip: text #FDFDFF, background #252636.

## Spacing & Corners
- **Card padding**: 20 px horizontal, 18 px vertical.
- **Grid gaps**: 24 px vertical between cards; 32 px horizontal between columns.
- **Sidebar item spacing**: 10 px between icon and label, 18 px between rows.
- **Corner radius**: 16 px on cards/buttons; 12 px on sidebar highlight; 999 px on chips.
- **Shadow/Glow**: cards have soft outer glow (0 12 px 24 px rgba(0,0,0,0.55)).

## Interactive States
- **Sidebar selected item**: left accent bar (3 px), background #1D1E25, text color #F8F8F8.
- **Hover states**: lighten background by +0.05 (#1B1C23) and elevate shadow.
- **Tab/status dots**: small filled circle (8 px) preceding column labels with color-coded state (green backlog, purple in progress, amber review if present).
- **Live activity items**: highlight border on hover (#272733) with pointer cursor.
- **Search field**: dark rounded rectangle with keyboard shortcut pill (#1F1F28, text #888BA0).

## Assets & Icons
- **Navigation icons**: duotone line icons resembling Hard-edge (Lucide-esque) with 20 px bounding box, single-color #8F93A1.
- **Status dots**: solid circles (8 px) with per-state colors.
- **Owner chips**: circular avatars (20 px) with initials.
- **Activity channel icon**: checkmark-in-circle glyph (#42D58A).
- **Charts**: none visible in this timestamp; all cards are text-based.

## Implementation Notes
- Use CSS grid: `grid-template-columns: 1fr 1fr 0.9fr` inside main area with column gap 32 px.
- Keep header fixed height (64 px) with `display:flex; align-items:center; gap:16px`.
- Sidebar uses `flex-direction:column; justify-content:space-between` with avatar button anchored bottom-left.
- Apply `backdrop-filter: blur(16px)` to header/buttons for glassmorphism feel.
- For metrics row, set `display:flex; gap:24px` with vertical separators suppressed; percentages use gradient text (#66F0BD→#A786FF).

## Acceptance
- Deliverables limited to `/docs` and `/docs/reference`.
- Spec + three screenshots included in commit.
- Use in PR titled `spec: UI 15:00 reverse spec` with screenshots embedded in body.
