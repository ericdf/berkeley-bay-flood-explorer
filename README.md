# Berkeley Bay Flood Explorer

**Live site: https://ericdf.github.io/berkeley-bay-flood-explorer/** (served from the `pages` branch)

A browser explorer for Bay flooding in west Berkeley: what a given water level in San
Francisco Bay puts under water (ground, streets, I-80 and its frontage road, the Marina, the
Second Street transfer station) and which low ground it does not reach over the surface.

**This is an educational comparison tool. It is not a flood forecast, not an official
hazard map and must not guide real emergency decisions.** For official information see
FEMA's flood maps and the City of Berkeley's emergency pages.

## Status

Phase 1 of [`specification.md`](specification.md) is built: pick one of 18 water levels
(or any level with the slider) and the page shows, for Berkeley, the ground under water,
the ground below the level that the Bay does not reach over the surface, the streets in
each, and what happens at the transfer station, the DoubleTree hotel, César Chávez Park
and Aquatic Park. Plans are built: the City study's floodwalls and raised roads, tide gates
on the storm drain outfalls, and walls you draw, each compared with no plan at the same level
([`docs/design/levers-and-drains.md`](docs/design/levers-and-drains.md)). A rainstorm can be
added on top of any Bay level: NOAA design storms, runoff from each watershed's imperviousness,
pooled at its lowest inlet while the tide holds the outfalls shut. Every fact taken from a
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
  levels, the State's 2024 guidance, and a 12 ft level quoted at a Council committee (Scott
  Ferris, 2026-10-22), read as a NAVD88 level and labeled inference.
- **Terrain** (`data/terrain/dem.i16`): USGS 3DEP lidar elevations from the 3DEP dynamic
  service, 4 m, centimeters NAVD88 (`tools/fetch-dem.mjs`).
- **The fill** (`js/fill.js`, model rule): a cell is under water when its ground is below
  the level and it connects to the open Bay through other cells below the level. Cells below
  the level that do not connect are shown separately as "low, not connected": that is where
  storm drains, tide gates, rain and groundwater decide what floods, and a fill cannot.
- **Open water**: ground below mean sea level (3.31 ft NAVD88) connected to the Bay.
- **Through the drains** (model rule, an upper bound given the mapped inlets): in a City watershed
  whose outfall is assumed to have no working tide gate, low ground that holds a storm drain inlet can fill through the pipes.
- **Rain on a high tide** (`js/rain.js`, model rule, an illustrative storage experiment that can
  overstate water at one inlet and miss it elsewhere): NOAA Atlas 14 rain × a runoff
  share from NLCD imperviousness × the share that cannot drain × the watershed's area, pooled
  upward from the watershed's lowest inlet. The runoff share uses a method made for annual
  loads, applied to one storm as an exploratory assumption.
- **Plans** (`js/plan.js`, `data/plans.json`): walls and raised roads become crest elevations
  the fill must exceed; tide gates close drain links. Presets come from the City's 2019 Marina
  study; alignments are traced from its figures (about ±30 m) and crests are an assumption.
- **Flanking**: Berkeley ground that the water reaches only by crossing land in Albany or
  Emeryville, found by filling again with the neighbors' land closed off.
- **Streets** (`data/streets.json`, from the wildfire simulator's network): a segment counts
  when a quarter of its length is wet; segments whose line crosses water (bridges, streets
  drawn across water) are listed separately and not counted.
- **Checks** (`node tests/check.mjs`): sources cited by every scenario exist; the fill is
  monotonic; the City study's 2050 results for Marina Blvd and the DoubleTree hold; and the
  fill is compared, level by level, with the published ART flood maps.
- **Civic stories** (`js/civic/`, `data/civic/`): guided stories that walk one question through
  five stages: discover, understand, evaluate, decide and act. Each story ends with an evidence
  brief and, where one fits, a request readers can send themselves. Every number in a story comes
  from the model at the step's settings. `node tests/civic-check.mjs` checks the data, the numbers,
  the links and the brief. Design: `docs/civic/insight-and-action-spec.md`; notes and the calls
  made: `docs/civic/implementation-notes.md`; rules: `docs/civic/editorial-policy.md`.
- `node tools/report.mjs [levels] [--plan walls2050,roads,gates] [--rain 10:6-hr:0.25]` prints the results for every
  scenario, or for given levels, with or without a plan.

Rebuilding the data: `node tools/fetch-dem.mjs`, `node tools/build-streets.mjs
../berkeley-wildfire-simulator`, `node tools/build-mask.mjs`, `node tools/build-facilities.mjs`, `node tools/build-drains.mjs`,
`node tools/build-plans.mjs`, `python3 -I tools/fetch-impervious.py`,
and for the ART layers `python3 -I tools/fetch-art-dc.py --connected` and `python3 -I tools/fetch-art-dc.py`, then `node tools/simplify-art-dc.mjs 0.5 data/raw/art-dc/inundation_*.json`, `node tools/build-art-dc.mjs --connected` and `node tools/build-art-dc.mjs`. To reproduce the Caltrans comparison (C1): `python3 -I tools/fetch-art.py` in a scratch folder, then `node tools/build-art.mjs <that folder> <out folder>`. For CoSMoS: `python3 -I tools/fetch-cosmos.py <cache dir>`, then `node tools/build-cosmos.mjs` (add `--all --out DIR` for every storm); for the tsunami outline `node tools/build-tsunami.mjs`
(source in `data/raw/cgs/`). `node tools/site-check.mjs` reproduces the site checks in SOURCE_NOTES.

## King tide field check

A volunteer checks the explorer against this winter's king tides from a printable guide. The guide
is for the volunteer, not the web (Eric, SOURCE_NOTES E19): it left the site on 2026-11-04, and its
last version is in this repository's history before that change.

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
