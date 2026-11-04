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
3. When does flooding close I-80, its ramps, the roads to the Marina or the rail line?
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

## Order of work

1. This mockup, for Eric's reactions.
2. The rail line from OpenStreetMap, checked like the streets (E14).
3. Layout: two columns, collapsible rail, floating key, tabbed results.
4. Guided mode: questions 2, 3 and 4 from `thresholds.json`.
5. Address lookup.
6. Question 5, plans, using the existing presets.
7. Copy throughout, to STYLE.md.
