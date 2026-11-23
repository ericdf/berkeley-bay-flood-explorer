# Civic Insight and Action — implementation specification

Status: proposed implementation, 2026-11-10. Audience: Claude/code implementer. Repository: `ericdf/berkeley-bay-flood-explorer`.

## 0. Mission and constraints

Evolve the Berkeley Bay Flood Explorer from an expert-led scenario viewer into a **rapid civic insight, evidence, choice, action, and accountability** experience. A first-time resident should understand one consequential finding in 15 seconds, inspect its evidence, identify a meaningful civic decision or evidence gap, and share a precise request in under two minutes.

**Do not replace the underlying explorer.** Preserve existing scenario controls, flood algorithms, comparisons, URLs, citations, warnings, and expert workflows. Add a guided layer above them. Preserve the existing educational disclaimer: not a forecast, official hazard map, engineering design, or emergency decision tool.

**Critical principle:** The app must not transform modeled possibilities into factual claims, assume a proposed intervention works, manufacture a deadline, or imply that an agency has adopted a decision without evidence. Advocacy requests should be grounded in verifiable facts, and alternative responses should be represented fairly.

### Definition of success
- New visitors can answer: what is at risk, what the model actually shows, what is uncertain, who could address it, and what to do next.
- Every public claim is traceable to a scenario and source/assumption.
- Each story can be opened directly and shared; the same model state is reproducible.
- A visitor can copy an evidence brief without losing uncertainty qualifications.
- A visitor can see the status of a civic request and its documented outcome.
- Existing expert-mode behavior and calculations remain unchanged.

## 1. Existing implementation and integration points

Repository README documents a dependency-free static site served from the `pages` branch. Existing core assets include:
- `data/scenarios.json`: scenario levels and provenance.
- `data/terrain/dem.i16` and `js/fill.js`: connected fill versus disconnected low ground.
- `js/rain.js`: illustrative rain storage.
- `js/plan.js` and `data/plans.json`: barriers, raised roads, tide gates, custom walls.
- `data/drains.json`: modeled drain links; locations are approximations, not surveyed outfalls.
- `data/sites-checked.json`, `data/streets.json`, ART hazard layers and existing source notes.
- `SOURCE_NOTES.md`, `DATA_INVENTORY.md`, `specification.md`, `docs/design/levers-and-drains.md`.
- `node tests/check.mjs` and `node tools/report.mjs`.

Before coding, inspect the actual HTML/JS UI entry points, hash parser, renderer, scenario-state API, and deploy workflow; the above is a documented architecture, not a claim about undiscovered function names. Extend rather than duplicate the state engine. The current shared URL example `#sc=y100&mode=expert` must continue to work.

## 2. Information architecture

Primary navigation:
1. **Discover** (default for new visitors): curated issue cards, concise headlines and implications.
2. **Explore**: full existing interactive map with simplified controls and an obvious "Expert controls" toggle.
3. **Decisions & actions**: issues with named responsible agencies, documented decisions, public actions, status, and dates.
4. **About the evidence**: model explanation, source notes, uncertainty taxonomy, methodology and changelog.

A persistent, unobtrusive "Explore full model" link is present in all stories. Do not introduce mandatory registration, modal onboarding, or a paywall.

### New-visitor homepage
- One sentence: "Where could high Bay water affect Berkeley—and what can residents do about it?"
- Four editorially curated cards (initial candidates): West Berkeley access; high tides and storm drains; contaminated-site exposure; comparing shoreline responses.
- Each card has a question, one-sentence stakes, location, evidence-status label, and "Explore finding".
- Cards must not assert a result that the app has not validated. Unsupported cards may be labeled "Question under investigation" and open an evidence-gap page.
- A compact link to the existing expert explorer.
- No animated hero, autoplay, or heavy imagery required for initial paint.

## 3. Five-stage guided story

Each story uses the same ordered sections:
1. **Discover:** headline, one map view, one-sentence observation.
2. **Understand:** affected assets and implications, distinguishing physical exposure from actual damage/service loss.
3. **Evaluate:** assumptions, source links, model-versus-observation, uncertainty and competing evidence.
4. **Decide:** plausible interventions or research alternatives, tradeoffs, known costs and jurisdiction.
5. **Act:** a specific, non-misleading request tied to a named authority; evidence brief; status and follow-up.

Use a progressive disclosure layout. First screen must not expose dozens of controls. Story sections can advance by scrolling or explicit next/previous buttons; controls must work with keyboard and reduced motion.

### Guided map contract
Each step may specify viewport/bounds, scenario ID or exact level, rain parameters, plan selection, layer visibility, selected asset, annotation, and optional comparison baseline. Transition must reuse the existing rendering/state functions and be reversible. Provide a visible "What changed?" sentence. Never interpolate water levels as a visual animation that appears to model time or forecast dynamics. If a step's requested layer is missing, show a clearly labeled unavailable state, not a substitute visualization.

## 4. First vertical slice: storm-drain backflow

**Editorial question:** "Can high Bay water interfere with Berkeley's storm drainage?"

This is the first complete story to implement, including evidence, action, and tracking. It must distinguish:
- **Bay water entering drains:** hypothetical upper-bound connectivity when outfalls have no functioning gates, using the existing watershed/inlet rule.
- **Rain unable to drain:** illustrative rainfall storage when outlets are tide-restricted, using existing `js/rain.js`.
- **Actual drainage performance:** unknown without verified pipe networks, outfall invert elevations, gate inventory/condition, capacity, timing and field observations.

The repository's `docs/design/levers-and-drains.md` says mapped inlet locations exist but pipes, surveyed outfalls, invert elevations, and gate status are not published in its available data. Do **not** display the modeled links as verified physical outfalls or claim gates are absent. The model pools runoff at one low inlet per watershed and can overstate local depth while missing other ponds. The runoff coefficient approach is exploratory.

#### Story steps
1. Orient to the Bay, West Berkeley, I-80 and relevant low-lying watersheds.
2. Select an existing sourced high-water scenario; show connected Bay inundation and separately shaded disconnected low ground.
3. Turn on the modeled "Bay through drains" pathway; explicitly identify its assumption of open links and upper-bound nature.
4. Contrast "gates modeled closed" with "gates modeled open"; say this is a sensitivity test, **not** a verified comparison of current City infrastructure.
5. Add one documented NOAA Atlas 14 rainfall setting and the selected fraction unable to drain; describe the one-pool-per-watershed simplification.
6. Show the specific missing evidence needed to judge actual performance.
7. End with a civic request: publish storm-drain outfall inventory, gate locations/condition, invert elevations, drainage studies and maintenance records; identify Berkeley Public Works as the initial inquiry target, subject to verification.
8. Show request status: initially "proposed / not submitted" unless an actual request or public record is linked.

#### Acceptance criteria
- All displayed values are pulled from existing model state, never hard-coded mock results.
- Rain, drains, and gate states are named distinctly; a gate-closed run is not labeled "flood protection achieved".
- Source references and limitations are visible before copying the brief.
- The story works on narrow mobile screens.
- The action request works without any personal information or third-party service.

## 5. Other initial stories (editorial shells first)

### West Berkeley access
Investigate possible impacts on I-80, ramps, frontage roads, Marina and east-west access. Distinguish ground elevations from elevated road decks and actual closure thresholds; bare-earth lidar can remove bridges. Do not state a road will close merely because a grid cell is wet. Use `DATA_INVENTORY.md` to flag missing Caltrans deck/crest data. Show "potential exposure" until verified.

### Contaminated sites and facilities
Map sites from existing `data/sites-checked.json` and source notes. A mapped site in a low area does not imply toxic release, active contamination, or regulatory noncompliance. Show site identity, status/date/source when known and an explicit "release risk not assessed". Action should request site-specific flood vulnerability review from the relevant verified regulator.

### Shoreline response choices
Compare existing City-study wall/raised-road presets and no-plan at the same water level; show flanking, overtopping, plan assumptions and trace accuracy (roughly ±30 m per existing design note). Costs from 2019 must be labeled historic, not current estimates. No default "winner". Include nonstructural approaches and "insufficient data" when not modeled.

No story may publish an unverified numeric headline or claim that its preferred policy is proven by this model.

## 6. Content and data contracts

Create a versioned, schema-validated static editorial data layer; use JSON unless existing code conventions strongly favor JS modules. Suggested paths:
- `data/civic/stories.json`
- `data/civic/issues.json`
- `data/civic/actions.json`
- `data/civic/updates.json`
- `data/civic/schema.json` (or equivalent validator)
- `docs/civic/editorial-policy.md`

Story fields: `id`, `slug`, `title`, `dek`, `status`, `locationLabel`, `steps[]`, `issueIds[]`, `updatedAt`, `reviewedBy`. Step fields: `id`, `stage`, `heading`, `body`, `mapState`, `claimIds[]`, `caveats[]`, `sourceRefs[]`. Map state should reference canonical existing scenario/plan IDs and use typed, validated optional settings, not executable expressions.

Claim fields: `id`, `text`, `evidenceClass` (`observed`, `published-model`, `exploratory-model`, `inference`, `unknown`), `sourceRefs[]`, `scenarioState`, `limitations[]`, `verifiedAt`. No quantitative claim without provenance and reproducible parameters.

Issue fields: `id`, `question`, `responsibleAgencies[]`, `decision`, `alternatives[]`, `evidenceGaps[]`, `status`, `sourceRefs[]`, `updatedAt`. A responsible agency must be sourced or marked tentative.

Action fields: `id`, `issueId`, `type` (`records-request`, `comment`, `meeting`, `subscribe`, `share`), `recipientName`, `recipientUrlOrEmail`, `requestedOutcome`, `deadline`, `deadlineSource`, `status`, `sourceRefs[]`, `reviewedAt`. Dates nullable; never invent them.

Update fields: `id`, `issueId`, `date`, `eventType`, `summary`, `sourceRefs[]`, `statusBefore`, `statusAfter`. Append-only editorial history where feasible.

Every source reference must resolve to existing `SOURCE_NOTES.md` entries or a documented URL with title, publisher, publication date, access date, and relevant passage/section. Avoid silently changing the existing source-note identifier scheme.

## 7. Evidence briefs and sharing

Add a one-page **evidence brief** renderer from validated story/claim/issue data:
- Headline and date reviewed.
- The concern and why it matters.
- "What the explorer shows" with scenario level, datum (ft NAVD88), source, layer, model assumptions, plan and rain settings.
- "What it does not establish" (prominent, never omitted).
- Alternatives / unresolved evidence.
- Specific civic request, agency and current status.
- Source links, app permalink and methodology disclaimer.

Implement "Copy brief" (plain text), "Copy link", and print-friendly HTML via CSS. PDF export is optional, not MVP. Sharing must preserve scenario/plan/rain/viewport and story step. On reopening a permalink, restore the same state or show a meaningful "scenario no longer available" message with version metadata. Avoid links that silently fall back to different model assumptions.

Copy text must be generated from the same data as the visible brief. No fabricated citations, numbers, contact details, decisions, or deadlines. The user may edit text after copying.

## 8. Civic decisions and action tracking

A decision page should show:
- What public body has authority (and how verified).
- What decision, study, request, or records gap is actually pending.
- Alternatives and known tradeoffs, including a "do nothing / gather evidence" option where relevant.
- Current status, dated source, deadline (if sourced), and last checked.
- One or two relevant actions: copy a respectful request, visit official comment portal, attend an actual meeting, or share evidence.
- A chronological, sourced accountability log: request made, acknowledgment, documents released, agency response, meeting, decision, follow-through.

Status vocabulary: `investigating`, `proposed`, `submitted`, `acknowledged`, `under-review`, `decided`, `implemented`, `closed`. Show "not verified" rather than guessing.

For MVP, maintain updates as reviewed static JSON committed to Git. Do not imply that copying a letter sends it. Only show "submitted" when a verifiable submission is recorded. No petition counts or claimed civic impact without evidence. External links must be verified before publication.

## 9. Technical implementation

### Architecture
- Keep dependency-free static deployment if practical; no server or database required for MVP.
- Add modular `js/civic/` components for data validation, routing, story renderer, map-state adapter, evidence brief and decision log. Names may be adjusted to actual code layout.
- Adapter translates story `mapState` into the existing canonical state setter and URL encoder; do not fork flood computations.
- Load editorial JSON lazily for Discover/Decisions; keep expert map usable even if civic JSON fails.
- Preserve all existing `#sc=...&mode=expert` deep links and browser back/forward behavior.
- Proposed hash scheme: `#view=story&story=drain-backflow&step=2&sc=...&...`; use a canonical encoder, URL-escape values and reject unknown IDs. If existing hash logic conflicts, choose a compatible scheme and document it.
- Add schema validation in `node tests/check.mjs` or a separate `node tests/civic-check.mjs`, with no unnecessary dependency.
- Prevent HTML injection from editorial content. Treat external URLs and query/hash state as untrusted.
- Cache/static assets must not show stale action deadlines without a "last reviewed" indicator.

### Accessibility and responsive behavior
- WCAG 2.2 AA target; semantic headings, labeled controls, focus management, visible focus, accessible map descriptions, keyboard navigation, 200% zoom, contrast, reduced-motion support.
- At 320px viewport no horizontal overflow; map and prose can stack. Buttons large enough for touch. Do not rely on color alone for flood categories or evidence status.
- Text-only story and brief remain meaningful if the map fails to load.

### Performance and privacy
- First meaningful text on mobile should load without terrain tiles or full model initialization; lazy-load heavy map assets when needed.
- No new tracking, accounts, user geolocation, mailing-list capture, or third-party scripts in MVP.
- If analytics are later added, require an explicit privacy decision and publish what is collected.
- Do not collect addresses or infer property-specific risk from an approximate map.

## 10. Editorial safeguards

Use concise, non-alarmist language. Distinguish `could`, `is modeled to`, `has been observed`, and `will`. Never turn "low, not connected" into "flooded". Explain that wave runup, groundwater, dynamic flow, drainage capacity, and duration are outside relevant simplified calculations. Keep published ART comparisons and model disagreements discoverable.

A claim requiring data not held in the repo must be shown as a question or evidence gap. For contested interventions, summarize meaningful alternatives and limitations rather than presenting the desired action as a scientific conclusion.

Each story has a review date, owner, source inventory and an explicit publish checklist. Time-sensitive action pages should automatically display "check current details" after their review window expires; do not silently keep an expired action live.

## 11. Delivery phases and task breakdown

### Phase A — foundation
1. Audit actual UI, state, routing and existing test/deploy mechanisms.
2. Implement civic data schema, validation and fixtures.
3. Implement new Discover landing with four honest editorial cards.
4. Preserve expert and legacy deep links; add route tests.
5. Implement generic story shell with progressive sections and text-only fallback.

**Exit:** new visitor sees Discover; old URL behaves exactly as before; invalid content fails validation.

### Phase B — complete storm-drain slice (highest priority)
1. Author and source the drain-backflow story using existing model data and SOURCE_NOTES.
2. Implement map-state adapter, state comparison, step navigation and permalinks.
3. Add visible uncertainty labels, scenario provenance and missing-data panel.
4. Add a civic issue and proposed records request with verified agency link.
5. Implement brief generation, copy and print, plus static issue status log.
6. Validate on desktop and mobile; review every scientific claim.

**Exit:** user can discover, inspect, compare, evaluate, copy and track the request end-to-end; no fabricated factual assertions.

### Phase C — breadth
1. Add access, contaminated-site and shoreline-response stories after claim audit.
2. Add issue index, status filters and chronology.
3. Add print-friendly layouts and source crosslinks.
4. Add editorial maintenance checklist and update workflow.

### Phase D — optional later
- Subscription/update delivery (requires explicit provider, consent and privacy plan).
- Neighborhood-specific summaries only after verifying spatial accuracy and avoiding address-level overclaiming.
- More sophisticated intervention comparisons only with validated engineering and cost sources.
- Civic impact metrics only with trustworthy attribution and privacy safeguards.

## 12. Test plan and release gates

Automated tests:
- All story, step, issue, action, claim and source IDs unique and resolvable.
- All scenario/plan IDs and map parameters valid and within existing model constraints.
- All numeric claims contain scenario provenance and caveats.
- No action with a deadline lacks a dated source; no unverified email/URL.
- Every story has a reviewed date and at least one uncertainty statement.
- URL encode/decode round-trip, including legacy expert links and browser history.
- Copied brief contains same source IDs, datum, assumptions and limitations as rendered brief.
- Missing civic JSON leaves expert explorer functional.
- Existing `node tests/check.mjs` passes unchanged; compare selected pre/post model outputs to detect accidental scientific regressions.

Manual QA matrix: iPhone-size narrow screen, tablet, desktop; keyboard-only, screen reader smoke test, reduced motion, offline/failed editorial JSON, malformed hash, long copy, print, direct permalink, back/forward. Check that no map legend implies greater certainty than the text.

Editorial acceptance:
- A nonexpert can explain the main issue in 15 seconds.
- An informed skeptic can reproduce the scenario and find the contrary evidence or limitations.
- A copied civic request is specific and factual, not an alarmist boilerplate appeal.
- No deadline or submission status is invented.
- A user can always return to the existing expert explorer.

## 13. Implementation instructions for Claude

1. Read `README.md`, `specification.md`, `SOURCE_NOTES.md`, `DATA_INVENTORY.md`, `docs/design/levers-and-drains.md`, UI source and existing tests first.
2. Record a brief architecture audit and any conflicts with this specification in `docs/civic/implementation-notes.md`.
3. Implement Phases A and B before breadth. Prioritize a **complete** storm-drain vertical slice over polished empty cards.
4. Make incremental commits with meaningful messages; run existing checks after each change. Do not rewrite scientific algorithms merely to simplify the new UI.
5. If missing data prevents a claim, implement the evidence-gap state rather than guessing.
6. Deliver a summary of changed files, tests run, unresolved evidence gaps, and links to example story and expert permalinks.
7. Do not deploy to the live `pages` branch until all release gates pass and the owner reviews the editorial claims.

## 14. Out of scope for initial delivery

AI-authored letters, mass-email sending, petition infrastructure, political targeting, fundraising, accounts, live agency scraping, automatic deadline discovery, geolocation, property-level risk scores, predictive loss modeling, and unverified flood forecasts. They are not prerequisites for useful public education and informed civic action.
