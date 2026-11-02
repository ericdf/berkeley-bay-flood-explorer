# Source notes

Every insight taken from a document, a meeting or a conversation, with its source and what
was done with it. Water levels are in feet NAVD88 unless a row says otherwise. Rows are
numbered by section (W = water levels, M = meeting remarks, F = facilities and terrain,
H = hazard data) so later work can cite them.

## Water levels: NOAA tide gauges (CO-OPS Metadata API, read 2026-11-02)

Datums from `https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations/<id>/datums.json?units=english`,
epoch 1983–2001. The API gives values in feet above station datum; converted to NAVD88 by
subtracting the station's NAVD88 value. Recorded maxima are the gauges' highest observed water levels.

| # | Gauge | MHHW | MLLW | Highest observed | Date of highest |
|---|---|---|---|---|---|
| W1 | San Francisco 9414290 | 5.90 | 0.06 | 8.72 | 1983-01-27 |
| W2 | Richmond 9414863 | 6.06 | 0.02 | 8.65 | 1998-02-06 |
| W3 | Alameda 9414750 | 6.37 | −0.23 | 9.42 | 1983-12-03 |

Used for: the datum rule in `CLAUDE.md` (MLLW is within about 0.25 ft of NAVD88 at these
gauges) and as the observed record against which any scenario level is compared. Both
record dates fall in strong El Niño winters (1982–83, 1997–98).

## Water levels: City of Berkeley, Draft Berkeley Marina Sea Level Rise Assessment Study (AB 691), 2019-08-30, 133 pp.

https://berkeleyca.gov/sites/default/files/documents/2019-8-30%20Draft%20Sea%20Level%20Rise%20Assessment%20Study_0.pdf.
Page numbers are the study's printed numbers.

- **W4** (Table 1, p. 9). Tidal datums at Alameda Point (FEMA/BCDC "San Francisco Bay
  Tidal Datums and Extreme Tides Survey", Feb 2016, Panel 518 and Appendix B-31) with the
  2018 California Coastal Commission low-risk-aversion sea level rise: MHHW 6.20 (2016),
  6.5 (2030), 7.1 (2050), 7.9 (2070), 9.4 (2100); MSL 3.31 (2016).
- **W5** (Table 2, p. 10). 100-year extreme tide plus that sea level rise, still water:
  9.8 (2016), 10.1 (2030), 10.7 (2050), 11.5 (2070), 13.0 (2100), 15 (2150).
- **W6** (§2.1). FEMA flood zones: the harbor and the area east of César E. Chávez Park
  are AE with BFE 10 ft NAVD88; the rest of the Marina is VE (wave action) with BFEs of
  12 to 14 ft NAVD88; McLaughlin Eastshore State Park is shaded Zone X.
- **W7** (§3.3.2). In 2050 (10.7 still water) two DoubleTree Hotel buildings have finished
  floors 0.3–0.5 ft below the water; by 2100 the whole complex is 0.5–3 ft above its floors.
- **W8** (§3.3.4). Roads: by 2030 Marina Blvd floods just north of University Ave and just
  south of Spinnaker Way; by 2050 Marina Blvd is "most likely" impassable; by 2100 much of
  University Ave is under water.
- **W9** (executive summary). Extreme wave runup and storm surge most affect the north,
  west and upper east side of the Marina.

Used for: the first scenario levels in `specification.md`, and as a check on any
connected-fill rule (W7 and W8 are results a fill at 10.1 and 10.7 should reproduce).
The study uses 2018 sea level rise guidance; the state's 2024 guidance (Ocean Protection
Council) supersedes it and has not been read yet.

## Meeting remarks: Scott Ferris, Director of Parks, Recreation and Waterfront

- **M1.** Budget and Finance Policy Committee, 2026-10-22, item "Marina Fund Overview and
  Update", as quoted by Kelly Hammargren, *Activist's Diary*, 2026-10-25
  (https://activistdiarybykellyhammargren.substack.com/p/another-week-in-berkeley-come-and).
  Quoted: El Niño "is bringing what they call the Kelvin wave", "anticipated 6 to 12 inches
  rise in sea level"; king tides in November, December and January; a "5 or 10-year storm"
  "could result in a 12-foot sea level rise in the waterfront"; "three of the Doubletree
  buildings flood at 10 ½ feet"; areas on University Ave and at Marina Blvd and Virginia
  St would flood streets but no buildings at 12 feet; the City is "working on purchasing
  some potential flood barriers" for the back of the DoubleTree.
  **Not yet checked against the meeting video.** Datum not stated.
- **M2.** Reading of M1 (inference, ours). "10 ½ feet" for the DoubleTree matches W7 in
  NAVD88, so the 12 feet is most likely a water level of 12 ft NAVD88.
  As still water, 12 ft NAVD88 is 2.2 ft above the 2016 100-year level (W5) and 2.6 ft
  above the highest level observed at Alameda (W3); it falls inside the wave-inclusive VE
  BFEs of 12–14 ft (W6). As still water it would exceed the 100-year level, which puts it far beyond a 5- or 10-year storm.
  The "6 to 12 inches" Kelvin wave figure is consistent with NOAA and NASA statements
  reported in the press (see H3). Open: ask the Parks department for the source of the
  12-foot figure and whether it includes waves; check the video for the exact words.
  Not used in the explorer until resolved.

## Facilities and terrain (derived from the wildfire simulator's data, 2026-11-02)

Terrain: USGS 3DEP 1 m lidar (Alameda County 2021) resampled to 4 m, NAVD88, from
berkeley-wildfire-simulator `data/terrain/`. Street elevations: that repository's
`data/model/network.json`, edge `z` values (elevation at each segment's two ends only).

- **F1.** Second St from University Ave to north of Gilman St: 9.8–14.4 ft at segment
  ends; 9.8–10.8 ft in the roughly 400 m south of Gilman St, beside the transfer station.
- **F2.** I-80 in Berkeley: mostly 14–15 ft at segment ends; Eastshore Hwy (the frontage
  road) 10.5–12.8 ft. Lidar bare-earth values on a freeway may not represent the deck or
  embankment crest; segment interiors were not sampled.
- **F3.** Solid Waste and Recycling Transfer Station Replacement Project (SCH 2023080733),
  669 Gilman St and 1101, 1199–1231, 1201 and 1203 Second St, 7.48 acres: the CEQA notice
  of preparation describes the site as about 6 to 13 ft "above mean sea level" (datum as
  stated; MSL is about 3.3 ft NAVD88 per W4, so the datum matters). The Draft EIR (notice
  of availability August 2026) lists hydrology and water quality and hazardous materials
  among potentially significant effects. **Its hydrology chapter has not been read.**
- **F4.** Inference (ours): the transfer station sits at or below the 100-year still
  water level (W5) but behind the I-80 embankment, so the first flood mechanism is more
  likely storm drains backed up by high tide, and possibly rising groundwater, than Bay
  water overtopping the freeway. Second St already floods in heavy rain (Hammargren, M1
  source). To be checked against the Draft EIR and CoSMoS.
- **F5.** In the wildfire simulator's 4 m grid, open Bay water appears to be coded as
  elevation 0 rather than as no-data (about 12.6 km² at or below 6 ft). Any fill rule must
  mask water explicitly.

## Hazard data and press (read 2026-11-02)

- **H1.** USGS Coastal Storm Modeling System (CoSMoS) v3.1, Central California including
  San Francisco Bay: flood depth and duration for sea level rise of 0, 0.25, 0.5, 0.75,
  1.0, 1.5, 2.0, 2.5, 3.0 and 5.0 m with background tide, 1-, 20- and 100-year storms;
  downloadable from ScienceBase. Candidate hazard layer. Not yet downloaded.
- **H2.** A BCDC comment letter found while searching (CEQAnet 301888) refers to the
  Belmont Creek watershed and OneShoreline, which are in San Mateo County; it belongs to a
  different project and is not used.
- **H3.** El Niño Kelvin wave, autumn 2026: press coverage (The Weather Network, AP via
  NY1 2026-10-03, SAN) puts the coastal sea level increase at about 6 inches to a foot;
  NOAA gave a greater than 90% chance of a very strong El Niño for November 2026 through
  January 2027; Governor Newsom proclaimed a state of emergency in late September 2026.
  Secondary sources; the NOAA and NASA statements themselves have not been read.
- **H4.** Used for: a "Kelvin wave" increment of 0.5–1.0 ft added to tide scenarios,
  labeled as from press reports of NOAA/NASA statements until the primary statements are read.
