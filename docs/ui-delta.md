# UI Delta – Preview vs 15:00 Spec

_Source preview_: https://mission-control-emg8-62jbnfr3q-natejav88237-7980s-projects.vercel.app  
_Source spec imagery_: docs/reference/ui-15min-*.jpg

## Layout Owner (src/app/page.tsx)
1. **Missing sidebar + grid entirely**  
   - Issue: Preview shows top nav buttons only; sidebar and three-column layout absent.  
   - Fix: Implement structure per Issues L1–L3 using CSS grid and sidebar markup from spec.
2. **No header/search/controls**  
   - Issue: Spec requires header bar with title, search, pause toggle, avatar; preview lacks these elements.  
   - Fix: Add header container with specified controls before metrics strip.
3. **No metrics/filter rows**  
   - Issue: Spec lists metrics chips and filter row; preview missing.  
   - Fix: Create placeholder components for metrics + filters, place between header and columns.
4. **Footer SHA badge missing**  
   - Issue: Spec requires commit hash footer; preview lacks.  
   - Fix: Add footer with `process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` fallback.
5. **Spacing mismatch**  
   - Issue: Buttons cramped at top; spec needs 24px gutters and full-height sections.  
   - Fix: Apply padding/margins consistent with spec (see docs/ui-15min-spec spacing.

## Widget Builders (components/widgets/*)
1. **Backlog cards absent**  
   - File: components/widgets/BacklogColumn.tsx (new).  
   - Fix: Build 4-card list per spec with owner chips, source icons, timestamp meta.
2. **In-progress column missing**  
   - File: components/widgets/InProgressColumn.tsx (new).  
   - Fix: Implement card list with purple status dot and avatars.
3. **Live activity feed missing**  
   - File: components/widgets/LiveActivityFeed.tsx (new).  
   - Fix: Create list of activity entries with icon, message, timestamp.
4. **Metrics strip absent**  
   - File: components/widgets/MetricsStrip.tsx (new).  
   - Fix: Build three-stat layout plus completion percentage per spec colors.
5. **Filter row missing**  
   - File: components/widgets/FiltersRow.tsx (new).  
   - Fix: Add "New task" pill, agent chips (Alex/Henry), project dropdown.

## Styling Sheriff
1. **Typography mismatch**  
   - Issue: Current fonts default to system sans; sizes differ.  
   - Fix: Import Inter, set sizes weights as spec (see Typography section).
2. **Color palette incorrect**  
   - Issue: Buttons use grey backgrounds; need gradient/glassmorphism colors (#050505 background, card #16171E).  
   - Fix: Apply Tailwind/custom classes aligning to spec.
3. **Border radius/shadows absent**  
   - Issue: Buttons lack 16px radius and glow.  
   - Fix: Add radius and box-shadow tokens from spec.
4. **Iconography**  
   - Issue: Buttons use emoji; spec requires consistent line icons.  
   - Fix: Replace with lucide-style icons or placeholders matching spec once layout ready.

No code changes performed here (docs-only).
