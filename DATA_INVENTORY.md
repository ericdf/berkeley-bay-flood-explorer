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
| ART flood maps, MHHW + 12 to 108 in | `data/hazard/art-*.bits`, `art.json` | BCDC/MTC Adapting to Rising Tides maps (AECOM 2017), from the Caltrans-hosted service (H5) | Flooded area connected to the Bay; the service has no 84-inch layer. Used to check the fill and shown as an outline. |
| Transfer station Draft EIR, §3.9 and Appendix H | not stored (CEQAnet) | City of Berkeley, SCH 2023080733 (F6–F11) | Drainage, groundwater, flood zone, sea level rise finding. |

## Needed

| Data | Source | Why |
|---|---|---|
| State sea level rise guidance, 2024 | Ocean Protection Council | Replaces the 2018 guidance the City study and the Draft EIR used. |
| ART disconnected low-lying areas | ART Bay Shoreline Flood Explorer county geodatabase | A published counterpart to the explorer's "low, not connected" class. |
| CoSMoS v3.1 flood depth rasters, Alameda County | USGS ScienceBase (public domain) | A second published depth map, with storms of given return periods. |
| FEMA flood insurance rate map, Berkeley shoreline | FEMA NFHL (public domain) | Zone boundaries; VE vs AE. |
| Storm drain outfalls and tide gates west of I-80 | City of Berkeley Public Works; the 2019 Marina study lists Marina outfall elevations | The flood path to Second St (F4, F7, F8). |
| Building footprints and floor elevations at the DoubleTree | OpenStreetMap buildings; the City study's figures | To test "three of the Doubletree buildings flood at 10 ½ feet" (M1) building by building. |
| More facilities: sewer pump stations, hazardous-materials sites, the rail line | City, EBMUD, state databases, Union Pacific | What a level reaches besides streets. |
| Budget and Finance meeting video, 2026-10-22 | City of Berkeley | Exact wording and datum of Ferris's remarks (M1–M2). |
| Caltrans I-80 profile near University Ave, Gilman St and Buchanan St | Caltrans | Deck and embankment crest elevations, which bare-earth lidar may miss. |
