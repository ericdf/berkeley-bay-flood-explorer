# Data inventory

What is in hand, what is needed, and each dataset's license. Nothing below is committed yet.

## In hand (reusable from berkeley-wildfire-simulator)

| Data | Source and license | Notes |
|---|---|---|
| 4 m terrain grid, NAVD88 | USGS 3DEP 1 m lidar, Alameda County 2021 (public domain), resampled to 4 m by the wildfire simulator | Open Bay water appears coded as elevation 0 (SOURCE_NOTES F5). West edge reaches the Marina but should be checked for full coverage of the Marina and the shoreline park. |
| Street network with segment elevations | Alameda County street centerlines; OpenStreetMap beyond Berkeley (© OpenStreetMap contributors, ODbL) | Elevations at segment ends only. Includes I-80, Eastshore Hwy, the I-80 ramps, Second St, Marina Blvd, Seawall Dr, Spinnaker Way. |

## Needed

| Data | Source | Why |
|---|---|---|
| Tide datums and extreme tides | FEMA/BCDC "San Francisco Bay Tidal Datums and Extreme Tides Survey" (Feb 2016), points near Berkeley | Return-period still water levels (1-, 2-, 5-, 10-, 25-, 50-, 100-year) for the scenario list. The City study used Alameda Point (Panel 518). |
| State sea level rise guidance, 2024 | Ocean Protection Council | Replaces the 2018 guidance the City study used. |
| CoSMoS v3.1 flood depth rasters, San Francisco Bay, Alameda County | USGS ScienceBase (public domain) | Published flood depths to show, and to check any fill rule against. |
| FEMA flood insurance rate map and FIS, Berkeley shoreline | FEMA NFHL (public domain) | BFEs; zone boundaries; VE vs AE. |
| Transfer station Draft EIR, hydrology and hazardous materials chapters | City of Berkeley / CEQAnet SCH 2023080733 | Site elevations, drainage, groundwater, materials stored on site. |
| Storm drain outfalls and tide gates west of I-80 | City of Berkeley Public Works; the 2019 Marina study's appendix lists Marina outfall elevations | The likely flood path to Second St (SOURCE_NOTES F4). |
| Facility list: sewer pump stations, hazardous-materials sites, transfer station, hotel, Amtrak line | City, EBMUD, state hazardous-materials databases, Union Pacific | What a scenario reaches besides streets. |
| Budget and Finance meeting video, 2026-10-22 | City of Berkeley | Exact wording and datum of Ferris's remarks (SOURCE_NOTES M1–M2). |
| Caltrans I-80 profile or as-builts near University Ave and Gilman St | Caltrans | Deck and embankment crest elevations, which bare-earth lidar may miss. |
