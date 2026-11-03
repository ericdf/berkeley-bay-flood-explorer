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

- **W4** (Table 1, p. 9). Tidal datums at "Alameda Point 518" (FEMA/BCDC "San Francisco Bay
  Tidal Datums and Extreme Tides Survey", Feb 2016, Panel 518 and Appendix B-31; this is
  Alameda County point 518 of that study, off the Berkeley Marina, not the Alameda gauge or
  the former naval air station: its datums match W11 exactly) with the
  2018 California Coastal Commission low-risk-aversion sea level rise: MHHW 6.20 (2016),
  6.5 (2030), 7.1 (2050), 7.9 (2070), 9.4 (2100); MSL 3.31 (2016).
- **W5** (Table 2, p. 10). 100-year extreme tide plus that sea level rise, still water:
  9.8 (2016; the source study gives 9.73 at point 518, W11, so the City's figure is rounded up), 10.1 (2030), 10.7 (2050), 11.5 (2070), 13.0 (2100), 15 (2150).
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

## Water levels: *San Francisco Bay Tidal Datums and Extreme Tides Study*, Final Report, February 2016 (financed in part by FEMA and BCDC; file dated 2016-04-29)

https://www.adaptingtorisingtides.org/wp-content/uploads/2016/05/20160429.SFBay_Tidal-Datums_and_Extreme_Tides_Study.FINAL_.pdf
(retrieved 2026-11-02, 26 MB). Page numbers are PDF pages.

- **W10** (Table 2-1, p. 27). Annual chance of exceedance by event: king tide 100%, 2-year
  50%, 10-year 10%, 50-year 2%, 100-year 1%, 500-year 0.2%. King tides "generally occur in
  the winter months between December and February" (p. 26).
- **W11** (Appendix B, p. 113 and following; Alameda County points 506–530 and Contra
  Costa 483–485, the Berkeley and Albany shoreline). Still water levels, ft NAVD88:
  MHHW 6.19–6.22; 1-year 7.42–7.45; 2-year about 7.75; 5-year 8.15–8.17; 10-year
  8.47–8.49; 25-year about 8.9; 50-year about 9.3; 100-year 9.70–9.80; 500-year 10.84–11.04.
  Point 518 (off the Marina): MLLW −0.07, MSL 3.31, MHHW 6.20, 1-year 7.43, 5-year 8.16,
  10-year 8.47, 100-year 9.73, 500-year 10.91. The appendix labels its coordinates "UTM
  Zone 10N – Meters", but the values are California State Plane Zone III (NAD83, US survey
  feet); converted that way they fall on the Berkeley shoreline (derived, ours).
- **W12** (Table 3-5, p. 54). Sample levels at Richmond: 1-year 7.33, 10-year 8.34,
  100-year 9.53, 500-year 10.59. "There is considerable uncertainty in estimates of the
  500-year extreme tide elevation."
- **W13** (p. 28). "High coastal waters, by themselves or in combination with rain, may
  overtop seawalls, back up into storm drains, and delay drainage of stormwater into the
  Bay", illustrated with a photo of surface flooding in Berkeley (Figure 2-7A).

Used for: the scenario levels in `data/scenarios.json` (the 1-, 5-, 10-, 100- and 500-year
still water levels at point 518) and the test of Ferris's "5 or 10-year storm" (M2).

## Water levels: NOAA tide predictions, Richmond 9414863, November 2026 – January 2027 (read 2026-11-02)

CO-OPS Data API, product `predictions`, `datum=NAVD`, `interval=hilo`, local time.

- **W14.** Highest predicted high tides (astronomical only, no weather): 7.42 ft NAVD88 on
  2026-12-24 at 10:58 a.m.; 7.34 on 2027-01-22 at 10:56 a.m.; 7.34 on 2026-12-23; 7.17 on
  2026-11-25 at 11:08 a.m. The December peak equals the 1-year extreme tide off Berkeley
  (W11). Used for: the "this winter's king tide" scenario (7.4) and, with H3's 0.5–1.0 ft,
  the "king tide plus Kelvin wave" scenario (7.9–8.4).

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
  As still water, 12 ft NAVD88 is 2.3 ft above the 100-year level off the Marina (9.73,
  W11), 1.0 ft above the 500-year level (10.91, W11) and 2.6 ft above the highest level
  observed at Alameda (W3); it falls inside the wave-inclusive VE BFEs of 12–14 ft (W6).
  The 5- and 10-year still water levels off the Berkeley shoreline are 8.15–8.17 and
  8.47–8.49 (W11), so a 5- or 10-year storm with a 1 ft Kelvin wave on top reaches about
  9.2–9.5, about 2.5 ft short of 12.
  The "6 to 12 inches" Kelvin wave figure is consistent with NOAA and NASA statements
  reported in the press (see H3). Open: ask the Parks department for the source of the
  12-foot figure and whether it includes waves; check the video for the exact words.
  Shown in the explorer by Eric's decision (E1), with this reading labeled as inference.

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
  of availability, 2026-08-03, p. 2) lists hydrology and water quality and hazardous
  materials among topics with potentially significant effects and says all "would be reduced to
  less than significant with implementation of mitigation measures"; no significant
  unavoidable impacts. Comment period 2026-08-03 to 2026-09-17. The hydrology chapter is
  read in F6–F11.
- **F4.** Inference (ours): the transfer station sits at or below the 100-year still
  water level (W5) but behind the I-80 embankment, so the first flood mechanism is more
  likely storm drains backed up by high tide, and possibly rising groundwater, than Bay
  water overtopping the freeway. Second St already floods in heavy rain (Hammargren, M1
  source). Supported by the Draft EIR (F7, F8): Second St floods today from an undersized
  storm drain and the Codornices Creek culvert under I-80.
- **F5.** In the wildfire simulator's 4 m grid, open Bay water appears to be coded as
  elevation 0 rather than as no-data (about 12.6 km² at or below 6 ft). Any fill rule must
  mask water explicitly.
- **F12.** That grid also has a strip about 200 m wide coded 0 m running north–south through
  the Marina at easting 560,000 m (the western edge of the 2021 Alameda County lidar tiles),
  which a fill would treat as open Bay inside the Marina. Seen in a rendering of the clipped
  grid, 2026-11-02. The explorer does not use that grid (F13).
- **F13.** The explorer's terrain comes from the USGS 3DEP dynamic elevation service, which
  is seamless across the Marina: 1 m cells (nearest neighbor) in 16 tiles, each 4 m cell
  the mean of its 16 values (`tools/fetch-dem.mjs`). Where both grids show land, a 4 m
  bilinear export from the same service differs from the wildfire grid by a median of
  −0.16 ft (5th to 95th percentile −1.79 to +1.03 ft).

## Transfer station Draft EIR, Section 3.9 Hydrology and Water Quality, and Appendix H (FirstCarbon Solutions for the City, Draft EIR received by CEQAnet 2026-08-03)

Draft EIR: https://ceqanet.lci.ca.gov/2023080733/2 (attachment "27320011 Berkeley SW&RTS
Replacement Project Draft EIR", 87 MB); Appendix H, "Hydrology and Water Quality Supporting
Information" (Balance Hydrologics CEQA memo, 2022-08-23), same page. Page numbers are the
documents' printed numbers, with PDF pages in brackets.

- **F6** (p. 3.9-8 [449]). Groundwater at the site "range[s] seasonally from 5 to 10 feet
  bgs, which is considered a high groundwater level." Within half a mile are "multiple
  active contamination cleanup programs", "the most notable being an actively managed
  hexavalent chromium plume associated with the WRE/Colortech Facility located on 6th
  Street", with petroleum byproducts, tetrachloroethylene, lead and other heavy metals.
- **F7** (p. 3.9-12 [455]). The site is in FEMA's 0.2 percent annual chance (500-year)
  flood hazard area, "generally between I-580/I-80 and Fourth Street". The Gilman Street
  storm drain outfall "is currently undersized for the 10-year peak flow event"; flows
  above it "backup within the storm drain system and cause ponding on surface streets".
- **F8** (p. 3.9-12 [455], footnote 18). The Codornices Creek culvert under I-80
  constricts flow and induces flooding on Second St beside the site; per Klein (2009, for
  Caltrans) the creek overtops upstream of I-80 above 190 cfs, and Balance Hydrologics'
  2011 City model shows flooding at Second St in the 10-year 6-hour design storm. Appendix
  H (p. 18 [22]): the I-80 culvert "lacks the necessary conveyance for events equal to or
  greater than the 10-year recurrence interval."
- **F9** (pp. 3.9-11 to 3.9-21 [454–463], Exhibits 3.9-2a–d, maps by AECOM, June 2017).
  Sea level rise is mapped as MHHW plus 24, 52, 84 and 108 inches; "the project site would
  begin to experience inundation at the MHHW plus 84-inch SLR scenario" (p. 3.9-13). The
  exhibits list equivalent combinations: MHHW + 24 in ≈ 0 in of sea level rise plus a
  5-year storm surge; MHHW + 52 in ≈ 12 in plus a 100-year surge or 24 in plus a 10-year;
  MHHW + 84 in ≈ 42 in plus a 100-year surge or 54 in plus a 10-year; MHHW + 108 in ≈
  66 in plus a 100-year surge. The chapter cites the 2018 state sea level rise guidance.
- **F10** (pp. 3.9-44 to 3.9-45 [486–487], Impact HYD-4). Finding: "would be located in a
  flood hazard zone, tsunami, or seiche zone, but would not risk release of pollutants due to
  project inundation"; less than significant without mitigation. Reasons given: the site's
  "overall elevation and usage" stay the same; a "30-foot creek buffer and berm wall" would
  reduce run-on flooding; for sea level rise, the creek buffer, and the design "would
  neither exacerbate SLR nor would it result in hazards associated with SLR". The CGS
  tsunami zone extends to Fifth St, east of the site.
- **F11** (Appendix H, p. 18 [22]). Balance Hydrologics: the creek buffer "would provide
  minor additional storage that is unlikely to reduce the breakout of flood flows to Second
  Street", but leaves space for a later flood wall "as sea level rise further exacerbates
  existing flooding conditions". The memo notes CEQA "does not require analysis of the
  existing environment's effect on future users" unless the project exacerbates a hazard.
  Recorded as a difference in emphasis from F10, which credits the buffer and berm with
  reducing run-on flooding; both can be true (berm against run-on, buffer storage minor).

Used for: the transfer station's entry in `data/facilities.json` and the explorer's note
on it; F9's equivalence table is how the explorer pairs an ART level with storm and sea
level rise combinations (H5).

## Plans: City of Berkeley 2019 Draft Marina Sea Level Rise Assessment, §5 (read 2026-11-03)

Same study as W4–W9; printed page numbers; figure pages rendered from the PDF.

- **P1.** Two mitigation options: revetment and breakwater repair and upgrade by Shoreline
  Zone, and floodwalls "around the perimeter of the Project Area" (§5.3, pp. 20–22).
- **P2.** Figure 5.7, "2050 SLR Proposed Floodwalls, 100-year Extreme Tide + Low Risk Aversion
  (10.7 ft. WSEL NAVD 88)": three walls (along the south edge of the North Basin from Spinnaker
  Way toward the frontage road; along the harbor's north edge past the DoubleTree to Marina
  Blvd; along the north side of University Ave). Traced in `tools/build-plans.mjs`.
- **P3.** Figure 5.8, the same for 2100 (13.0 ft WSEL): the North Basin and University Ave walls,
  a ring around the harbor and a wall along Seawall Dr.
- **P4.** Figures 5.9 and 5.10 (floodwall schematics) give the wall top as "EL VARIES"; no crest
  elevation is stated. The explorer uses the design level plus the 2 ft freeboard of P6:
  12.7 ft NAVD88 (2050), 15.0 (2100). Assumption.
- **P5.** Costs (executive summary and §5.4, 2019 dollars, cumulative): revetment and breakwater
  $3.2 million by 2030, $5.4 million by 2050, $60.5 million by 2100; floodwalls $14.3 million
  for 2050 protection and $31.5 million for 2100.
- **P6.** Shoreline Zone 7 (east side of César E. Chávez Park): Spinnaker Way "would need to be
  raised in stages to provide a 2-foot freeboard above the projected extreme water surface at
  the forecast end of life of the pavement" (p. 21).
- **P7.** Shoreline Zone 8: "to avoid inundation of the University Avenue by extreme runup with
  projected 2050 sea level rise, the revetment would need to be upgraded and potentially the
  raising of the road" (p. 21). No height stated; the explorer uses P6's rule at the 2050
  level, 12.7 ft (assumption).
- **P8.** Entrance breakwater: "the top of the crest was set at +16 feet NAVD88" in the 2100
  upgrade (p. 22). Not built as a lever (it protects the harbor from waves, which a still-water
  fill does not model).
- **P9.** Tracing (derived): Figures 5.7 and 5.8 rendered at 150 dpi; placed by the figures'
  scale (1 in = 1,000 ft) and one landmark, the DoubleTree buildings drawn in the figure at the
  hotel's OpenStreetMap centroid. With that fit the street network's Marina Blvd, Spinnaker Way
  and University Ave fall on the roads in the figure's photo. Positions about ±30 m.

## Storm drains: City of Berkeley open data (read 2026-11-03)

City ArcGIS organization services1.arcgis.com/IYiCpZoSIq9lAxi8.

- **D1.** `Watersheds` (10 polygons: Wildcat, Strawberry, Temescal, Aquatic Park, Schoolhouse,
  Derby, Gilman, Codornices, Cerrito, Marin). Saved as `data/raw/city/watersheds.geojson`.
- **D2.** `StormDrains_public`, layer `swInlet`: 4,482 storm drain inlet points; 1,749 grid cells
  in the map hold one. Fields are adoption records (adopter names); only coordinates are stored
  (`data/raw/city/inlets.json`). No pipes, outfalls, inverts or tide gates are published.
- **D3.** Drain links (derived, `tools/build-drains.mjs`): each watershed's outfall point is its
  cell nearest open water; Strawberry 36 m, Aquatic Park 4 m, Schoolhouse 4 m, Derby 4 m,
  Gilman 8 m, Codornices 36 m from open water, so all six get a link; Cerrito and Marin are about
  2 km away and drain outside the map. The points are not surveyed outfalls.
- **D4.** Other City layers found and not used yet: `CoSMoS_SLR_100_Year_Storm_Event`
  (100-year storm with 0.25, 0.75 and 1.25 m of sea level rise), `BerkeleyFloodplain_WFL1`
  (streets in the 100- and 500-year floodplains; a parcel layer, not to be stored), creek and
  culvert setback layers (`BMC_17_08_Creeks*`).
- **D5.** `StormDrainOverflow_WFL1`, layer "Areas of Observed Storm Drain Overflow": 300 Public
  Works storm work orders, January–June 2023. The records name staff and give street addresses,
  so only counts by watershed are stored (`data/raw/city/overflow-counts.json`). Work orders whose
  description mentions flooding, overflow, ponding, backup, not draining, clogged or plugged (our
  keyword rule): Derby 92, Strawberry 40, Schoolhouse 27, Codornices 25, Marin 16, Temescal 6,
  Gilman 5, Wildcat 4, Cerrito 2. These follow the winter 2023 rains; they say where drains back
  up in rain, not under a high tide.
- **D6.** Rule built (model rule, `js/analyze.js` `markDrains`): with a watershed's link open,
  each patch of low, not-connected ground that holds an inlet can fill through the drains; a
  tide gate closes the link. Upper bound: pipe connectivity, capacity, inverts and duration are
  ignored. Which outfalls already have gates is unknown; the page shows them open unless the
  reader adds gates.

## Explorer checks and findings (derived, 2026-11-02)

Reproduce with `node tests/check.mjs`, `node tools/report.mjs` and `node tools/overtop.mjs`.
"Under water" is the connected fill (model rule, `js/fill.js`); areas count Berkeley land only
(Census place boundary, excluding open water).

- **C1. Terrain against the published ART maps (H5).** Agreement (cells under water in both,
  over cells under water in either) on Berkeley land, by ART level: MHHW + 12 in 68%, + 24 in
  74%, + 36 in 76%, + 52 in 84%, + 66 in 88%, + 96 in 86%, + 108 in 91%. With a 4 m bilinear
  export of the same lidar it was 54–62% at the four lowest levels, with the fill wetting
  ground behind narrow structures such as the revetment along University Ave east of the
  Marina; averaging 1 m cells fixed most of that, so the explorer uses it (F13). Below
  + 66 in the fill wets slightly more than ART (by 1.4–2.0 ha); at + 96 and + 108 in ART
  wets more (by 10–17 ha). The service returned no polygons for the + 48 and + 77 in layers
  (two tries each), and its + 108 in layer covers less of the transfer station (70%) than its
  + 96 in layer (100%), which points to a gap in the served polygons.
- **C2. City 2019 Marina study (W7, W8).** At 10.7 ft NAVD88 (its 2050 100-year level) the
  fill has all 675 m of Marina Blvd under water (W8: "most likely" impassable) and 25% of the
  DoubleTree grounds (W7: two buildings' floors below the water). At 10.1 (its 2030 level),
  where W8 has Marina Blvd flooding north of University Ave and south of Spinnaker Way, the
  fill shows 98 m of Marina Blvd on low ground that is not connected and none under water:
  the fill's onset there is later by up to 0.6 ft. The study's terrain and method are not
  stated in the pages read.
- **C3. Today's storm tides.** Up to the 100-year level (9.73), no Berkeley street segment is
  under water; Bolivar Dr and Eastshore Hwy (the frontage road) sit on low ground that is not
  connected from the king tide (7.4) upward, and Second St from the 100-year level. In Albany,
  Buchanan St is under water from 9.47 (a 10-year tide plus a 1 ft Kelvin wave).
- **C4. Ferris's 12 ft (M1, M2).** At 12 ft NAVD88 still water: University Ave (1.4 km),
  Marina Blvd, Buchanan St and Gilman St under water in Berkeley; 65% of the DoubleTree
  grounds; the transfer station not reached (18% of it on low ground that is not connected).
  This matches his statement that University Ave and Marina Blvd at Virginia St flood
  streets but no buildings, except at the DoubleTree, which he named separately.
- **C5. Flanking (E2).** At no scenario level is any Berkeley ground reached only through
  Albany or Emeryville land. An earlier run on the bilinear terrain found 3.9 ha at 12 ft;
  it disappeared with the better terrain (F13).
- **C6. When the Bay reaches the flats behind I-80.** The fill first reaches the transfer
  station, and with it the West Berkeley flats between I-80 and about Fourth St, once the
  level is above 13.35 ft NAVD88 (bisection: not at 13.348, yes at 13.354; the explorer's
  scenario uses 13.36). Berkeley land under water jumps from 66 ha at 13.2 ft to
  175 ha at 14.2 ft, and low ground that is not connected falls from 80 ha to 2 ha. The water's
  route runs east from the North Basin across the I-80 corridor about 250 m south of Gilman
  St; its highest point (13.35 ft) is just east of the freeway, near Eastshore Hwy, at about
  37.8812 N, 122.3073 W. The Draft EIR's ART-based maps put the site's first flooding at MHHW
  + 84 in, about 13.2 ft NAVD88 (F9); ART is dry there at + 66 in (11.7) and floods all of it at
  + 96 in (14.2). The level sits just above the City study's 2100 100-year level (13.0, W5).
  Bare-earth lidar removes bridges and may misrepresent ramps and embankments; the
  crossing needs the Caltrans profile to confirm (DATA_INVENTORY).
- **C7. Below that level, the flats flood from the land side.** Up to 13.35 ft, the transfer
  station and Second St are "low, not connected": the Draft EIR documents that Second St
  floods today in a 10-year rainstorm (F7, F8), and high Bay water backs up storm drains
  (W13). The explorer cannot say how a storm tide and rain together act on that ground.
- **C8. Facilities, median ground elevation (ft NAVD88).** Transfer station 13.8; DoubleTree
  11.5; Aquatic Park 3.1 (mostly lagoon); César Chávez Park 30.6.

- **C9. Drains change the "low, not connected" picture (D6).** With every outfall open, at
  this winter's highest tide (7.4 ft NAVD88) 31 ha of Berkeley low ground can fill through the
  drains (Aquatic Park watershed 25 ha, much of it the lagoon; Derby 6 ha), and Bolivar Dr is on
  it; at the 100-year level (9.73) 39 ha, with Second St (680 m), Bolivar Dr, Eastshore Hwy and
  Potter St; at 12 ft 67 ha, including 18% of the transfer station. With tide gates on every
  outfall, none. An upper bound until the City's outfalls and gates are known.
- **C10. Raised roads (P6, P7).** Spinnaker Way and University Ave west of I-80 raised to 12.7 ft
  NAVD88 keep every Berkeley street segment dry at the City study's 2050 100-year level (10.7),
  Marina Blvd included, because water reached it from University Ave. They are overtopped above
  12.7.
- **C11. Floodwalls as traced (P2, P3, P9).** At 10.7 ft the 2050 walls cut the DoubleTree
  grounds under water from 25% to 16% and leave Marina Blvd and University Ave under water; at
  13.0 the 2100 walls leave the hotel grounds 84% under water (88% with no walls) and University
  Ave under water for 1.4 km (1.8 km with none). The water goes around the walls' ends and
  reaches the hotel parking along the harbor, which the 2050 alignment leaves outside. The
  figures do not show how the walls tie into high ground, and the tracing is ±30 m, so this is
  a question to put to the alignment, not a verdict on the study's plan.

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
- **H5.** BCDC/MTC Adapting to Rising Tides (ART) Bay Area Sea Level Rise and Shoreline
  Analysis Maps (AECOM, 2017): flooding depth for total water levels of MHHW plus 12, 24,
  36, 48, 52, 66, 77, 84, 96 and 108 inches, connected to the Bay, with disconnected
  low-lying areas mapped separately; the same maps as the Draft EIR exhibits (F9). Served
  as polygons by Caltrans (caltrans-gis.dot.ca.gov, CHhqenvi/DEA_BCDC_polygon_SLR
  MapServer, depth classes in feet; no 84-inch layer in that service) and downloadable as
  county geodatabases from explorer.adaptingtorisingtides.org. Used as the published
  hazard layer the connected-fill rule is checked against, and shown in the explorer.

## Eric's decisions, 2026-11-02 (Claude Code session)

- **E1.** Show Ferris's 12 ft figure. Applied in `specification.md` (Scenarios): shown
  as stated, with our NAVD88 reading labeled inference and its source and wave content
  marked unconfirmed.
- **E2.** Show Albany and Emeryville only where they affect Berkeley, for example where a
  neighbor's failure to make comparable infrastructure investments leaves Berkeley
  exposed. Applied in `specification.md` (Extent): flanking, shared infrastructure,
  detours; neighbors' adopted plans and funded projects stated from their documents.
- **E3.** A joint scenario means the fire's egress would be harder. Eric noted the
  wildfire simulator models fall fires, while Bay floods come mostly in
  winter. Checked: the wildfire simulator's fires are fall fires on Diablo winds
  (`js/scenarios.js`, e.g. "a fall night, when Diablo winds are strongest"). Applied in
  `specification.md` (Joint scenario): a same-day November king tide case and a later
  sea level rise case in which segments are wet at every high tide.
