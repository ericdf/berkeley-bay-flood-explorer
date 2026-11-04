# Guided and expert modes

Eric's request and decisions: SOURCE_NOTES E14. Mockup: `docs/design/mockup/index.html`
(published privately for review as a claude.ai artifact).

## The problem

The page answers one question: pick a level, see what is wet. A resident asks the reverse: does
the water ever reach my street, the freeway or the contaminated sites, and when? Answering that
today takes sweeping 18 levels and comparing results by memory. Everything is also on screen at
once: the left column holds the scenarios, slider, map key, four overlays, rain, plan and sites,
and the results are split between a right column and a full-width section below the map.

## Guided mode (the default)

The page opens on "What do you want to know?" with question cards:

1. Could Bay flooding reach my home or street? (address, or the phone's location)
2. When could flooding reach contaminated ground and carry it into the Bay?
3. Which roads and rail corridors could be exposed: I-80, its ramps, the roads to the Marina, the rail line? (Exposure of the ground, not closure; E17.)
4. What will this winter's king tides reach?
5. What do the City's flood plans protect, and what do they leave out?

Each answer leads with a finding, then gives each place a ladder: the most frequent water that
reaches it today, then by 2050 and by 2100, counting how many of the three sea level estimates
reach it. Each line of the ladder sets the map to that level. A scale shows where the place's
threshold sits among the named levels. "Show the numbers" reveals the levels in ft NAVD88 and
their provenance. Every answer ends with a link into expert mode at the same view.

The answers come from `data/thresholds.json` (tools/thresholds.mjs, SOURCE_NOTES C23): the first
level at which the fill reaches each site, road group and street, and per-cell rasters for
addresses. A threshold is the existing model rule read the other way, so every answer can be
checked by setting expert mode to that level.

Two pathways are kept apart wherever they differ: over the ground from the Bay, and up the storm
drains with every outfall open (D6). The drain caveat appears once per answer, where it applies.

### Plain-language levels

| Level (ft NAVD88) | Guided text |
|---|---|
| 6.20 | An ordinary high tide, almost every day |
| 7.40 | This winter's highest tide (Dec 24), about once a year |
| 8.16 / 8.47 | A storm tide, about a 20% / 10% chance each year |
| 9.73 | A severe storm tide, about a 1% chance each year |
| 10.91 | An extreme storm tide, about a 0.2% chance each year |
| 10.70 / 10.73 / 11.03 | 2050's severe storm tide, under the three estimates (City 2018; State 2024 Intermediate-High, High) |
| 9.40 | An ordinary high tide in 2100, City estimate |
| 13.00 / 14.53 / 16.23 | 2100's severe storm tide, under the three estimates |

Sensitivity tests, the quoted 12 ft and the model thresholds stay in expert mode.

### Address lookup

The typed address goes to the U.S. Census Bureau geocoder (E14); nothing is stored. "Use my
location" fills in the box from the phone and stays on the device. The point is looked up in
`first-bay.u8` and `first-drain.u8` within a small radius. An address outside the terrain grid,
or never reached by 16.50 ft NAVD88, gets "None of the water levels here reach this address,
including the highest estimate for 2100." Ground only: floor heights are not published.

## Expert mode

Every current control stays, rearranged:

- Two columns: a control rail and the map. The map's default view fits the waterfront to the
  width, so a wide screen is not half empty.
- Rail sections collapse; only the water level starts open, with its scenario list.
- The map key floats on the map and lists only the layers drawn.
- Results move into a tabbed box on the map: Summary, Streets, Sites, Gaps, Method. Nothing sits
  below the page. "Why these maps disagree" moves to Method.
- Source codes (W11, C6) become hover notes linked to the source list; terms of art (NAVD88,
  connected fill, still water) get hover definitions.
- On a phone: map first, then a pull-up panel.

## Eric's review of the mockup (2026-11-04)

Guided mode is promising; layout and phone use need a real build to judge. Changes for the build:

- **"Explain this" links** that open a short note, in expert mode wherever a reader meets a term or
  a choice without context. First case: the published maps to compare (ART, ART disconnected areas,
  CoSMoS, the tsunami area), each with one or two sentences on what it is and how it differs.
- **Tsunamis in the opening text**, with an "Explain this" note: water comes in over the shoreline,
  up the storm drains and from rising groundwater; rain that cannot drain out pools in low streets;
  water going out, in a tsunami's drawdown or a flood's retreat, can carry contamination into the
  Bay; and these can happen together. Proposed opening (E13's text plus tsunamis): "Explore how
  storm tides, tsunamis, sea level rise and heavy rain could affect west Berkeley's streets,
  critical infrastructure, I-80, pollution sources and the Bay shoreline. Not a flood forecast."
- **Section labels in expert mode** say what the section does:

  | Was | Proposed |
  |---|---|
  | Water level | How high the Bay rises |
  | (selected) "1% storm tide today" | "Rare storm tide, at today's sea level (1% chance each year)" |
  | Rain on this tide | Add a rainstorm during the high water |
  | Plan | Flood defenses: walls, raised roads, tide gates |
  | Published maps to compare | Compare with official flood maps |
  | Sites | Polluted and hazardous sites: what if they are moved or cleaned up |

  "Today" in a level's name always means today's sea level, never today's weather.

## Built (2026-11-04, E15)

- `index.html`: the mode switch; guided mode by default (a link carrying expert settings and no
  mode opens in expert mode); in expert mode the control column, the map at the width its terrain
  needs for the window's height, and results in two tabs beside it; collapsible sections with the
  new labels; "Explain this" notes on the opening text, the water level and each published map;
  the map key on the map, listing only what is drawn. On a phone the map stays at the top.
- `js/guided.js`: six questions (address, contaminated sites, roads and rail, king tides,
  tsunami, defenses). Each answer line sets the map to that level; a place's name shows it on the
  map. The address lookup uses the Census geocoder by JSONP and looks up the two rasters within
  12 m of the point.
- The rail line (C24) is drawn and counted in expert mode's critical services.
- `js/share.js`: the mode and the guided question are kept in the link; an address never is.
- Guided mode's map uses no defenses, no rain and no site choices, the settings its answers were
  computed with; expert settings are kept and return in expert mode (Codex review, PR #14).

## Order of work

1. This mockup, for Eric's reactions.
2. The rail line from OpenStreetMap, checked like the streets (E14).
3. Layout: two columns, collapsible rail, floating key, tabbed results.
4. Guided mode: questions 2, 3 and 4 from `thresholds.json`.
5. Address lookup.
6. Question 5, plans, using the existing presets.
7. Copy throughout, to STYLE.md.
