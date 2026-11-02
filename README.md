# Berkeley Bay Flood Explorer

A browser explorer for Bay flooding in west Berkeley: what a given water level in San
Francisco Bay puts under water (ground, streets, I-80 and its frontage road, the Marina, the
Second Street transfer station) and which low ground it does not reach over the surface.

**This is an educational comparison tool. It is not a flood forecast, not an official
hazard map and must not guide real emergency decisions.** For official information see
FEMA's flood maps and the City of Berkeley's emergency pages.

## Status

Phase 1 of [`specification.md`](specification.md) is built: pick one of 13 water levels
(or any level with the slider) and the page shows, for Berkeley, the ground under water,
the ground below the level that the Bay does not reach over the surface, the streets in
each, and what happens at the transfer station, the DoubleTree hotel, César Chávez Park
and Aquatic Park. Plans (barriers, raised roads) are not built yet. Every fact taken from a
document, with its source, is in [`SOURCE_NOTES.md`](SOURCE_NOTES.md); data in hand and
still needed is in [`DATA_INVENTORY.md`](DATA_INVENTORY.md).

## Run it

No build step or dependencies. Serve the folder and open the page (browsers block `fetch`
from `file://`):

```sh
python3 -m http.server 8767 --bind 127.0.0.1
# open http://127.0.0.1:8767
```

Port 8767, because the wildfire simulator uses 8766.

## How it works

- **Water levels** (`data/scenarios.json`) are still-water levels in feet NAVD88, each with
  its provenance category and source row: the tide study's 1- to 500-year levels off the
  Marina, NOAA's predicted king tide for this winter, the City study's 2050 and 2100
  levels, and Scott Ferris's 12 ft, read as a NAVD88 level and labeled inference.
- **Terrain** (`data/terrain/dem.i16`): USGS 3DEP lidar elevations from the 3DEP dynamic
  service, 4 m, centimeters NAVD88 (`tools/fetch-dem.mjs`).
- **The fill** (`js/fill.js`, model rule): a cell is under water when its ground is below
  the level and it connects to the open Bay through other cells below the level. Cells below
  the level that do not connect are shown separately as "low, not connected": that is where
  storm drains, tide gates, rain and groundwater decide what floods, and a fill cannot.
- **Open water**: ground below mean sea level (3.31 ft NAVD88) connected to the Bay.
- **Flanking**: Berkeley ground that the water reaches only by crossing land in Albany or
  Emeryville, found by filling again with the neighbors' land closed off.
- **Streets** (`data/streets.json`, from the wildfire simulator's network): a segment counts
  when a quarter of its length is wet; segments whose line crosses water (bridges, streets
  drawn across water) are listed separately and not counted.
- **Checks** (`node tests/check.mjs`): sources cited by every scenario exist; the fill is
  monotonic; the City study's 2050 results for Marina Blvd and the DoubleTree hold; and the
  fill is compared, level by level, with the published ART flood maps.
- `node tools/report.mjs [levels]` prints the results for every scenario, or for given levels.

Rebuilding the data: `node tools/fetch-dem.mjs`, `node tools/build-streets.mjs
../berkeley-wildfire-simulator`, `node tools/build-mask.mjs`, `node tools/build-facilities.mjs`,
and for the ART layer `python3 -I tools/fetch-art.py` (in a scratch folder) then
`node tools/build-art.mjs <that folder>`.

## Relation to the wildfire simulator

This is the sister project of
[berkeley-wildfire-simulator](https://github.com/ericdf/berkeley-wildfire-simulator) and
reuses its street network and its 4 m grid alignment. Its terrain grid has a 200 m strip
coded 0 m through the Marina (SOURCE_NOTES F12), so this explorer fetches terrain
from the same lidar. The two differ in where the hazard comes from: the
wildfire simulator grows an illustrative fire, while this explorer takes its
water levels from published sources (NOAA, the 2016 Bay tide study, the City's 2019 Marina
study), checks its fill against the published ART flood maps, and does not model the
water's movement itself.

## License

Code is under the [MIT License](LICENSE). Writing is under [CC BY 4.0](LICENSE-TEXT.md):
the documents and all text the explorer shows on screen, including text stored in
JavaScript, HTML or data files. Both require attribution. Third-party data keeps the
publisher's terms, including the ODbL for data derived from OpenStreetMap; see
[`LICENSE-TEXT.md`](LICENSE-TEXT.md).
