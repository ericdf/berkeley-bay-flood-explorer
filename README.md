# Berkeley Bay Flood Explorer

A planned browser explorer for Bay flooding in west Berkeley: what a given water level
in San Francisco Bay puts under water (streets, I-80 and its frontage roads, the Marina,
the Second Street transfer station, other facilities) and what a plan changes.

**This is an educational comparison tool. It is not a flood forecast, not an official
hazard map and must not guide real emergency decisions.** For official information see
FEMA's flood maps and the City of Berkeley's emergency pages.

## Status

Not built. The design brief is [`specification.md`](specification.md). Every fact taken
from a document so far, with its source, is in [`SOURCE_NOTES.md`](SOURCE_NOTES.md); data
in hand and still needed is in [`DATA_INVENTORY.md`](DATA_INVENTORY.md).

## Relation to the wildfire simulator

This is the sister project of
[berkeley-wildfire-simulator](https://github.com/ericdf/berkeley-wildfire-simulator) and
reuses its terrain grid and street network (both in feet or meters NAVD88, the datum the
City's sea level rise work uses). The two differ in where the hazard comes from: the
wildfire simulator grows an illustrative fire, while this explorer takes its
water levels and flood depths from published sources (NOAA, FEMA/BCDC, USGS CoSMoS, the
City's 2019 Marina study) and does not model the water's movement itself.

## License

Code is under the [MIT License](LICENSE). Writing (documents and the explorer's text) is
under [CC BY 4.0](LICENSE-TEXT.md). Both require attribution. Third-party data keeps the
publisher's terms, including the ODbL for data derived from OpenStreetMap; see
[`LICENSE-TEXT.md`](LICENSE-TEXT.md).
