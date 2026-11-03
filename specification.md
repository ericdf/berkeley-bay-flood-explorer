# Design brief: Berkeley Bay Flood Explorer

Draft, 2026-11-02. Eric's decisions of 2026-11-02 are recorded in SOURCE_NOTES E1–E3.

## Purpose

Let a resident pick a Bay water level, from this winter's king tides to the City's 2100
planning case, and see what it reaches in west Berkeley: which streets and freeway
segments close, whether the Marina can be reached, and which facilities flood, starting
with the Second Street transfer station. Then compare plans: what a flood barrier,
a raised road or a rebuilt facility at a higher floor changes against the same water.

It is a comparison tool, never a forecast. The water comes from published sources; the
explorer says where each level comes from and whether it includes waves.

## Why a Bay flood differs from a wildfire

The wildfire simulator measures evacuation because a fire gives minutes. A Bay flood
gives days: king tides are known years ahead and storm surge is forecast days ahead. So
the outcomes are access and exposure:

1. **Access.** Which streets and freeway segments are under water, and for how long; whether
   the Marina, the transfer station and the Second Street businesses can be reached; what
   closing I-80 or its ramps does to routes between Berkeley and Albany, Emeryville and
   Oakland (detour routes only; see Extent).
2. **Exposure.** Which facilities have ground or floors below the water: the transfer
   station, the DoubleTree, sewer pump stations, hazardous-materials sites, the rail line.
3. **Plans.** What a barrier, a raised road, a revetment upgrade, a raised floor or
   restored wetland changes, against identical water.

## Scenarios (the water: what Berkeley does not control)

Each scenario is a water level with its datum, whether it includes waves, and its source.
First list, all still water in ft NAVD88 unless stated:

| Scenario | Level | Source |
|---|---|---|
| Average daily high tide today | 6.2 | City 2019 study, Table 1 (SOURCE_NOTES W4) |
| This winter's king tides | to be derived from NOAA predictions | NOAA |
| King tide plus Kelvin wave | king tide + 0.5 to 1.0 | press reports of NOAA/NASA (H3) |
| Highest observed nearby | 8.65 (Richmond) to 9.42 (Alameda) | NOAA (W2, W3) |
| 100-year still water, 2016 | 9.8 | City 2019 study, Table 2 (W5) |
| 100-year still water, 2030 / 2050 / 2100 | 10.1 / 10.7 / 13.0 | same (W5), 2018 guidance; kept as the City used it |
| 100-year still water, 2050 and 2100, State 2024 Intermediate-High / High | 10.73 / 11.03 and 14.53 / 16.23 | derived: 9.73 (W11) plus the San Francisco gauge's rise (W17); baseline offset W18. The Intermediate scenario (10.53, 12.83) is left out of the list (E5) and stays reachable with the slider |
| FEMA wave-inclusive BFEs on the exposed shoreline | 12 to 14 | City 2019 study §2.1 (W6) |
| Ferris's 12 ft | 12, read as ft NAVD88 | Scott Ferris, Budget and Finance, 2026-10-22 (M1–M2) |

Ferris's figure is shown (Eric, E1) with what is known and what is not: as he stated it
("could result in a 12-foot sea level rise in the waterfront" in a "5 or 10-year storm"),
our reading of it as a 12 ft NAVD88 water level (inference, M2), where that level sits
against the 100-year still water level and the observed records, and that its source and
whether it includes waves are unconfirmed. When the Parks department or the meeting
video settles either point, the label changes and SOURCE_NOTES records it.

## Extent

Berkeley's shoreline and the streets, freeway segments and facilities in Berkeley.
Albany's and Emeryville's shorelines are included only where they change a Berkeley
outcome (Eric, E2):

- **Flanking.** Water that reaches Berkeley ground through a neighbor's lower or
  unprotected shoreline. A Berkeley barrier or raised road that the water can go around
  through Albany or Emeryville is shown as flanked, with where the water enters.
- **Shared infrastructure.** I-80 and its interchanges at the city lines, the rail line,
  shared drainage and wastewater facilities, where flooding outside Berkeley closes a
  Berkeley route or service.
- **Detours.** Routes Berkeley traffic takes when I-80 or a Berkeley street closes.

Where a neighbor's shoreline flanks a Berkeley plan, the explorer states the neighbor's
adopted plans and funded projects for that stretch, from their documents, so a reader can
compare investment. It does not characterize a neighbor's choices beyond what those
documents show.

## Hazard method

Phase 1 uses a **connected fill** (model rule): a grid cell is wet when its elevation is
below the scenario level *and* it connects to open Bay water through other wet cells.
Ground below the level but cut off by higher ground (behind the I-80 embankment, for
example) is shown separately as "below the level, not connected", because that is exactly
where drainage, tide gates and groundwater decide the outcome and a fill cannot.

The rule is checked before it is shown: a fill at 10.1 and 10.7 ft NAVD88 must reproduce
the City study's Marina findings (W7, W8), and fills at matching levels are compared with
CoSMoS depth maps (H1). Where they disagree, CoSMoS is shown and the disagreement logged.

Phase 2 replaces the fill with a published layer wherever one matches the level: the ART
maps (MHHW plus 12 to 108 inches, SOURCE_NOTES H5), which the Phase 1 page already draws as an
outline and the checks compare cell by cell, and CoSMoS rasters for storms of given return
periods.

**Built (Phase 1, 2026-11-02).** The connected fill on USGS 3DEP terrain, with "low, not
connected" ground shown separately, open water defined as connected ground below mean sea
level (3.31 ft NAVD88), the flanking measure from the Extent section, street and facility
results, and the ART outline. Checks: `node tests/check.mjs`. Results and their comparison
with the City study and ART: SOURCE_NOTES C1–C8.

No hydrodynamic modeling: water movement, wave runup and surge timing come from published
models or are not shown.

## Plans (what Berkeley controls)

Candidate levers, each with cost and provenance when known:

- Temporary flood barriers (Ferris, M1: being purchased for the back of the DoubleTree).
- Raising Marina Blvd or University Ave segments.
- Revetment and breakwater upgrades (City 2019 study, mitigation section; not yet read).
- Tide gates or check valves on storm drain outfalls.
- Transfer station rebuild at a higher floor elevation (Draft EIR alternatives; not yet read).
- Shoreline wetlands or managed retreat.

A lever changes the terrain or the connectivity (a barrier is a wall in the grid; a tide
gate disconnects a drain), never the water level.

**Built (2026-11-03).** City study floodwalls for 2050 and 2100, raised Spinnaker Way and
University Ave, tide gates on every outfall, and walls a reader draws, with "Bay water up the
drains" as the connectivity a tide gate closes. Design, sources and the proposed rain-on-a-
high-tide scenario: `docs/design/levers-and-drains.md`; results SOURCE_NOTES C9–C11.

## Results

- Streets and freeway segments wet, by length; I-80 mainline and ramps listed by name.
- Reachability: whether each named place (Marina, transfer station, Aquatic Park, Second
  Street businesses) still has a dry route from the flats east of I-80.
- Facilities with ground below the level, and with floors below it where floor
  elevations are known.
- Every result carries "not a flood forecast" and the scenario's datum and source.

## Not in scope (Phase 1)

Creek and hillside rain flooding; groundwater rise; flood duration; damage costs;
evacuation timing. Each is a candidate for later phases once a published source exists.

## Joint scenario with the wildfire simulator

The question (Eric, E3): how much harder is fire egress when Bay water has closed low
streets? The flood explorer supplies a list of street and freeway segments wet at a given
level; the wildfire simulator treats them as closed and reruns its comparison.

Timing decides which levels are worth testing. The wildfire simulator's fires are fall
fires, on Diablo (offshore, north-east) winds. Bay flooding peaks in winter: king tides in
November through January (M1) and storm surge with winter storms. Two cases follow:

1. **Same day, now.** A November king tide, possibly with the Kelvin wave, during a
   late-season Diablo wind fire. King tides are set by astronomy, so this coincidence is
   possible. A storm surge on the same day is unlikely: surge comes with low pressure and
   onshore storm winds, Diablo winds with high pressure and offshore winds (inference,
   ours; to be sourced). The test is whether a king tide closes any segment the fire
   evacuation uses.
2. **Any day, later.** As sea level rises, the daily high tide reaches ground that only
   storms reach today: MHHW is 9.4 ft NAVD88 in 2100 in the City study (W4), close to
   today's 100-year still water level of 9.8 (W5). Segments wet at every high tide are
   closed for a fire in any season. The test is the fire evacuation with those segments
   removed.

Results are reported in the wildfire simulator as a scenario setting, with the flood
level and its source named.
