# Design brief: Berkeley Bay Flood Explorer

Draft, 2026-11-02. Decisions marked **(Eric)** are open until he settles them.

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
   Oakland.
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
| 100-year still water, 2030 / 2050 / 2100 | 10.1 / 10.7 / 13.0 | same (W5), 2018 guidance; update to 2024 guidance |
| FEMA wave-inclusive BFEs on the exposed shoreline | 12 to 14 | City 2019 study §2.1 (W6) |
| Ferris's 12 ft | 12, datum unconfirmed | held until resolved (M1–M2) |

**(Eric)** Whether to show Ferris's figure at all before the Parks department confirms
its source.

## Hazard method

Phase 1 uses a **connected fill** (model rule): a grid cell is wet when its elevation is
below the scenario level *and* it connects to open Bay water through other wet cells.
Ground below the level but cut off by higher ground (behind the I-80 embankment, for
example) is shown separately as "below the level, not connected", because that is exactly
where drainage, tide gates and groundwater decide the outcome and a fill cannot.

The rule is checked before it is shown: a fill at 10.1 and 10.7 ft NAVD88 must reproduce
the City study's Marina findings (W7, W8), and fills at matching levels are compared with
CoSMoS depth maps (H1). Where they disagree, CoSMoS is shown and the disagreement logged.

Phase 2 replaces the fill with CoSMoS rasters as the primary hazard layer wherever a
CoSMoS scenario matches, keeping the fill only for levels CoSMoS does not cover.

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

## Open for Eric

1. Whether to show Ferris's 12 ft before its source is confirmed.
2. The geographic extent: Berkeley only, or Albany's and Emeryville's shorelines too
   (I-80 detours cross both).
3. Whether to add a joint scenario with the wildfire simulator (I-80 as both the
   evacuation route and a flood-exposed road).
