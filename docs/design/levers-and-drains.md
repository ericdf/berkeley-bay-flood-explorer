# Plans (barriers, raised roads, tide gates) and storm drain backup: design note

Status: design note, 2026-11-03. Parts 1 and 2 are built; part 3 is proposed. Sources are
logged in `SOURCE_NOTES.md` (rows P1–P9, D1–D6); results in C9–C11. The explorer is an educational
comparison tool, not a flood forecast; that holds for every plan here.

## Summary

- **A plan changes the ground, never the water.** Each lever is a raised line on the grid:
  a wall, a raised road or a raised revetment, with a crest elevation in ft NAVD88. The fill
  treats a cell's ground as the higher of the lidar and the crest. Results show the plan
  against no plan at the same level, and say where water goes around the end of a wall or
  over its crest.
- **Presets come from the City's 2019 Marina study.** Its floodwall alignments for 2050 and
  2100 (Figures 5.7 and 5.8, traced from the figures), its raised Spinnaker Way and University
  Ave (Shoreline Zones 7 and 8), and its cost estimates. The study draws the floodwall crest as
  "varies"; the explorer sets it 2 ft above the design water level, the freeboard the study
  states for raised roads (an assumption). A reader can also draw a wall and set its crest.
- **Storm drain backup is two different floods, and the explorer treats them separately.**
  1. *Bay water up the drains* (no rain). An outfall without a tide gate lets the Bay into the
     pipes, and water comes up at the lowest inlets. Built here as a model rule: in a City
     watershed whose outfall is open, low ground below the level that contains a storm drain
     inlet is shown as "can fill through drains". A tide gate closes the outfall. This is an
     upper bound: it assumes the pipes connect every inlet to the outfall and that the storm
     lasts long enough to fill them.
  2. *Rain that cannot drain* while the Bay is high (the compound flood the transfer station
     Draft EIR describes for Second St). Proposed, not built: it needs a design rainstorm and a
     fill-and-spill routing of runoff into low ground. See part 3.
- **The City does not publish its pipes, outfalls or tide gates.** Its open data has 4,482
  inlet points with no pipes or elevations, and ten watersheds. Which outfalls have tide gates
  is the single fact that most changes the drain results; the explorer shows both states and
  asks the City (Needs).

## 1. Barriers and raised roads (built)

| Lever | Where | Crest, ft NAVD88 | Source | Cost (2019 dollars) |
|---|---|---|---|---|
| 2050 floodwalls | Three walls in Figure 5.7: along the North Basin edge from Spinnaker Way toward the frontage road; along the DoubleTree side of the harbor to Marina Blvd; along the north side of University Ave | 12.7 (10.7 + 2) | City study §5.3.1, Fig. 5.7 (P2); crest an assumption (P4) | $14.3M cumulative (P5) |
| 2100 floodwalls | Figure 5.8: the 2050 walls plus a ring around the harbor and a wall along Seawall Dr | 15.0 (13.0 + 2) | Fig. 5.8 (P3); crest an assumption | $31.5M cumulative |
| Raise Spinnaker Way | Shoreline Zone 7 | 12.7 | §5.3.1, Zone 7: "2-foot freeboard above the projected extreme water surface" (P6) | in the revetment program, $5.4M by 2050 (P5) |
| Raise University Ave (west of I-80) | Shoreline Zone 8 | 12.7 | §5.3.1, Zone 8 (P7) | same |
| Your own wall | Drawn on the map | You choose | Assumption | Not estimated |

Model rules: a wall is one 4 m cell wide; a raised road is three cells wide along the street's
centerline; water passes diagonally only through a cell below the level, so a wall drawn with
diagonal steps still holds. A raised road stays open when the level is below its crest.

## 2. Bay water up the drains, and tide gates (built)

- **Links.** One per City watershed whose nearest point to open water is within 500 m: Aquatic
  Park, Codornices, Derby, Gilman, Schoolhouse and Strawberry (D3). The outfall point is that
  nearest point, not a surveyed outfall; Cerrito and Marin drain outside the map. Exact outfall
  locations and inverts are not published.
- **Rule.** With the link open, every component of "low, not connected" ground in that
  watershed that contains at least one City storm drain inlet is shown as "can fill through
  drains". With a tide gate, the link is closed.
- **What it bounds.** Pipe capacity, invert elevations and storm duration are ignored, so this
  is the most the drains could let in, not what they would.
- **Check.** The transfer station Draft EIR documents that the Gilman St storm drain backs up
  above a 10-year rain (F7) and that the Codornices Creek culvert under I-80 floods Second St
  (F8). The City's 2023 work orders put the most flooding reports in the Derby (92),
  Strawberry (40), Schoolhouse (27) and Codornices (25) watersheds (D5); they come from the
  winter 2023 rains, not from tides.

## 3. Rain that cannot drain (proposed)

- **Storm.** A design rainstorm from NOAA Atlas 14 for Berkeley (for example the 10-year,
  6-hour storm the Draft EIR uses for Second St), not yet retrieved.
- **Runoff.** Rain on each watershed, times a runoff share (assumption; the transfer station
  site is 98% impervious, F-row to add), routed downhill.
- **Storage.** While the outfall is below the Bay level (the hours around high tide, from the
  NOAA prediction), runoff fills the lowest depressions in turn (fill-and-spill). Result:
  depth and extent of ponding, and which streets and places it reaches.
- **Check against** Second St flooding in the 10-year storm (F8) and the 2023 work-order
  counts (D5).
- **Effort.** About the size of Phase 1. Needs Eric's go-ahead (Needs, 2).

## Needs

1. **Tide gates.** Which Berkeley outfalls have flap gates or check valves, and their inverts.
   Ask Public Works (Storm Drain unit) or by public records request.
2. **Go-ahead for part 3** (rain on a high tide).
3. **The DoubleTree's temporary barriers** that Scott Ferris mentioned (M1): where and how
   high. Until known, a reader can draw them.
