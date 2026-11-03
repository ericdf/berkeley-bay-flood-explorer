# Data inventory

What is in hand, what is still needed, and each dataset's license.

## In hand

| Data | File | Source and license | Notes |
|---|---|---|---|
| Terrain, 4 m, NAVD88 | `data/terrain/dem.i16`, `dem.json` | USGS 3DEP dynamic elevation service (1 m lidar where available), exported at 4 m by `tools/fetch-dem.mjs`; public domain | Aligned with the wildfire simulator's grid. That grid has a 200 m strip coded 0 m through the Marina, so it is not used (SOURCE_NOTES F12, F13). Bare-earth lidar removes bridges and overpasses. |
| City of Berkeley boundary | `data/raw/census/berkeley-place.geojson`, rasterized to `data/terrain/berkeley.bits` | Census TIGERweb, incorporated place 0606000; public domain | Includes the City's Bay waters. |
| Streets | `data/streets.json` | berkeley-wildfire-simulator `data/model/network.json`: Alameda County centerlines; OpenStreetMap beyond Berkeley (© OpenStreetMap contributors, ODbL) | Vehicle segments only; each tagged in or outside Berkeley by its midpoint. |
| Facility outlines | `data/raw/osm/facilities.geojson`, `data/facility-cells.json` | OpenStreetMap via Nominatim (© OpenStreetMap contributors, ODbL) | Transfer station, DoubleTree hotel, César Chávez Park, Aquatic Park. |
| Extreme tides and datums | in `data/scenarios.json` | *San Francisco Bay Tidal Datums and Extreme Tides Study*, Feb 2016 (SOURCE_NOTES W10–W13) | Point 518 off the Marina; points 506–530 along Berkeley. |
| Predicted tides, Nov 2026 – Jan 2027 | in `data/scenarios.json` | NOAA CO-OPS, Richmond 9414863; public domain (W14) | Astronomical tide only. |
| ART flood maps, MHHW + 12 to 108 in | `data/hazard/art-*.bits`, `art.json`; `data/raw/art-dc/inundation_*.json` for + 48, + 77, + 84 in | BCDC/MTC Adapting to Rising Tides maps (AECOM 2017): + 12, 24, 36, 52, 66, 96, 108 in from the Caltrans-hosted service; + 48, 77, 84 in, which the service lacks, from the ART Alameda County geodatabase (`tools/fetch-art-dc.py --connected`) (H5) | Flooded area connected to the Bay, all ten levels. The two sources differ in registration and dry islands where both exist (C1). Used to check the fill and shown as an outline. |
| ART disconnected low-lying areas, MHHW + 12 to 108 in | `data/raw/art-dc/lowlying_*.json`, rasterized to `data/hazard/art-dc-*.bits`, `art-dc.json` | BCDC/MTC ART maps (AECOM 2017), Alameda County geodatabase from the ART Bay Shoreline Flood Explorer Download page, read by range requests with `tools/fetch-art-dc.py` (H5) | Ground below ART's water surface not connected to its flooded area, patches over one acre only; all ten levels. Used to check the "low, not connected" class (C20) and shown as an optional outline. |
| USGS CoSMoS v2.1 flood maps, 0–5 m of sea level rise with storms | `data/raw/cosmos/` (2 m extent and 20 m water surface clips), `data/hazard/cosmos-*.bits`, `cosmos.json` | USGS CoSMoS v2.1 San Francisco Bay via Our Coast, Our Future (Point Blue and USGS), Alameda County zips; no licence stated, USGS work (H1) | A total water level model with waves, not still water; checked against the fill (C21) and shown as an outline chosen by rise and storm. The county zips (78–398 MB) are fetched by `tools/fetch-cosmos.py`, not stored. |
| USGS CoSMoS-GW groundwater depth classes, Alameda County, 0–5 m of sea level rise | `data/raw/cosmos-gw/` (polygons clipped to the grid), `data/hazard/cosmos-gw-slr<cm>-{marine,emergent,0to1m,1to2m}.bits`, `cosmos-gw.json` | USGS data release, Befus and others 2020, https://doi.org/10.5066/P9H5PBXP, `Alameda_MHHW.zip` (110 MB, fetched by `tools/fetch-cosmos-gw.py`, not stored); public domain, acknowledge USGS and the University of Wyoming (H7) | Depth to the modeled water table, not a flood depth. MHHW boundary, full model (drainage), Kh 1.0 m/day, the middle of three cases; the release names no best estimate, and Kh changes today's land within 1 m ten-fold. Steady state, no drains, sewers or pumping. Compared with the fill and the EIRs in C22. |
| State Tsunami Hazard Area | `data/raw/cgs/tsunami-hazard-area.geojson`, rasterized to `data/hazard/tsunami.bits` by `tools/build-tsunami.mjs` | California Geological Survey and Cal OES, services.gis.ca.gov Oceans/Tsunami MapServer (H6) | An evacuation planning area combining the largest tsunamis considered; shown as an outline. |
| Sites checked against the fill | `data/sites-checked.json` (`tools/site-check.mjs`) | GeoTracker, EPA FRS/RCRA, SMARTS, OpenStreetMap points (C14–C16, F16) | Business and public facility names only. |
| City watersheds | `data/raw/city/watersheds.geojson`, rasterized to `data/hazard/watersheds.u8` | City of Berkeley open data (D1) | Ten watersheds; six get drain links (D3). |
| Storm drain inlets | `data/raw/city/inlets.json`, cells in `data/drains.json` | City of Berkeley open data (D2) | Coordinates only; adoption fields with names not stored. |
| Storm work orders, Jan–Jun 2023 | `data/raw/city/overflow-counts.json` | City of Berkeley open data (D5) | Counts by watershed only; records name staff and give addresses. |
| NOAA Atlas 14 rain depths, Berkeley | `data/raw/noaa/atlas14-berkeley.json` | NOAA HDSC Precipitation Frequency Data Server; public domain (R1) | Point estimates, partial-duration series. |
| NLCD 2021 imperviousness by watershed | `data/raw/nlcd/impervious-by-watershed.json` | MRLC (USGS); public domain (R2) | Watershed means; the raster is not stored. |
| City study mitigation plans | `data/plans.json` | City 2019 Marina study §5 (P1–P9) | Floodwall alignments traced from Figures 5.7 and 5.8. |
| Transfer station Draft EIR, §3.9 and Appendix H | not stored (CEQAnet) | City of Berkeley, SCH 2023080733 (F6–F11) | Drainage, groundwater, flood zone, sea level rise finding. |

## Needed

| Data | Source | Why |
|---|---|---|
| State sea level rise guidance, 2024 | Ocean Protection Council | Replaces the 2018 guidance the City study and the Draft EIR used. In use: the San Francisco gauge table, as the Coastal Commission's 2024 guidance reproduces it (SOURCE_NOTES W17). The OPC document itself refused automated access. |
| FEMA flood insurance rate map, Berkeley shoreline | FEMA NFHL (public domain) | Zone boundaries; VE vs AE. |
| Storm drain pipes, outfalls, inverts and tide gates | City of Berkeley Public Works (not in its open data); the 2019 Marina study lists Marina outfall elevations | Which outfalls have tide gates decides the drain results (D6, C9). |
| Storm drain outfall inverts and pipe capacities | City of Berkeley Public Works | Replaces the "share that cannot drain" setting with how long the tide holds each outfall shut (R5). |
| Alameda County Flood Control District Hydrology and Hydraulics Manual (2016) | acfloodcontrol.org | The County's runoff coefficients, to check the Simple Method shares (R3). |
| Floodwall alignments and tie-ins as drawings | City of Berkeley / the study's consultant | The traced alignments are ±30 m (P9, C11). |
| Building footprints and floor elevations at the DoubleTree | OpenStreetMap buildings; the City study's figures | To test "three of the Doubletree buildings flood at 10 ½ feet" (M1) building by building. |
| More facilities: sewer pump stations, the rail line, and what hazardous materials operating sites store | City, EBMUD, the City's Toxics Management Division (hazardous materials business plans), Union Pacific | What a level reaches besides streets; contaminated sites are in C15 and F19. |
| Budget and Finance meeting video, 2026-10-22 | City of Berkeley | Exact wording and datum of Ferris's remarks (M1–M2). |
| Caltrans I-80 profile near University Ave, Gilman St and Buchanan St | Caltrans | Deck and embankment crest elevations, which bare-earth lidar may miss. |
