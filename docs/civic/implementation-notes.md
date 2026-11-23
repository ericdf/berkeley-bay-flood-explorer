# Civic stories: implementation notes

Status: Phases A and B of `insight-and-action-spec.md`, built 2026-11-10 (SOURCE_NOTES E29). Not
published: `pages` changes only when Eric approves a publish.

## Calls made without asking (all reversible; for Eric's review)

Story text follows the council project's style guide (`berkeley-council-analysis/docs/STYLE.md`; Eric, 2026-11-10): findings first, with no denial-first or "X, not Y" sentences and no narration of what the page claims. The standing "Not a flood forecast" line stays, as CLAUDE.md requires.

Eric asked for these calls to be made and reported back (E29).

1. **Built on `main`.** dedd762, where the spec was committed, is a snapshot of the
   repository from before 2026-11-04. It has no parent and sits alone on a branch
   (`claude/affectionate-rubin-0rz24y`). It lacks guided mode, share links, the rail line and
   everything merged since, about 110,000 lines in 280 files. The spec's requirement that
   `#sc=y100&mode=expert` keep working only holds on `main`. The spec file was copied over unchanged.
2. **Stories extend guided mode.** Guided mode (E14, E15) already answers
   resident questions with a map per answer. The spec's "Discover" page is guided mode's question
   list. A "Follow a question through its evidence" block is added below the questions. Three of the
   spec's four cards already exist as guided questions: roads and rail (West Berkeley access),
   contaminated ground (contaminated sites) and flood defenses (shoreline responses). They stay as
   they are and are not yet rebuilt as five-stage stories (Phase C). The page's headline is
   unchanged; the spec's suggested sentence was not adopted, because the opening text is Eric's (E15).
3. **The drain story ends by asking for a change.** The first draft
   ended with a records request for readers to send. Eric rejected it: "No records requested.
   Limit yourself to available data sources. Asking for records is not change advocacy which is
   our goal" (E30). The story now points to two City projects found in `berkeley-public-records`
   (D11). The first is the Stormwater Master Plan: Public Works, January 2024 to December 2026,
   $2,000,000, with an updated hydraulic model; its published description does not mention Bay
   tides or sea level rise. The second is the Aquatic Park Tide Tube Replacement and Dredging
   Project, funded by a $4,122,000 California Transportation Commission grant. The Council adopted
   both in the FY 2027–2031 CIP on 2026-06-23. The comment readers can copy asks the plan to test
   the drains with a high Bay. It also asks for the new tubes to be able to close ahead of a storm
   tide while still draining rain. The options are listed with tradeoffs and unranked, including
   "proceed as scoped". Its numbers come from the model through a claim, like the story's. The
   schema rejects any records request. The call left to Eric is the comment's two asks, which are
   advocacy positions.
4. **Navigation stays as it is.** Guided and Expert remain the two modes. "Decisions and actions" is
   a link from the guided home, and "About the evidence" links to `SOURCE_NOTES.md`. There is no
   four-tab bar. A tab bar would add a control to every page (E25: keep the page simple).

## Architecture audit (as found on `main` at 8e690d7)

- **Entry:** `index.html` loads `js/main.js` as a module. `main.js` loads every data file, then
  builds the controls, the map and guided mode (`js/guided.js`).
- **State:** `ui` in `main.js` holds the mode, the guided question and the expert plan, rain and
  site choices. `render(levelFt, sc)` runs `analyze()` (`js/analyze.js`) and draws. Guided mode's map
  ignores expert settings (Codex, PR #14).
- **URL:** `js/share.js` `encodeView` and `decodeView`. `writeView` rewrites the hash with
  `history.replaceState` on every render. On load the hash is applied once. A `hashchange` that the
  page did not write reloads the page. A link with no `mode` opens in expert mode.
- **Tests:** `node tests/check.mjs` (model and guided text). There is no CI workflow. Each PR is
  reviewed by Codex (AGENTS.md).
- **Deploy:** GitHub Pages serves the `pages` branch, which is pushed only on Eric's approval.

## What was added

| Spec item | Where |
|---|---|
| Civic data layer (§6) | `data/civic/stories.json`, `claims.json`, `issues.json`, `actions.json`, `updates.json` |
| Schema validation | `js/civic/schema.js` (browser and Node, no dependencies); the page shows no story whose data fail |
| Story shell, five stages, step navigation | `js/civic/civic.js`, rendered in guided mode's panel |
| Map-state adapter | `ui.storyMap` in `js/main.js`; `render()` takes the step's scenario, drain display, tide gates and rain. It calls the same `analyze()` as expert mode, with the tide gate plan expert mode uses. |
| Numbers from the model | `js/civic/tokens.js` fills `{{tokens}}` from a model run at the claim's state. No number is stored in the story text. |
| "Drain pathway not shown" | `hideDrains()` in `js/civic/tokens.js`: drain cells drawn as the low ground they are before the drain rule runs. It is a display change; the fill is not touched (checked in `tests/civic-check.mjs`). |
| Evidence brief, copy, print | `buildBrief` builds one object. `briefText` and the HTML both render from it, so the copied text carries the same sources, datum and limitations. Print CSS is in `index.html`. |
| Decisions page and history | `#mode=guided&view=decisions`; the history comes from `updates.json`, append-only. |
| Permalinks | `#…&mode=guided&story=drain-backflow&step=4` (or `step=brief`). The scenario rides along in `sc`. A reader's step change adds a history entry, so Back and Forward work. An unknown story or step says it is not available and changes nothing on the map. |
| Text-only fallback | If the terrain or flood data fail, a story link still shows its text, with numbers marked "not available". |
| Tests | `node tests/civic-check.mjs`: schema, rejected bad data, token values, hidden-drain exactness, link round-trips (including `#sc=y100&mode=expert`) and brief contents. `node tests/check.mjs` passes unchanged. |

## Differences from the spec, and why

- **Hash scheme.** The spec proposes `#view=story&story=…&step=2&sc=…`. The page uses
  `mode=guided&story=…&step=…`, because `mode` already decides guided or expert and a story is a
  guided view. `view` is used only for `decisions`.
- **Viewport.** Steps fit the whole map. No step sets bounds yet, and pan and zoom are not kept in
  links, as before (js/share.js).
- **Comparison.** Step 4 compares gates closed with gates open in numbers, not as a two-color map.
  The plan "kept dry" color marks Bay-wet ground only, and gates do not change Bay-wet ground.
- **First paint.** Story text appears after the terrain loads, as guided mode's does. Loading the
  text first would mean splitting the page's start-up. That is left for later. Only the text-only
  fallback for failed data was built.
- **Claims have a separate file** (`claims.json`), so the same claim can serve a story and the brief.
- **Status vocabulary** is the spec's, and the page shows "Proposed, not sent" for `proposed`.
- **Action types** are the spec's minus `records-request` (E30).
- **No Explore/Decisions/About tab bar** (call 4).

## Open evidence gaps (the drain story)

Outfall locations and inverts, tide gate inventory and condition, pipe network and capacity,
observations at high tides, and Aquatic Park lagoon levels and gate settings (`data/civic/issues.json`;
D3, D5, D6, D8, D9). They stay listed as gaps. The comment asks the City's master plan to answer
the question they bear on, rather than asking for the records (E30).

## Links

- Story: `index.html#sc=mhhw&mode=guided&story=drain-backflow&step=1`
- Brief: `index.html#sc=y100&mode=guided&story=drain-backflow&step=brief`
- Decisions: `index.html#mode=guided&view=decisions`
- Expert, as before: `index.html#sc=y100&mode=expert`
- A step in expert mode: the story's "Explore this step in the full model" link sets the scenario,
  tide gates and rain, and clears walls and site choices.

## Not done (Phase C and later)

The access, contaminated-site and shoreline stories as five-stage stories; issue index filters;
an editorial maintenance workflow beyond `editorial-policy.md`. The spec's "15-second" and
screen-reader checks were not run with people or a screen reader, and keyboard-only and
reduced-motion use were not tested. The controls are native buttons, links and a textarea, and a
step change moves focus to the step's heading. In Chromium, the story was stepped through end to
end at 1400 px and checked at 320 px, with no horizontal scroll. The brief, the decisions page, an
unknown story link, Back after the brief, the old expert link and "Explore this step in the full
model" were checked too, with no console errors.
