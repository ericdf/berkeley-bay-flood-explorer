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
- **W12** (Table 3-5, p. 3-18, PDF p. 54). Sample levels at Richmond: 1-year 7.33, 10-year 8.34,
  100-year 9.53, 500-year 10.59. The table's footnote: "There is considerable uncertainty in estimates of
  the 500-year extreme tide elevation, especially in the far South Bay."
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
  (W11). Used for: the "this winter's king tide" scenario (7.4) and, with W15's 0.5–1.0 ft,
  the "king tide plus 1 ft (El Niño)" sensitivity test (8.4).

## Water levels: El Niño, and the State's 2024 sea level rise guidance (read 2026-11-03)

Prompted by an outside review of the live explorer on 2026-11-03, which said the Kelvin wave
rows rested on press reports and the future levels on superseded guidance.

- **W15. El Niño adds 0.5 to 1.0 ft for months.** California Coastal Commission, *Sea Level
  Rise Policy Guidance*, Final Adopted 2024 Update (2024-11-13), Appendix A, p. 278: "strong
  El Niño events can temporarily elevate local sea levels by six to twelve inches over several
  months." The 2016 extreme-tide study says the same for the Bay: "Water levels are often 0.5
  to 1.0 ft above normal for months at a time" (p. 2-8, PDF p. 28). These are the
  primary statements behind H3's press figure. Used for: the two "plus 1 ft (El Niño)"
  scenarios, now labeled sensitivity tests. A Kelvin wave is one mechanism of that rise; the
  sources give the size of the El Niño rise, not of a single wave.
- **W16. The extreme tides already contain El Niño winters.** The 2016 study fitted its
  Central and North Bay extreme tides, which include point 518 (W11), to a 31-year modeled
  record, January 1, 1973, to December 31, 2003 (§3.2.1, p. 3-12, PDF p. 48). It names
  El Niño winters in 1977–78, 1982–83, 1997–98, 2009–10 and 2015–16 (p. 2-8, PDF p. 28); the first three
  fall in that record. Adding 1 ft to a return level therefore counts part of the El Niño
  effect twice, and the sum has no return period. Used for: the sensitivity-test labels.
- **W17. The 2024 scenarios at the San Francisco gauge.** Same Coastal Commission guidance,
  Appendix F, Table F-5 ("Sea Level Scenarios for San Francisco"), median rise in feet from a
  2000 baseline, including local vertical land motion, from the State Sea Level Rise Guidance
  (Ocean Protection Council, 2024): 2050 Intermediate 0.8, Intermediate-High 1.0, High 1.3;
  2100 Intermediate 3.1, Intermediate-High 4.8, High 6.5. The Alameda gauge (Table F-6) is
  0.2 lower in 2050 Intermediate (0.6) and 0.3 lower in 2100 Intermediate (2.8); Berkeley lies
  between the two gauges and no Richmond table is given, so the explorer uses San Francisco, the
  higher. Chapter 3, pp. 64 and 66: the guidance recommends analyzing the Intermediate scenario
  for low risk aversion (amenities such as public access), Intermediate-High for medium-high
  (most residential and commercial structures) and High for extreme risk aversion ("most
  critical infrastructure"). It replaces the 2018 guidance the City study used (W4, W5).
  Used for: six derived scenarios, today's 100-year storm tide (9.73, W11) plus each rise.
  Not read: the OPC document itself (opc.ca.gov refused automated access); the Coastal
  Commission reproduces its tables.
- **W18. Baselines (assumption).** The 2024 rises are measured from 2000 (W17). The 2016
  extreme tides are adjusted to "existing conditions" as of the 2011–2013 modeling (§3.2.1;
  the year is not stated). Adding the two, as the City study did with the 2018 rises (W5),
  counts the rise between 2000 and the modeling twice. At the Low scenario's pace (0.3 ft from
  2000 to 2030, W17) that is about 0.1 ft or less, not corrected.
- **W19. Measured water levels at Richmond, 2016–2025 (read 2026-11-04).** NOAA CO-OPS station 9414863,
  verified hourly heights and daily highs and lows, datum NAVD88, feet
  (`tools/fetch-noaa-richmond.py`; `data/raw/noaa/richmond-hourly.csv`, `richmond-highlow.csv`;
  public domain). Station datums: MHHW 17.63, MSL 14.84, MLLW 11.59, NAVD88 11.57 ft on station
  datum (1983–2001 epoch), so MHHW is 6.06 ft NAVD88. Used in C26.

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
- **F14. San Francisco Baykeeper and the transfer station (asked by Eric, 2026-11-03: "Berkeley
  has been dinged by the SF Baykeeper").** Confirmed.
  - Waste Dive, 2016-04-26 (Arlene Karidis, citing the Daily Californian, 2016-04-25): Baykeeper
    "filed a federal lawsuit against [the City of Berkeley] and Community Conservation Centers for
    allegedly discharging polluted storm water into the bay from the Berkeley Transfer Station and
    the Community Conservation Centers' recycling center", alleging Clean Water Act violations for
    five years "by surpassing a state-mandated limit on allowable storm water pollutants"; notice
    of intent sent November 6 (2015, our inference from the April 2016 filing).
  - San Francisco Baykeeper, "Berkeley Trash & Recycling Center Agrees to Protect the Bay from
    Toxic Runoff", 2016-06-09 (https://baykeeper.org/update/berkeley-trash-recycling-center-agrees-protect-bay-toxic-runoff/;
    the site refused automated access; Eric saved it as a PDF and supplied it, 2026-11-03). "For
    five years, rainwater running off the property was contaminated with a long list of
    pollutants, including aluminum, copper, iron, lead, zinc, excess acid, oil and grease." A
    "legally-binding agreement requires the operators to keep the site cleaner and repair cracked
    pavement. Compostable materials sorting has been moved indoors. Around the plastic and glass
    sorting areas, facility operators will install concrete berms and trench drains to capture
    the most contaminated storm water. The water will then be discharged to the sewer system for
    processing at an East Bay wastewater treatment plant. A cover will be installed over the area
    where the public brings in cans and bottles." If these "aren't enough to reduce pollution
    from the site in future rainy seasons, Baykeeper will require further pollution controls."
    The City funds the Rose Foundation for Communities and the Environment for Bay projects. The
    34th settlement in Baykeeper's "Bay-Safe Industry Campaign". The page does not say whether a
    court entered the agreement, how long it runs, or what monitoring it requires.
  What the sources establish: the complaint was about ordinary rain runoff from the working
  site, not flooding, and the remedy captures the most contaminated runoff and sends it to the
  sanitary sewer. What we infer, not established:
  - Controls built for rain falling on the site (berms, trench drains, capture) may not hold when
    Bay water or a rain pool stands on it, as the explorer shows can happen (C6, C12, F7, F8). No
    source read gives the controls' design capacity or assesses them under flooding; their flood
    performance is unconfirmed.
  - The captured runoff goes to the sanitary sewer, the system the 2014 consent decree (F15) is
    meant to relieve of wet-weather inflow. In a storm on a high tide, both the site's capture and
    the sewer would be under load at once.
  Used for: the environmental consequence behind E4, as context. Not used: Baykeeper's 2026
  ruling on creek pollution (Maven's Notebook, 2026-04-02), which concerns Sunnyvale and Mountain
  View, not Berkeley. Berkeley's sewers are under a separate consent decree (F15).
- **F16. Two more Berkeley Baykeeper settlements, beside the transfer station.** San Francisco
  Baykeeper, "Baykeeper's Legal Action to Clean Up Industrial Pollution"
  (https://baykeeper.org/baykeepers-legal-action-to-clean-up-industrial-pollution/; refused
  automated access; Eric saved it as a 31-page PDF and supplied it, 2026-11-03). Its Berkeley
  entries are the transfer station (p. 10, as in F14) and:
  - **Pacific Steel Casting Company** (p. 24): "Toxic brownish water will no longer gush toward
    San Francisco Bay from Pacific Steel Casting Company in Berkeley, as a result of Baykeeper's
    successful Clean Water Act lawsuit"; "the fourth largest steel foundry in the U.S., agreed in
    June 2013 to stop its rainy-season runoff pollution of the Bay", and funds restoration.
  - **Berkeley Forge & Tool, Inc.** (pp. 25–26): agreed in August 2012 "to reduce its
    rainy-season pollution" after Baykeeper notified it that its runoff, "which flows into storm
    drains that lead directly to the Bay, contained high levels of aluminum, copper, iron, zinc,
    and other pollutants"; upgrades include "carbon filters in downspouts".
  No Albany or Emeryville facility is named on the page. Pacific Steel's foundry has closed (F17).
  Terrain check (derived, `tools/report.mjs` functions; ground within 30 m of the OpenStreetMap
  point, Nominatim 2026-11-03; a site counts once at least 25% of that ground is affected):
  - Pacific Steel, 1333 Second St: ground 10.9–13.9 ft NAVD88 (median 12.0); can fill through
    the drains from 12 ft, outfalls assumed open; under Bay water from 13.4. OpenStreetMap also
    places Pacific Steel at 1421 Second St: ground 10.6–12.5 (median 11.7), the same thresholds.
  - Berkeley Forge & Tool, 1331 Eastshore Hwy: ground 8.7–11.5 (median 10.1); can fill through
    the drains from 11.03 (the 2050 High scenario); under Bay water from 13.4; 13% under the rain
    pool in the 10-year 6-hour experiment with gates, 10% held back, at 7.4 ft.
  All three Baykeeper sites in Berkeley sit within about 300 m of each other on Second St and
  Eastshore Hwy south of Gilman St, and all three join the Bay at the same modeled connection
  behind I-80 (C6), so one crossing decides their exposure to Bay water.
- **F17. Pacific Steel closed; the Gilman Gateway rezoning takes in both Baykeeper sites (Eric,
  2026-11-03: "One of those might be out of business").** Pacific Steel Casting's foundry shut
  down in 2018 after 84 years (Berkeleyside, 2018-09-06, headline only; the article refused
  automated access). The site and the former Berkeley Forge & Tool site are within the Gilman
  Gateway Rezone Project, about 10 acres along I-80, with a conceptual life sciences campus
  ("Gilman Forge"; Berkeleyside, 2023-03-27 and 2023-08-02, from search summaries, not read).
  City Council item, 2025-03-25, Item 8 ("Establishment of M-RD Zoning District"; read for the
  recommendation only): first reading of the M-RD zoning ordinance and adoption of the CEQA
  findings. It passed: the first reading of Ordinance 7,957-N.S. and Resolution 71,708-N.S.,
  certifying the EIR, were adopted, all ayes, with the second reading set for 2025-04-15 (annotated
  agenda, 2025-03-25, Item 8; C19).
  Response to Comments Document and Final EIR, Gilman Gateway Rezone Project, SCH# 2022120549,
  March 2025, 86 pp. (CEQAnet; read 2026-11-03), Response HAZ-2, "Sea Level/Groundwater Rise and
  Remediation Methods", pp. 3-20 and 3-21, answering EBMUD (letter 2024-12-02) and two Planning
  Commission speakers (2024-11-06):
  - A Response Plan, approved by DTSC before any demolition or construction permit, would use
    "source reduction (e.g., excavation and off-site disposal, in-situ groundwater treatment ...)",
    "engineering controls (e.g., capping of residual soil contamination and vapor intrusion
    mitigation systems)" and "institutional controls (e.g., land use covenants ...)".
  - Groundwater "in areas of known free product" (a separate petroleum layer floating on the
    groundwater, the document's footnote) may be pumped out and treated.
  - "Groundwater has been identified to be as shallow as 1.5 feet below the ground surface at
    the project site, and there is anecdotal evidence of Second Street flooding during periods of
    intense rainfall. Sea level rise could contribute to a rise in the already shallow groundwater
    levels at the project site and could also increase the flooding risks at the project site."
    A sub-slab venting system "would not function properly if it is beneath groundwater or flooded
    by surface water", which could expose occupants to vapor intrusion, "a potentially significant
    impact"; Mitigation Measure HAZ-2d requires the design to "account for potential shallow
    groundwater and flooding conditions".
  - "Potential PCB contaminated concrete" at the project site (Response HAZ-1, p. 3-20).
  What it bears on: the City's own EIR states that flooding and rising groundwater can defeat
  this site's contamination controls, and makes the design account for it, without a stated
  design water level in the pages read. The site's ground is 10.6–13.9 ft NAVD88 (F16); the
  explorer shows it filling through the drains from 12 ft with outfalls open and under Bay water
  from 13.4. The Draft EIR's hydrology section is read in F18; its Section 4.9 (hazards) is not.
- **F18. Gilman Gateway Draft EIR, Section 4.10 Hydrology and Water Quality (read 2026-11-03,
  asked by Eric).** *Gilman Gateway Rezone Project Draft EIR*, SCH# 2022120549, October 2024
  (CEQAnet, document 4, "Gilman Gateway Draft EIR_compiled_flat", 500 pp.; the section file is
  dated 1/2/24). Page numbers are the section's printed numbers.
  - p. 4.10-1: the site straddles the Schoolhouse and Gilman watersheds; "segments of the Gilman
    Street storm drain system do not have capacity to convey 10-year design storm flows ... The
    capacity limitation is related to tidal influence as well as floodwaters from Codornices Creek
    that overtop the banks and flow south on Second Street" (citing the City's Watershed
    Management Plan; matches F7, F8).
  - p. 4.10-3: groundwater 1.5 to 15 ft below ground, "likely to be perched groundwater on the Bay
    Mud". p. 4.10-4: the 2018 Phase I ESA found "multiple illegal releases or discharges to on-site
    storm drains" at Pacific Steel, a City Notice of Stormwater Violation, and "groundwater
    dewatering sumps and oil/water separators ... that discharged directly into the storm drain
    system"; "it is not known whether any stormwater protection measures have been maintained ...
    since" the 2018 closure. Berkeley Forge and Tool is "an active industrial facility" under the
    Industrial General Permit (as of the Draft EIR).
  - p. 4.10-5: FEMA Zone X (not a Special Flood Hazard Area); Zone AE, BFE 10 ft NAVD88, about
    700 ft west; Zone VE, BFE 13 ft NAVD88, on the shoreline at the Gilman St outfall. Caltrans's
    Gilman interchange study: the Gilman St storm drain "is low in elevation in relation to the
    FEMA Zone VE water surface elevation".
  - p. 4.10-6: sea level rise from the 2018 OPC guidance (likely range 1.6 to 3.4 ft by 2100 under
    high emissions; medium-high risk aversion 5.7 to 6.9 ft; extreme 10.2 ft).
  - p. 4.10-7: the ART maps show no inundation of the site up to MHHW (6.2 ft NAVD88) plus 7 ft
    and the whole site inundated at plus 8 ft; about 13.2 and 14.2 ft NAVD88 (derived), which
    brackets this explorer's modeled connection at 13.35 (C6). Caltrans: the Second St and Gilman St
    intersection is "susceptible to backflow through the storm drain system or overland tidal
    inundation when accounting for sea level rise".
  - Impact HYD-4, pp. 4.10-36 to 4.10-38: the BKF *Preliminary Sea Level Rise Vulnerability
    Assessment* (2022, not read) uses "a projected sea level rise of 3.4 feet by 2100 ... which
    accounts for Low Risk Aversion projects under a high emission scenario" and "recommends that
    the minimum finished floor elevations for critical infrastructure at the project site should
    be 13.4 feet NAVD 88, which is equal to the Base Flood Elevation at the nearest Special Flood
    Hazard Area of 10 feet NAVD 88 plus 3.4 feet." The Draft EIR adds: "it is not clear how FEMA's
    mapping of a Special Flood Hazard Zone with a Base Flood Elevation of 13 feet NAVD88 around
    the Gilman Street storm drain outfall could affect future flooding conditions". Unmitigated
    flooding of stored hazardous materials "would be a potentially significant impact";
    Mitigation Measure HYD-4 requires flood-proof hazardous materials storage and a future
    "Flooding and Sea Level Rise Assessment" before permits, with no design level stated.
  What it bears on (derived and inference, ours):
  - The Draft EIR, published October 2024, uses the 2018 guidance; the OPC adopted the 2024 update
    in June 2024 (Coastal Commission 2024 guidance, Executive Summary, p. 13: "in June 2024, the OPC adopted its most recent update"; W17). The section file is dated January
    2024, before that adoption.
  - The 13.4 ft floor is the BFE plus the 2018 low risk aversion rise. Today's 100-year storm tide
    plus the 2024 rises at the San Francisco gauge for 2100 are 12.83 (Intermediate), 14.53
    (Intermediate-High) and 16.23 (High) ft NAVD88 (C13): 13.4 is above the first, 1.1 ft below the
    second and 2.8 ft below the third. On the Draft EIR's own base of 10 ft they would be 13.1,
    14.8 and 16.5.
  - The guidance assigns High to "most critical infrastructure" (W17), and the BKF figure is for
    critical infrastructure. Whether anything on this site is critical infrastructure in the
    guidance's sense is not established here.
  - 13.4 is also about where this explorer's fill first reaches these flats over the surface
    (13.35, C6): a floor at 13.4 sits at the threshold, not above a margin.
  Not read: the BKF assessment, the Caltrans interchange study, Section 4.9 (hazards).
- **F19. The City's groundwater-rise screening of contaminated sites (read 2026-11-03; found by a
  research agent asked by Eric for "other industrial sites of concern").** Rincon Consultants for
  the City of Berkeley, *Groundwater Rise and Contaminated Site Analysis*, February 2025, 46 pp.
  (https://berkeleyca.gov/sites/default/files/2026-06/Ground%20Water%20Analysis%20Report%202025-02.pdf).
  PDF page numbers.
  - PDF p. 10: "High Priority – projected GWR [groundwater rise] at a contaminated site is at the
    ground surface (marine inundation, emergent groundwater) or within 6 feet (approximately 2
    meters) of the ground surface"; it assumes every site adjoins a sewer, storm drain or other
    utility corridor. PDF p. 11: "this is a screening analysis".
  - PDF pp. 11 and 13: 427 contaminated sites (open and closed) from GeoTracker and EnviroStor;
    under current conditions "100 are ranked as high priority, 100 as medium priority, and 227 as
    low priority".
  - Table 1, among others: Former Pacific Steel Casting (cleanup program, "OPEN - INACTIVE"; and
    DTSC "VOLUNTARY AGREEMENT ACTIVE"), groundwater "0 m; emergent", High Priority now and at both
    rises. City of Berkeley Transfer Station, 1201 Second St, "SINGLE-WALLED UST",
    "SWT-NO PLAN RETURNED", "0 m; emergent", High Priority (PDF p. 36). "KAISER BIOMEDICAL
    FACILITY", 1795 Second St, a closed leaking-tank case, "0 m; emergent", Low Priority
    (PDF p. 40).
    The transfer station's tanks have since gone: its Draft EIR (PDF p. 82 [2-28]) says the two
    10,000-gallon diesel USTs "are permanently closed as of November 14, 2025, and were removed in
    December 2025" (T4).
  What it covers and what it does not: the USGS CoSMoS groundwater model's rising groundwater and
  its marine inundation at mean higher high water, the average daily high tide, for today and two
  rises (0.8 and 2.5 ft); PDF p. 8 lists "Marine inundation (mean higher high water [MHHW] sea
  level)" among the model's outputs and PDF p. 10 overlays the sites on "the marine inundation and
  GWR projections". It does not consider storm tides above MHHW, Bay water through the storm
  drains, trapped rain, or what operating plants store; those are what this explorer adds (C15).
- **F20. The transfer station Draft EIR rejected another site (read 2026-11-03, asked by Eric).**
  Transfer station Draft EIR (SCH 2023080733; F6–F11), Chapter 6, Alternatives to the Proposed
  Project, §6.4.1 "Alternative Location", pp. 6-4 to 6-5: an alternative site would need to be "At
  least 7.48 acres in size", "Located on an infill site in an industrial area", "Designated and
  zoned for manufacturing", "Served by available infrastructure" and "Available for purchase and
  development". "No potential alternative locations were identified that could satisfy the
  above-referenced criteria"; "any such site would have similar characteristics as the project site
  and would not result in a reduction or avoidance of impacts at issue"; the alternative location
  "was rejected as infeasible". §6.4.2 rejects another use of the site because losing the transfer
  station and recycling facility, "vital public facilities", would cause "severe disruption".
  The two alternatives analyzed, No Project (1) and One Building (2), are both on the same site;
  for Alternative 2, p. 6-27, it is "on the same site as the proposed project, and subject to the
  same flooding and storm drainage issues". The chapter does not mention sea level rise or tsunami
  (searched for "sea level", "sea-level" and "tsunami").
  What it bears on (inference, ours): the site search tested size, zoning, infrastructure and
  availability, and whether another site would lessen the project's impacts; it did not test a
  site's exposure to flooding, sea level rise or tsunami. The site's median ground is 13.8 ft NAVD88
  over its mapped outline (`node tools/report.mjs`), inside the State's Tsunami Hazard Area (C16), reached by Bay water in this
  explorer at about 13.4 ft (C6), which the State's 2100 High scenario for critical infrastructure
  exceeds (16.23; C13, E4). Retreat for this facility (E6) was not on the table in the EIR.
- **F21. How the transfer station compares with other cities' arrangements (read 2026-11-03,
  asked by Eric: "What do other cities do for a transfer station? Do they all have one?").**
  - City Council work session, 2019-11-05, Item 1, "Solid Waste and Recycling Transfer Station
    Feasibility Study Presentation" (berkeleyca.gov; 415 PDF pages, the study attached). PDF p. 1:
    the transfer station at 1201 Second St "opened in 1983, handling both City curbside collected
    and self-haul refuse"; recycling, run by Community Conservation Centers, moved there in the
    late 1980s, with a universal waste drop-off. Both concepts park "110+ service vehicles" on the
    site. PDF p. 105, "Potential Risk Design Factors" from the 1980 EIR: "100-year flood hazard area
    and impact to critical City waste transfer operations"; also liquefaction and "caustic lime
    bed areas". PDF p. 31: the designs add "a northerly berm wall to redirect occasional creek
    surges" from Codornices Creek. The pages searched do not mention sea level rise or tsunami.
  - PDF p. 107, Table 1, compares Berkeley's fees with three other Bay Area transfer stations:
    Davis Street (San Leandro), Golden Bear (Richmond) and Shoreway (San Carlos).
  - WM's Davis Street Transfer Station page (wmnorcalnev.com, read 2026-11-03): the facility is
    "particularly relevant for residents, contractors and businesses in San Leandro, Oakland,
    Hayward, Emeryville, Albany and other Alameda County communities"; its trash goes to Altamont
    Landfill. A marketing page; each city's franchise agreement, not read, would say where its
    hauler takes waste.
  What it bears on (inference, ours): Berkeley owns and runs its own transfer station; neighbors
  whose waste is collected by a franchised hauler rely on a regional, privately run station such
  as Davis Street. So a city need not have its own, and "retreat" for Berkeley's station need not
  mean a new Berkeley site (E7). The City's own design record names the flood hazard to "critical
  City waste transfer operations" (p. 105), which supports E4. Whether Davis Street or Golden Bear
  are themselves exposed to flooding was not checked; both are outside this explorer's grid.
- **F15. The 2014 sewage consent decree (read 2026-11-03, asked by Eric).** *United States et
  al. and San Francisco Baykeeper et al. v. EBMUD et al.*, Final Consent Decree, Consolidated Case
  Nos. C 09-00186-RS and C 09-05684-RS (N.D. Cal.), 187 pp.
  (https://19january2017snapshot.epa.gov/www3/region9/water/npdes/pdf/ca/ebmud/ebmud-final-consent-decree-2014-07-28.pdf).
  Page numbers are the decree's.
  - p. 8: EBMUD takes wastewater from seven "Satellites", Berkeley among them; "During wet weather,
    EBMUD at times discharges wastewater from three wet weather facilities", at 5597 Oakport St,
    Oakland; 2755 Point Isabel St, Richmond; and 225 5th Ave, Oakland.
  - pp. 31–32: Berkeley pays civil penalties of $133,500 to the United States and $133,500 to the
    Water Boards.
  - p. 33: the work is expected to reduce inflow and infiltration (I&I) enough "to eliminate WWF
    Discharges ... by no later than December 31, 2035".
  - pp. 66–70 (Section X, "Work – City of Berkeley"): the goal of "eliminating SSOs [sanitary
    sewer overflows] and further reduce I&I"; rehabilitate at least 22,120 ft of sewer mains a
    year for twelve fiscal years; inspect older mains; eliminate inflow and rapid infiltration
    sources found by EBMUD's program, high-priority ones within 24 months.
  - Nothing in the decree mentions tides or sea level (searched for "tide", "tidal", "sea
    level", "bay water"). Its target is rain-driven inflow into sanitary sewers.
  What it bears on (our inference): the sanitary sewers and the storm drains are separate
  systems in Berkeley, and the explorer models only storm drains (D1–D6). Bay water or trapped
  rain standing over sewer maintenance holes in the flats is one more route for I&I, the thing
  the decree is meant to cut. Not modeled; the City's sewer data are not in the explorer. The
  Point Isabel wet weather facility is on the Richmond shoreline north of Albany, at the edge of
  the terrain grid; it was not located precisely or checked against the terrain.

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
- **F7** (p. 3.9-12 [454]). The site is in FEMA's 0.2 percent annual chance (500-year)
  flood hazard area, "generally between I-580/I-80 and Fourth Street". The storm drain
  infrastructure downstream of the site, down to the Gilman Street outfall, "is currently
  undersized for the 10-year peak flow event"; flows
  above it "backup within the storm drain system and cause ponding on surface streets".
- **F8** (p. 3.9-12 [454], footnote 18). The Codornices Creek culvert under I-80
  constricts flow and induces flooding on Second St beside the site; per Klein (2009, for
  Caltrans) the creek overtops upstream of I-80 above 190 cfs, and Balance Hydrologics'
  2011 City model shows flooding at Second St in the 10-year 6-hour design storm. Appendix
  H (p. 18 [22]): the I-80 culvert "lacks the necessary conveyance for events equal to or
  greater than the 10-year recurrence interval."
- **F9** (pp. 3.9-11 to 3.9-21 [453–463], Exhibits 3.9-2a–d, maps by AECOM, June 2017).
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
- **P5.** Costs (executive summary and §5.4, cumulative; the study states no price year): revetment and breakwater
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
  One gate is documented at design stage: the I-80/Gilman interchange project's tidal flap gate at
  the Gilman outfall (V3); whether it was built is unchecked.

## Explorer checks and findings (derived, 2026-11-02)

Reproduce with `node tests/check.mjs`, `node tools/report.mjs` and `node tools/overtop.mjs`.
"Under water" is the connected fill (model rule, `js/fill.js`); areas count Berkeley land only
(Census place boundary, excluding open water).

- **C1. Terrain against the published ART maps (H5).** Agreement between the fill and ART's connected flooding on Berkeley land (cells under water in both, over cells under water in either), by level:

  | ART level | ft NAVD88 | Agreement |
  |---|---|---|
  | MHHW + 12 in | 7.20 | 70% |
  | + 24 in | 8.20 | 77% |
  | + 36 in | 9.20 | 81% |
  | + 48 in | 10.20 | 81% |
  | + 52 in | 10.53 | 87% |
  | + 66 in | 11.70 | 91% |
  | + 77 in | 12.62 | 92% |
  | + 84 in | 13.20 | 93% |
  | + 96 in | 14.20 | 95% |
  | + 108 in | 15.20 | 96% |

  The ten layers are `Alameda_inundation_poly_<N>` from the ART Alameda County geodatabase (retrieved 2026-11-04, `tools/fetch-art-dc.py --connected`).

  - **Datum.** The geodatabase stores NAD83 / UTM zone 10N; its spatial reference names no realization, so NAD83(2011) is assumed. `tools/build-art-dc.mjs` moves every vertex to the explorer grid's WGS 84 / UTM zone 10N with EPSG:7807 (ITRF2008 to NAD83(2011), Pearson and Snay 2013, inverted; WGS 84 (G1762) taken as ITRF2008) at epoch 2017.0. That is a shift of 1.44 m west and 0.28 m north at Berkeley (`tools/nad83.mjs`; PROJ gives the same to 0.01 mm). Before 2026-11-04 the coordinates were used unshifted. That left the geodatabase about 1.5 m east of the Caltrans polygons.
  - **Effect of the shift.** It raised agreement with the Caltrans service at all seven levels both carry: from 74% to 82% at + 12 in (7.20 ft NAVD88); at + 108 in (15.20 ft NAVD88) it stays at 93%. Against the fill, agreement fell by 0.4 to 1.3 points at + 12 to + 48 in (7.20 to 10.20 ft NAVD88) and rose by 0.2 to 0.6 points at + 52 to + 108 in (10.53 to 15.20 ft NAVD88). Pooled over the ten levels it rose from 92.9% to 93.2%. ART's flooding on ground above the water level fell at every level, from 22.5 ha to 19.0 ha pooled. Offsetting the unshifted polygons in 0.5 m steps, the best match to the fill lies about 1 m west and 1 to 1.5 m north of them. The west part is the datum shift. The remaining 1 m northward offset is not explained (derived; not applied).
  - **Earlier source and why it was replaced.** Until 2026-11-04 the explorer used the Caltrans service (CHhqenvi/DEA_BCDC_polygon_SLR) for + 12, 24, 36, 52, 66, 96 and 108 in. Its agreement with the fill was 68% to 91%. That service returned no polygons for + 48 and + 77 in (two tries each) and has no + 84 in layer. Its + 96 and + 108 in layers (14.20 and 15.20 ft NAVD88) include 11.4 and 7.8 ha of ground more than 1 ft above the water level, against 1.7 and 2.7 ha in the geodatabase. Its + 96 in layer covers all of the transfer station; the geodatabase's covers 56%, close to the 57% of the site's ground below 14.20 ft NAVD88 and to the fill's 57%. So the Caltrans + 96 in layer is missing dry islands. Eric chose the geodatabase for all ten levels on 2026-11-04 (PR 8). `tools/fetch-art.py` and `tools/build-art.mjs` remain to reproduce the Caltrans comparison.
  - **Simplification.** For size, the clips were simplified (`tools/simplify-art-dc.mjs 0.5`, 24.0 MB to 14.1 MB). Rings that cannot change a 4 m cell were dropped, which changes no cell. Then Douglas-Peucker at 0.5 m changed 0.25% to 1.3% of each mask's cells and agreement with the fill by at most 0.2 points.
  - **Terrain.** With a 4 m bilinear export of the same lidar, agreement was 54–62% at the four lowest levels, because the fill wet ground behind narrow structures such as the revetment along University Ave east of the Marina. Averaging 1 m cells fixed most of that, so the explorer uses it (F13).
  - **Where the two differ.** Through + 77 in (12.62 ft NAVD88) the fill wets more than ART, by 0.3 to 1.1 ha. From + 84 in (13.20 ft NAVD88) up, ART wets slightly more, by 0.4 to 2.0 ha.

  Reproduce with `node tests/check.mjs`.
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
  37.8812 N, 122.3073 W. The Draft EIR's ART-based maps put the site's first flooding at MHHW + 84 in, about 13.2 ft NAVD88 (F9). ART's + 84 in layers (13.20 ft NAVD88; `art-84.bits`, `art-dc-84.bits`) show that as a disconnected low-lying area covering 41% of the site, with no connected flooding there (C20). ART has no connected flooding there at + 66 in (11.70 ft NAVD88), where its disconnected layer covers 14%. At + 96 in (14.20 ft NAVD88) it floods 56% of the site from the Bay, close to the share of the site's ground below 14.20 ft NAVD88 (57%) (C1). The Caltrans service's + 96 in layer, which the explorer no longer uses, covered all of it. The level sits just above the City study's 2100 100-year level (13.0, W5).
  Bare-earth lidar removes bridges and may misrepresent ramps and embankments; the
  crossing needs the Caltrans profile to confirm (DATA_INVENTORY).
- **C7. Below that level, the flats flood from the land side.** Up to 13.35 ft, the transfer
  station and Second St are "low, not connected": the Draft EIR documents that Second St
  floods today in a 10-year rainstorm (F7, F8), and high Bay water backs up storm drains
  (W13). The explorer cannot say how a storm tide and rain together act on that ground.
- **C8. Facilities, median ground elevation (ft NAVD88).** Transfer station 13.8; DoubleTree
  11.5; Aquatic Park 3.1 (mostly lagoon); César Chávez Park 30.6.

- **C9. Drains change the "low, not connected" picture (D6).** With every outfall open, at
  this winter's highest tide (7.4 ft NAVD88) 5.1 ha of Berkeley land can fill through the drains
  (Aquatic Park watershed 3.0 ha, Derby 2.1 ha), including Bolivar Dr; at the 100-year level (9.73)
  13.2 ha, with Second St (680 m), Bolivar Dr, Eastshore Hwy and Potter St; at 12 ft 40.4 ha,
  including 18% of the transfer station. With tide gates on every outfall, none. Land counts leave
  out the Aquatic Park lagoon (ground below mean sea level, not connected to the Bay); a first
  version counted it and reported 31, 39 and 67 ha. An upper bound until the City's outfalls and
  gates are known.
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

## Rain on a high tide: sources (read 2026-11-03)

- **R1.** NOAA Atlas 14, Volume 6 (California), Precipitation Frequency Data Server, point
  37.870 N, 122.295 W, partial-duration series, depth in inches (`data/raw/noaa/atlas14-berkeley.json`).
  6-hour storm: 1-year 1.14, 2-year 1.40, 10-year 2.04, 100-year 3.10. 24-hour: 2-year 2.46,
  10-year 3.76, 100-year 5.93. 60-minute: 10-year 0.783.
- **R2.** NLCD 2021 percent developed imperviousness (MRLC GeoServer WCS, 30 m), averaged over each
  City watershed (`tools/fetch-impervious.py`, `data/raw/nlcd/impervious-by-watershed.json`):
  Gilman 79.2%, Schoolhouse 65.8%, Derby 61.5%, Cerrito 42.9%, Strawberry 40.0%, Aquatic Park
  39.1%, Marin 36.9%, Codornices 34.6%, Wildcat 15.9%, Temescal 14.6%.
- **R3.** Runoff share from imperviousness: the Simple Method, Rv = 0.05 + 0.009 × percent
  impervious (Schueler, *Controlling Urban Runoff*, Metropolitan Washington Council of Governments,
  1987). Formula from general knowledge; the publication was not re-read here. EPA, *BASINS 4.5
  Core Manual* (2019, partial 508 version; read 2026-11-03), PLOAD chapter, PDF p. 427: annual
  pollutant loads "may be calculated ... using ... EPA's Simple Method", "an empirical approach
  developed for estimating pollutant export from urban development sites", whose "application is
  limited to small drainage areas of less than one square mile" (citing EPA's 1997 *Compendium of
  Tools for Watershed Assessment and TMDL Development*). The manual's equations are images that do
  not extract, so it does not confirm the coefficients above. Two departures, both exploratory
  assumptions a hydrologist should review: the explorer applies the method to one design storm,
  not a year; and four of the six watersheds that pool rain exceed one square mile (2.59 km²):
  Derby 9.16 km², Strawberry 8.00, Schoolhouse 2.79, Codornices 2.72 (R4); Gilman (0.88) and
  Aquatic Park (0.53) are within it. Gives Gilman 0.76,
  Schoolhouse 0.64, Derby 0.60, Strawberry 0.41, Aquatic Park 0.40, Codornices 0.36. The Alameda
  County Flood Control District's Hydrology and Hydraulics Manual (2016) has its own runoff
  coefficients; its PDF could not be retrieved (the server answered with a script, not the file).
- **R4.** Watershed areas (`tools/build-drains.mjs`, from D1 in UTM): Derby 9.16 km², Strawberry
  8.00, Schoolhouse 2.79, Codornices 2.72, Gilman 0.88, Aquatic Park 0.53; most of Derby,
  Strawberry and Codornices lie east of the map, and their runoff reaches the flats through the
  same drains.
- **R5.** Rule (model rule, `js/rain.js`): runoff = rain × runoff share × share that cannot drain
  × watershed area; it comes up at the watershed's lowest inlet not under Bay water and fills the
  ground around it upward (one pool per watershed), stays inside the watershed, and stops rising
  when it reaches Bay water. The share that cannot drain stands for how long the outfalls are
  closed by the tide during the storm; the City's outfall inverts are not published, so the page
  offers 100%, 50%, 25% and 10%. An illustrative storage experiment, not an upper bound: one pool
  per watershed overstates depth at that inlet and misses ponding elsewhere, and the pool stops at
  the watershed's boundary (revised 2026-11-03 after an outside review).
- **C12. Rain results (derived; revised after Codex review of PR #3, which found the first
  version created water when a pool spilled into a hollow below its surface).** At this winter's
  highest tide (7.4 ft NAVD88), with tide gates on every outfall, a 10-year 6-hour storm (2.04 in)
  pools on Berkeley land as follows, by share of the runoff that cannot drain: 100%, 49.4 ha;
  50%, 32.9 ha; 25%, 22.9 ha; 10%, 11.1 ha. For the 2-year 6-hour storm: 39.9, 27.8, 17.5 and
  8.9 ha; for the 100-year 6-hour storm: 57.1, 42.3, 29.1 and 16.0 ha. Each pool holds its
  watershed's runoff to within 1 cm of rounding (`tests/check.mjs`). Second St is under pooled
  rain in every case tested, 1.3–1.8 km of it, which matches the Draft EIR's 10-year flooding there
  (F8); its deepest point, which may be where Codornices Creek crosses, ranges from 2.5 to 7.0 ft
  of water. The transfer station is 10–54% under pooled rain across these cases. The pools start
  at the lowest inlets: Gilman and Codornices on Second St beside the transfer station, Aquatic
  Park and Strawberry on Bolivar Dr, Derby by Eastshore Hwy near Ashby Ave. Above about half the
  runoff held back, the Strawberry, Gilman and Derby pools reach the I-80 corridor and spill to
  the Bay. A plan's walls and raised roads count as ground for the pools.
- **C13. The State's 2024 scenarios (W17, W18).** Today's 100-year storm tide plus each rise at
  the San Francisco gauge, connected fill, no plan, outfalls assumed open:
  - 2050: Intermediate 10.53 ft NAVD88, 23 ha of Berkeley land under water, no Berkeley street
    segment under water, 19 ha that can fill through drains; Intermediate-High 10.73, Marina
    Blvd (675 m) and University Ave (282 m) under water, DoubleTree grounds 27%; High 11.03,
    32 ha, 1.0 km of Berkeley streets, DoubleTree grounds 37%.
  - 2100: Intermediate 12.83, 60 ha, 3.2 km of streets, DoubleTree grounds 86%, transfer
    station not reached; Intermediate-High 14.53, 162 ha, 24 km, transfer station grounds
    60%, I-80 under water; High 16.23, 200 ha, 33 km, transfer station grounds 81%.
  - The modeled connection behind I-80 (13.35, C6) is a rise of 3.62 ft on today's 100-year
    tide. Interpolating Table F-5's decades linearly, the median rise reaches 3.62 ft about
    2076 under High, 2088 under Intermediate-High and 2107 under Intermediate. The guidance
    names High for "most critical infrastructure" (W17), and the project treats the transfer
    station as critical infrastructure (E4), so the High date, about 2076, is the one the
    guidance points to. All three dates inherit C6's
    unquantified uncertainty and W18's baseline offset.

- **C14. Kaiser Permanente sites (asked by Eric, 2026-11-03).** Two Kaiser addresses in
  OpenStreetMap (Nominatim, read 2026-11-03), checked against the terrain and the fill:
  - The Berkeley Medical Offices, 2610 10th St off San Pablo Ave, opened May 2021 (Berkeleyside,
    2021-03-24): ground 49.8 to 55.5 ft NAVD88 over the site's bounding box, median 54.1. No
    scenario reaches it, the highest (16.23) included, with or without the rain experiment:
    the ground is 33 ft or more above that level. Bay flooding is not its exposure; earthquake
    shaking and liquefaction are outside this explorer.
  - 1780 Second St, between Hearst Ave and I-80, listed by business directories as Kaiser
    Permanente Construction Services and the Kaiser Permanente Foundation, an office, not a clinic
    (the listings disagree on name and phone; not confirmed with Kaiser). Ground 9.4 to
    12.2 ft NAVD88 within 30 m of the point, median 10.7. Outfalls assumed open, 67% of that ground
    can fill through the drains at 11.03 (2050 High) and 98% at 12; under Bay water at 13.4 and
    above. With gates and a 10-year 6-hour storm, 10% of the runoff held back, the Schoolhouse
    watershed's rain pool (surface 10.8 ft NAVD88) covers 54% of it, at any tide from 7.4 to
    9.73: the illustrative experiment puts that watershed's pool there.
  Not checked: whether Kaiser has a newer Berkeley project; searches on 2026-11-03 found none
  after the 2021 building.
  Across Second St, a closed leaking-tank case at "KAISER BIOMEDICAL FACILITY", 1795 Second St,
  has groundwater "0 m; emergent" in the City's screening (F19).

- **C15. Industrial and contaminated sites against the fill (derived, 2026-11-03).** Sites from a
  research agent's search of the state and federal databases. The points, the record each point
  comes from (GeoTracker global ID, EPA FRS/RCRA ID, SMARTS WDID) and the C14 and F16 sites are in
  `data/sites-checked.json`; `node tools/site-check.mjs` reproduces every figure here, in C14 and in
  F16. Method: ground within 30 m of the point, a site counting once 25% of that ground is affected
  at a scenario level, outfalls assumed open for the drain column; rain pool from the 10-year
  6-hour experiment with gates, 10% held back, Bay at 7.4. What the records say about each site
  (contaminants, case status) was the agent's reading; for the six panel sites it was re-read
  against the State record on 2026-11-03 (C18).
  - On ground the explorer floods: former Pacific Steel (GeoTracker point; ground 9.8–12.3 ft
    NAVD88; drains from 11.03, Bay from 13.4); 1255 Eastshore Hwy, solvents in groundwater per the
    database (10.7–12.0; drains from 12, Bay from 13.4, 19% under the rain pool in the 10-year
    experiment); Berkeley Marine Center boatyard, 1 Spinnaker Way, open lead and copper case
    (median 13.3; Bay from 12.83); Terminal Manufacturing, 707 Gilman St, open PCE case (12.6–15.7;
    Bay from 14.53); Eastshore State Park shoreline parcels (14.6–16.2; Bay from 16.23).
  - No scenario puts 25% of their ground under water (median ground 18 ft NAVD88 or higher):
    former Flint Ink, 750 Gilman St (lowest ground 15.4);
    WRE/Colortech, 1225 Sixth St; Peerless Lighting site, Fourth St; Electro-Coatings, 893 Carleton
    St; Bayer, 800 Dwight Way; Ravago / Pacific Coast Chemicals, 2424 Fourth St (29.1–31.1, after
    the point correction in C17). Rising groundwater (F19) is their exposure, not surface flooding.
  - The former Berkeley Landfill under César Chávez Park: the database point is on the park's top
    (about 52 ft). A still-water fill does not describe its hazard, which is waves and Bay water on
    its shoreline edges and groundwater in the waste; not assessed here.

- **C16. The State's Tsunami Hazard Area against Berkeley (derived, 2026-11-03; H6).** 295 ha of
  Berkeley land (ground above mean sea level, outside the open Bay) lies inside it, on ground up to
  about 50 ft NAVD88 at the 99th percentile. All four mapped places are inside it in full: the
  transfer station, the DoubleTree grounds, César Chávez Park (the former landfill) and Aquatic
  Park. Of the sites in `data/sites-checked.json` (`node tools/site-check.mjs`), inside: the Kaiser office at 1780 Second St, Pacific Steel, Berkeley
  Forge & Tool, 1255 Eastshore Hwy, the Berkeley Marine Center, Terminal Manufacturing, Eastshore
  State Park parcels and former Flint Ink. Outside: the Kaiser medical offices on 10th St,
  WRE/Colortech, the Peerless site, Electro-Coatings, Bayer and Ravago / Pacific Coast Chemicals
  (C17).
- **C17. Ravago's point corrected (2026-11-03).** The first check used EPA ECHO's point for 2424
  Fourth St (37.869596, −122.300512), which lies near University Ave, about 1 km north of the
  2400 block; the tsunami mitigation research flagged it. Nominatim geocodes the address at
  37.8607986, −122.2978195. With that point the site's ground is 29.1–31.1 ft NAVD88, outside every
  scenario and outside the tsunami hazard area; C15 and C16 earlier placed it on 15.2–17.3 ft ground
  inside the area. The City's hazard mitigation plan lists "PC Cargo, 2424 Fourth Street" among its
  high-risk facilities (T2); that PC Cargo is the same business is an inference from the address.

- **C18. The six panel sites re-read against the State record (2026-11-03; Eric asked).** Source:
  the State Water Board's GeoTracker site export, `geotracker_sites_2026-10-01.csv` on data.ca.gov
  (dataset "Ground Water - Water Quality Regulatory Information"), which carries each case's status,
  contaminants, media and site history; the GeoTracker website itself refuses automated access. Each
  point in `data/sites-checked.json` matches the export's latitude and longitude. What changed:
  - 1255 Eastshore Hwy (T10000011080): TCE, DCE, vinyl chloride, ethylbenzene and gasoline in soil,
    shallow groundwater and soil vapor; open, eligible for closure (2022-04-21); the chlorinated
    solvents detected in 2019 "are belived to be from an off-site source" (sic). The agent's
    "solvents in groundwater" left out the hydrocarbons, the near-closure status and that note.
  - Berkeley Marine Center (T10000001877): copper, lead and other metals in soil; open, site
    assessment (2020-07-24); found after a City Parks complaint, by 2008, more on the waterfront in
    2009; stopped by "Procedural changes and stormwater collection and filtering". Confirmed. The
    record does not say whether the boatyard operates now; the panel says so.
  - Terminal Manufacturing (T10000009006): PCE, diesel and gasoline in groundwater and soil vapor;
    open, verification monitoring (2023-07-05); groundwater treatment injections reported in 2020.
    Confirmed; operation now is likewise not in the record.
  - Eastshore State Park remainder (SL0600164054): PCBs, lead and other metals in soil and
    groundwater; open, long-term management (2024-12-03); Order 98-072; 4,600 cubic yards dug out
    at 17 locations in 1998; cap maintenance and shoreline erosion control with annual inspections.
    Confirmed; the record covers the park across several cities, not one Berkeley parcel.
  - Former Flint Ink (SL0600172262): lead, kerosene, other petroleum, TPH; open, eligible for
    closure (2021-10-22); VOCs in groundwater in the northeast corner; 19,000 tons of soil and about
    370,000 gallons of groundwater removed in 2005–06; two possibly leaking USTs closed in place
    under slabs. The agent's "solvents" is better read as VOCs and petroleum.
  - Berkeley Landfill (L10006224883): a land disposal site, open, verification monitoring
    (2009-09-25); "The City perfomred a groundwater investigation to identify potential impacts.
    None were identified" (sic). The order's own facts are in T5.
  The flood and tsunami figures for these sites (C15, C16) do not change.

- **C19. Citation spot-check (2026-11-03).** 20 of the 74 rows that cite a document were checked
  against the documents: 10 matched, 6 had a page or wording slip, none had a wrong figure or
  quote, and 4 could not be checked. The draw was seeded (Python `random.seed(20261103)`) and gave
  F11, F16, F17, F19, F21, F3, F5, F7, F9, H4, M2, P9, T2, W12, W16, W7, W8, Z3, Z4 and Z6. Five
  draws cite no document to read (F5, M2, P9, H4, Z6) and were replaced by the next draws in the
  same order: P5, F20, T4 and T5, then W13, taken by hand in place of R2 (a data fetch) and W15.
  Documents came from `berkeley-public-records` where it holds them, otherwise from the cited URLs.
  - Matched: F3, F11, F19, F20, T4, T5, W7, W8, W13, Z3.
  - Corrected: P5 (the study states no price year; "2019 dollars" was ours), F7 (PDF page, and
    the undersized part is the downstream system to the outfall, not the outfall alone), F9 (PDF
    pages), F17 (the PCB sentence's page and wording; the Council vote, found in the annotated
    agenda), W12 (printed page, and the footnote quoted in full), W16 (printed pages). F8 shares
    F7's page and was corrected with it; W15, outside the sample, cited the wrong PDF page and was
    corrected.
  - Not checked: F16 (baykeeper.org refused automated access; needs the PDF), F21 and Z4 (the
    2019-11-05 feasibility study and the 2015-02-10 franchising study are not in the archive and
    the rows give no URL), T2 (the 2024 Local Hazard Mitigation Plan is not archived; its page
    numbers were taken from an agent's reading).
  - Not sampled and possibly affected: F6 gives p. 3.9-8 as PDF [449], which does not fit the
    offset found for p. 3.9-12; unchecked.

- **C20. "Low, not connected" against ART's disconnected low-lying areas (H5).** ART maps ground below its water surface that is not hydraulically connected to the flooded area, in patches over one acre (ART GIS data catalog, p. 2). The source is the Alameda County geodatabase (`tools/fetch-art-dc.py`, `tools/build-art-dc.mjs`), moved from NAD83 to the grid's WGS 84 as in C1.

  On Berkeley land, with the Aquatic Park lagoon left out, the explorer's low, not connected cells and ART's agree (both over either) as follows:

  | ART level | ft NAVD88 | All patches | Explorer patches over one acre only |
  |---|---|---|---|
  | MHHW + 12 in | 7.20 | 78% | 84% |
  | + 24 in | 8.20 | 70% | 82% |
  | + 36 in | 9.20 | 78% | 81% |
  | + 48 in | 10.20 | 84% | 87% |
  | + 52 in | 10.53 | 80% | 87% |
  | + 66 in | 11.70 | 88% | 90% |
  | + 77 in | 12.62 | 90% | 94% |
  | + 84 in | 13.20 | 90% | 93% |

  The one-acre column drops the explorer's patches under one acre, a model rule matching ART's threshold. Before the datum shift (2026-11-04) the figures were 70–90% with all patches and 81–93% with patches over one acre only.

  - ART puts no disconnected ground where the fill has water at any level. ART's connected flooding covers at most 0.7 ha of the explorer's low ground, at + 96 in (14.20 ft NAVD88).
  - Bolivar Dr, Second St, Eastshore Hwy and the transfer station are disconnected in both at + 84 in (13.20 ft NAVD88). They are flooded from the Bay in both at + 96 in (14.20 ft NAVD88), consistent with C6's 13.35 ft NAVD88.
  - At + 84 in (13.20 ft NAVD88) ART has the transfer station 0% connected and 41% disconnected; the explorer has 42% low, not connected. So the Draft EIR's "begin to experience inundation at the MHHW plus 84-inch SLR scenario" (F9) matches ART's disconnected area, not Bay water reaching the site (our reading). The + 84 in connected layer agrees with the fill at 93% on Berkeley land (C1).
  - The explorer can show the disconnected areas as an optional lime outline at the ART outline's level.
  - Both maps use lidar terrain and a still-water connectivity rule, so this tests the explorer's classification, not the hazard. ART's report says these areas may connect through culverts and storm drains and may flood from groundwater (§3.5, pp. 20–21).
  - The lagoon (26.3 ha below mean sea level) is disconnected in both through + 84 in (13.20 ft NAVD88) and is counted apart (C9).

  Reproduce with `node tools/compare-art-dc.mjs`.
- **C21. Terrain against USGS CoSMoS v2.1 (H1).** For each CoSMoS scenario, we searched for the still-water level at which the connected fill best matches CoSMoS's flooded extent on Berkeley land (both / either, as C1; levels 6.0–30.0 ft NAVD88 in 0.05 ft steps; derived).

  - **100-year storm:**

    | Sea level rise | Best agreement | At (ft NAVD88) |
    |---|---|---|
    | 1.0 m | 47% | 11.20 |
    | 1.25 m | 63% | 12.40 |
    | 1.5 m | 70% | 13.15 |
    | 1.75 m | 71% | 13.35 |
    | 2.0 m | 68% | 13.35 |

    At 0–0.75 m the agreement is 13–45%. There CoSMoS floods 1.4–14 ha and keeps dry the North Basin shoreline strip (37.8749 N, 122.3089 W) and the west edge of Aquatic Park, which the fill wets.
  - **Background tide, 0–0.75 m of rise:** best agreement 6–18%, with CoSMoS flooding 0.5–2.2 ha of Berkeley land (`data/hazard/cosmos.json`; Codex review, PR #10).
  - **The Marina agrees.** At 1.5 m + 100-year, the DoubleTree grounds are 83% flooded in CoSMoS and 89% in the fill; Marina Blvd is 93% and 98%.
  - **The flats behind I-80.** CoSMoS floods none of the transfer station, Second St, Bolivar Dr, Eastshore Hwy or the I-80 corridor at 37.8812 N, 122.3073 W in any scenario up to 2.0 m. That holds although its water surface over the Bay off Berkeley reaches 13.82 ft NAVD88 (2.0 m, 100-year storm) and 14.21 ft NAVD88 (2.0 m, background tide). At 5 m it covers all of the transfer station.
  - **At 5 m** the fill matches at 22.3 ft NAVD88 (background tide) and 23.55 ft NAVD88 (100-year storm), both 94%. A first run searched only to 16.5 ft NAVD88 and reported that edge as the best match (Codex review, PR 8); the search range is now stored in `cosmos.json`, and a test fails if a best match sits at its edge.
  - **What this does not test.** The fill crosses at 13.35 ft NAVD88 (C6) and ART at + 96 in (14.20 ft NAVD88, C1). CoSMoS's surface is a total water level, so it does not test the still-water threshold directly, and its handling of the freeway embankment is not documented. C6 stays a question for the Caltrans profile.
  - **Closest ART maps,** among all ten levels (`node tools/cosmos-report.mjs`; ART from the shifted geodatabase, C1):

    | CoSMoS scenario | Closest ART map | Agreement |
    |---|---|---|
    | 1.0 m + 100-year | + 66 in (11.70 ft NAVD88) | 46% |
    | 1.25 m + 100-year | + 66 in (11.70 ft NAVD88) | 59% |
    | 1.5 m + 100-year | + 84 in (13.20 ft NAVD88) | 71% |
    | 1.75 m + 100-year | + 84 in (13.20 ft NAVD88) | 72% |
    | 2.0 m + 100-year | + 84 in (13.20 ft NAVD88) | 68% |
    | 5 m, background tide | + 108 in (15.20 ft NAVD88) | 73% |
    | 5 m + 100-year | + 108 in (15.20 ft NAVD88) | 70% |

    An earlier run, before the + 48, + 77 and + 84 in layers were stored, put 1.0–2.0 m at + 66 in (Codex review, PR 8). Against the earlier mix of Caltrans and unshifted layers, the 5 m figures were 75% and 73%.
  - **Recorded as found in the published files** (all five storms; reproduce with `node tools/build-cosmos.mjs --all --out DIR` and `node tools/cosmos-report.mjs --dir DIR`):
    - The 20-year storm floods more Berkeley land than the 100-year at 0.75–2.0 m of rise (2.0 m: 85.0 vs 78.8 ha).
    - The modeled water surface does not rise steadily with the storm (2.0 m: background 14.21, 100-year 13.82 ft NAVD88).
    - The extent polygons cover more land than the depth rasters (0 m + 100-year, ground 2.0–2.5 m NAVD88: 4,525 vs 2,330 2 m cells). The explorer uses the depth rasters, and the page says the extent polygons on the City's and Our Coast, Our Future's maps cover more land.
  - **What the explorer offers.** Since 2026-11-04 it offers only the background tide and the 100-year storm, at all ten rises (Eric, PR 8).
  - **Datum.** CoSMoS's coordinates are NAD83 / UTM zone 10N and are used without the 1.46 m shift applied to ART (C1); this is not yet corrected.

  Reproduce with `node tests/check.mjs` and `node tools/cosmos-report.mjs`.
- **C22. CoSMoS-GW groundwater against the explorer (H7; derived, 2026-11-03).** Kh 1.0 m/day, MHHW
  boundary, full model. On Berkeley land in the grid (1,008.6 ha at or above 3.31 ft NAVD88), ground
  marine, emergent or within 1 m of the water table: 325 ha at 0 m of rise, 376 at 1.0 m, 418 at
  2.0 m, 529 at 5 m. Emergent alone: 43.3, 62.7, 59.8 and 1.1 ha; it falls from 2.5 m because that
  ground turns marine. Today's land within 1 m is 66, 320 and 682 ha at Kh 10, 1.0 and 0.1: a
  ten-fold spread. At 0 m: the transfer station 27% emergent, 61% 0–1 m, 13% 1–2 m and none deeper
  than 2 m. The Draft EIR measured 5 to 10 ft (1.5–3.0 m) below ground (F6), so the model is
  shallower at all three Kh (Kh 10: 11% deeper than 2 m). Second St 95%, Bolivar Dr 98%, Pacific
  Steel (1333 Second St) 100% and Berkeley Forge & Tool (1331 Eastshore Hwy) 97% emergent, at or
  above the Gilman Gateway EIR's shallowest 1.5 ft (F17, F18). Eastshore Hwy 21% emergent and 68%
  0–1 m. DoubleTree grounds 83% at 1–2 m. Matching each rise to the explorer's MHHW 6.20 ft NAVD88
  (point 518) plus the rise (a derived choice): 90–98% of the explorer's low, not connected ground is
  CoSMoS-GW emergent at 0–2.0 m. The match is partly shared terrain, because both mark the lidar's
  closed depressions. Most emergent ground is ground the fill calls dry (40.5 of 43.3 ha at 0 m).
  CoSMoS-GW's marine class agrees with the fill's Bay water at 79–97% (both / either) from 1.5 m up
  (46–65% below). Both keep the flats behind I-80 dry of Bay water at 2.0 m (12.76 ft NAVD88) and take
  them at 2.5 m (14.40; transfer station 58% marine, 59% in the fill), bracketing C6's 13.35.
  Reproduce with `node tools/compare-cosmos-gw.mjs` and `node tests/check.mjs`.
- **C23. The level at which each place is first reached (derived, 2026-11-04).** The connected fill
  read the other way, for guided mode: `node tools/thresholds.mjs` runs `js/analyze.js` with no plan
  and no rain from 6.00 to 16.50 ft NAVD88 in 0.05 ft steps and keeps the first level at which each
  place is reached (`data/thresholds.json`, and per-cell rasters `data/hazard/first-bay.u8` and
  `first-drain.u8`). Up the drains (every outfall open), a quarter of each site is reached at:
  Berkeley Forge 9.85, Pacific Steel 10.80, 1255 Eastshore 11.65, transfer station 12.40. Over the
  ground: Marine Center 12.80, the inland sites 13.40, the first step past C6's 13.35 crossing, Terminal Manufacturing 13.55, Eastshore
  State Park 15.00; Flint Ink only touched, at 15.40. Roads (a segment 25% flooded): Bolivar Dr
  7.25 and Eastshore Hwy 7.85 up the drains; the Marina access roads 10.70; I-80 mainline 11.20
  (bare-earth lidar, F2); University Ave ramps 12.05 up the drains; Ashby ramps 13.65; Gilman
  ramps 14.05. DoubleTree grounds first wet at 9.85. Bolivar Dr at 7.25 is below this winter's
  highest tide, 7.4 (W14), which the field check (E10) can test.
  Rail main line (C24) 11.40 over the ground, in Albany; in Berkeley 13.50. I-80's 11.20 is also in
  Albany; in Berkeley the mainline is first reached at 14.05 (C27, corrected 2026-11-04: the first
  version reported both Albany figures as the road's and line's without naming the place). Every site in the panel lies wholly inside the
  State tsunami hazard area (H6), as do the Marina, Aquatic Park and the flats east of I-80 to about
  Fourth St (2nd St 24 of 24 street samples, 4th St 29 of 40, 6th St and San Pablo Ave none).
  With each defense (the same sweep with a plan): tide gates on every outlet move every inland
  site's first level to 13.40 (the crossing behind I-80, C6) and Bolivar Dr from 7.25 to 13.40,
  and cut Berkeley land under water or filling up the drains at 13.00 ft NAVD88 from 111.8 to 62.4
  ha; at 14.53 they change nothing (161.9 ha), because the flats are open from the Bay. The City
  study's 2050 and 2100 walls move no site or road group's first level (land at 13.00: 111.8 and
  109.5 ha), as C11 found. The raised roads move the Marina access roads from 10.70 to 10.85.
- **C24. The rail main line (derived, 2026-11-04).** OpenStreetMap ways tagged railway=rail,
  usage=main in the grid: 26 ways, 15.8 km counting both tracks, 7.7 km in Berkeley, 4 bridges
  (`tools/fetch-rail.py`, `tools/build-rail.mjs`). Sampled as streets are (a segment counts at 25%
  flooded), bridges skipped. First reached at 11.40 ft NAVD88 by Bay water, on a segment in Albany
  (lowest ground 10.86 ft NAVD88, near 37.9020 N, 122.3151 W); in Berkeley at 13.50, once the water
  crosses behind I-80 (C6, C27). Bare-earth lidar keeps
  the track's embankment but not its bridges; the railroad's profile would confirm. The Overpass
  API dropped every connection from the build environment on 2026-11-04, so the data come from the
  main API's /map call in 20 small tiles.
- **C25. The City study's walls moved within the tracing error (derived, 2026-11-04).**
  `node tools/wall-sensitivity.mjs` runs each wall set as traced (C11), with every wall's ends
  extended 30 and 60 m, moved 30 m north, south, east and west, and 12 m wide. 2100 walls at 13.0 ft
  NAVD88: Berkeley land under Bay water 58.8 to 61.7 ha in every variant (60.1 as traced, 62.4
  with none); DoubleTree grounds 76 to 85% (88% with none); Marina Blvd under water for its whole
  675 m in every variant. C11's finding for the 2100 walls holds across the tracing error. 2050
  walls at 10.7: moved 30 m north they keep Marina Blvd dry (675 m under water as traced) and cut
  University Ave's from 282 to 134 m; the DoubleTree grounds range from 8 to 22% (16% as traced, 25%
  with none). For the 2050 walls, whether Marina Blvd stays dry turns on where the wall runs, within
  the tracing error, so C11's "leave Marina Blvd under water" is a result of this tracing, not of
  the study's alignment. The study's own drawings or CAD files would settle it.
- **C26. How often and how long the Bay stands above a level (W19; derived, 2026-11-04).** NOAA's
  measured water levels at Richmond (9414863), 2016 through 2025, in ft NAVD88
  (`tools/fetch-noaa-richmond.py`). High tides (higher high and high) at or above a level, per
  year, and the longest run of hourly readings at or above it: 7.00, 40.7 a year, 4 h; 7.25 (Bolivar
  Dr up the drains, C23), 19.3 a year, every year, 3 h, median 1 h; 7.40, 9.7 a year, every year;
  7.85 (the frontage road up the drains), 1.0 a year, in 5 of 10 years; 8.00, 0.5 a year, 3 of 10
  years; 8.16, once in 10 years; 8.47 and above, never. The highest reading was 8.39 (hourly,
  2024-12-14 10:00) and 8.33 (high tide, 10:12). Richmond's MHHW is 6.06 ft NAVD88 (NOAA datums,
  1983–2001 epoch) against 6.20 at point 518 off the Marina (W11), so Berkeley's tides may run about
  0.1 ft higher than these readings; they are used unadjusted. If Bolivar Dr's outlet let the Bay
  in, the street would take water on about 19 tides a year, for an hour or so each time; that is
  what the field check (E10) can see.
- **C27. I-80's lowest stretch is in Albany (derived, 2026-11-04).** The first I-80 segment the fill
  floods (11.20 ft NAVD88, C23) is westbound, near 37.8986 N, 122.3097 W, south of Golden Gate
  Fields in Albany. Along its northern 100 m the mapped line's ground is 10.3 to 11.0 ft NAVD88 (one
  4 m cell at 4.4 ft, a pit, probably an inlet or culvert). Cross-sections at 10, 40 and 70 m show a
  raised strip about 30 m wide at 10.8 to 11.8 ft NAVD88, the roadway, with the mapped line on its
  west edge and ground falling to 7.4 to 9.2 ft just west of it. So the freeway there takes water at
  its west shoulder from about 11.2 ft NAVD88 and across its lanes from about 11.5 to 12, on this
  bare-earth terrain. In Berkeley the mainline is first reached at 14.05. The Caltrans request sent
  on 2026-11-04 asks for profiles from Ashby Ave to Buchanan St, which ends south of this stretch.
- **C28. FEMA's 2018 flood study for Alameda County (V3; read 2026-11-04).** FIS 06001CV001B and
  06001CV002B (Volumes 1 and 2, revised 2018-12-21; FEMA Map Service Center). Two sets of Bay still
  water levels, ft NAVD88:
  - Table 5, "Summary of Stillwater Elevations" (Vol. 1, printed p. 44), "San Francisco Bay, At
    Berkeley": 9.8 (10% annual chance), 9.9 (2%), 10.2 (1%), 10.3 (0.2%). This is the 10.2 the
    Gilman hydraulic study used (V3). The volume does not say where this row comes from; its
    Alameda entries cite a 1984 USACE tide gauge analysis.
  - Table 10, "Transect Data" (Vol. 2, printed p. 104), from the 2018 coastal study (BakerAECOM,
    DHI regional modeling of 1973–2003): Berkeley's shoreline transects 4 to 12 give 8.48 to 8.49
    (10%), 9.32 to 9.39 (2%), 9.89 to 9.94 (1%) and 11.30 to 11.41 (0.2%). Base Flood Elevations
    with waves, 12 to 16 ft NAVD88 in VE zones.
  The explorer's 100-year level, 9.73 at point 518 (W11, the 2016 study), is 0.16 to 0.21 ft below
  FEMA's 2018 transects and 0.47 below Table 5; its 500-year level, 10.91, is 0.39 to 0.50 below
  FEMA's 0.2% transect values. No scenario is changed: choosing between the sources is Eric's
  (AGENTS.md).

## Tsunami: what is in place (read 2026-11-03, asked by Eric: "Are there mitigations or do we have an environmental disaster if a tsunami arrives today")

From a research agent's reading; the quotes marked "verified" were checked against the downloaded
documents in this session. In short: what is in place protects people, not sites. No document read
assesses what a tsunami would release from the sites in the hazard area, and no general rule read
requires existing sites to prepare for one (T2, T3). The one tsunami requirement found is
project-specific: the Gilman Gateway EIR's Mitigation Measure HYD-4 requires flood- and
tsunami-proof hazardous materials storage, for future development on that site only (F18, T4). No source estimates a release, so this does not establish that a disaster would
follow; it is a planning gap.

- **T1. The City's after-action report on the 2024-12-05 warning.** *2024 Tsunami Warning: After
  Action Report & Community Survey Summary*, information report to Council, 2025-04-18 (PDF pages).
  An M7.0 earthquake at 10:44 am; federal warning 10:49; the City's Emergency Operations Center
  activated within 5 minutes; responders "evacuated the Berkeley waterfront and Marina in 45
  minutes" (p. 14, verified); orders out "by 11:45 am, approximately 30 minutes before the tsunami
  was expected to hit San Francisco" (p. 1, verified); warning cancelled 11:54. Problems: the
  federal phone alert reached nearly the whole city; sirens ran about two minutes and "some
  mistakenly believed that the evacuation order was canceled" (p. 23, verified); off-ramps jammed;
  schools and other critical facilities had no tsunami plan. Its twelve recommendations concern
  alerting, education, off-ramps and transit; the report never mentions hazardous materials,
  chemicals, industry or the transfer station (searched; verified). Background, p. 5: in 2011 "a
  half-meter-tall surge" with "4-6 knot current" caused "$158,000 of damage to docks and boats"
  (verified; compare H6's secondary "25 mph").
- **T2. The City's 2024 Local Hazard Mitigation Plan** (adopted 2025-03-18). Its tsunami section has
  one sentence on pollutants: "Tsunamis can cause the release of pollutants, toxic substances, and
  other hazardous materials, threatening public health, water, and the environment" (verified),
  naming no facility. Its two tsunami actions are Low priority and at the Marina: dock repair, and
  to "document and explore additional tsunami hazard mitigation measures for Berkeley's maritime
  communities" (verified). Its hazardous materials actions are the existing inspection programs,
  with no tsunami or flood element. It lists 14 high-risk facilities (verified in part: Berkeley
  Forge & Tool, 1331 Eastshore Hwy; Comeback Brewing / Trumer, 1404 Fourth St; PC Cargo, 2424 Fourth
  St; the Kaiser regional lab, 1725 Eastshore Hwy). Page numbers per the agent.
- **T3. State rules for hazardous materials sites.** Business plans must include "Emergency response
  plans and procedures in the event of a release or threatened release" (Health and Safety Code
  § 25505(a)(3)), naming no hazard; the regulations name one natural hazard, earthquake (19 CCR
  § 5030.9(e)); CalARP requires "consideration of external events, including seismic events, if
  applicable" (HSC § 25534.05(c)). No requirement to plan for flood or tsunami was found. The CGS
  hazard area map "is not a legal document and does not meet disclosure requirements ... nor for
  any other regulatory purpose", so it triggers no duty for the sites inside it. Statute text from
  secondary hosts (leginfo refused automated access); not verified here.
- **T4. The transfer station Draft EIR's tsunami finding.** Impact HYD-4 (PDF p. 486 [3.9-44],
  verified): the project "would be located in a flood hazard zone, tsunami, or seiche zone, but
  would not risk release of pollutants due to project inundation", because it "would not cause the
  site to be more susceptible to tsunami inundation, and thus the risk of resultant pollutant
  release would be less than significant when compared to existing conditions". No mitigation. The
  site "is in a Tsunami Hazard Area" (p. 455 [3.9-13], verified). Its diesel USTs were removed in
  December 2025 (p. 82 [2-28], verified; F19 predates that).
  Compare (inference, ours): the Gilman Gateway EIR next door asked whether storage would survive
  inundation and required flood- and tsunami-proof storage (HYD-4, F18); its cumulative analysis,
  per the agent, names the "Gilman Transfer Station" among projects storing hazardous materials
  whose inundation "could result in a cumulative impact" (p. 4.10-41, not verified). The transfer
  station's EIR asked only whether the project made things worse.
- **T5. The landfill under César Chávez Park.** Read 2026-11-03: the Water Board's tentative
  order, *Updated Waste Discharge Requirements and Rescission of Order Nos. 76-9, 77-138, and 86-41,
  City of Berkeley, Berkeley Landfill* (February 2010 agenda), and the staff summary report for the
  Board's April 14, 2010 meeting, Item 5.B (both at waterboards.ca.gov, `board_info/agendas/2010/`).
  The tentative order: waste accepted 1961–1983, closed in phases 1981–1990; perimeter levees
  "Built between 1957 and 1968", improved in the late 1970s with slurry trenches and riprap; "approximately
  1.5 million tons of residential, commercial, and industrial waste"; "There is no engineered base
  liner at the Landfill", waste placed directly on 3.5–16.5 ft of Bay Mud (p. 2); "The site shall
  be protected from any washout or erosion of wastes from inundation, which could occur as a result
  of a 100-year, 24-hour storm event, or as the result of flooding with a return frequency of 100
  years" (p. 13). Neither document mentions tsunami. The staff summary says the revised tentative
  order added "a new provision that requires the City to periodically evaluate the Landfill's need
  for increased flood protection due to sea level rise", and a finding that investigations show
  leachate "is not in hydraulic connection to the Bay"; San Francisco Baykeeper commented on the
  draft and agreed to the revision. Corrections to the agent's reading: the order number
  R2-2010-0064 and the adopted text were not read here (the revised order is not at the guessed
  URLs), and the tentative order's five-year report is for financial assurance, not flood
  protection; how often the sea level rise evaluation recurs is in the revised order, not read. Not
  verified: a tentative 2026 general order (not adopted) that would require protection for the
  100-year storm with 2050 sea level rise, including wave run-up, also without tsunami.
- **T6. Not read:** the City's Hazardous Materials Area Plan (no public copy found); the 2023
  Alameda County tsunami evacuation playbook; the Marina's maritime playbook 2015-Alam-02 (CGS
  shares it only with harbor officials); the transfer station Draft EIR's hazards appendix.
  The agent also reports two errors in City documents, not verified here: the City's tsunami page
  says to "get west of 7th Street" (east is out of the zone), and a heading in the after-action
  report is dated 2025.

## The transfer station's money (read 2026-11-03, asked by Eric about "the economics of running our own")

From a research agent's reading of City budgets, capital plans, financial statements, Council
items and a regional rate survey; the figures marked "verified" were checked against the downloaded
documents in this session. Bears on the cost column of the exit lever (E7) in
`docs/design/mitigations.md`. Nothing here weighs one model against the other.

- **Z1. The rebuild is unfunded.** City Capital Improvement Program FY2023-27, unfunded capital
  summary: "Transfer Station ... Capital & Maint. Need $76,000,000", none available (verified).
  Proposed FY2027-31 CIP overview (Council item 2, document dated 2026-05-27): "Capital & Maint. Need
  $120,000,000", available funding $1,350,000 (FY2027) and $500,000 (FY2028), "Unfunded Capital
  $(144,940,796)" by FY2031 (verified). The adopted FY2025-29 project sheet funds pre-construction
  work only ("Pre-construction costs, planning, permitting, CEQA, design and engineering"; verified).
  The 2023 rate schedule (Council 2023-04-25 Item 27) funds "$6.773 million in pre-construction
  costs" and says "construction costs for the SW&RTS's replacement" are "not included in the
  proposed rate schedules" (verified). Zero Waste Commission draft minutes, 2026-05-20: if the
  rebuild were authorized "there would be a bond to pay for it (no existing transfer station bond
  yet)" (verified).
- **Z2. The Zero Waste Fund.** FY2025 Annual Comprehensive Financial Report (PDF p. 57): Zero
  Waste total net position −$923,233, unrestricted −$4,564,642 (verified). Council 2025-10-28
  Item 22: the "fund balance has been depleted at a faster pace than anticipated" (verified),
  requiring a new rate schedule a year early, citing fleet electrification, labor raises and
  emergency repairs to the transfer station's tipping floor (per the agent), and a "comprehensive
  rate study for both the collection operation and" the transfer station (verified). The station's
  own operating cost is not published; its revenue is about $10 million a year (per the agent,
  from the budget).
- **Z3. Tonnage** (ACFR FY2025, PDF p. 367, verified): tons through the station landfilled 71,400,
  68,914 and 74,833, and recycled or composted 47,506, 46,117 and 43,073, in the three years shown
  (FY2023 to FY2025 per the agent).
- **Z4. Outsourcing on record.** The station was first built and run privately: "the City selected
  a firm (BFI Industries, Inc.) to construct and initially operate a Transfer Station" (2019
  feasibility study, Council work session 2019-11-05 Item 1; verified). The one franchising study
  found covers commercial service only (Council work session 2015-02-10 Item 1): "Berkeley is one
  of very few cities in California that operates its own waste management services, as well as
  owning and operating a Transfer Station" (PDF p. 1, verified). Its single-franchisee option
  (PDF p. 5, verified): "Additional franchise fee revenue of $4M/year"; "Residential services and
  Transfer Station share of overhead increases significantly by $2.2M/year", which "New revenue
  would cover"; "Loss of 25 employees"; "Rate increase unlikely, possible reductions if rate
  structure is well designed"; "Require flow control of franchise tonnage to Berkeley Transfer
  Station". No study of closing the station or franchising residential service was found. Labor
  and code limits, per the agent and not verified here: the SEIU 1021 agreement requires notice and
  meet-and-confer before subcontracting that lays off permanent employees; the municipal code says
  collection "is provided by the City" (as quoted in City documents).
- **Z5. Rates** (StopWaste "AlCo Rates & Services Matrix", 2026-07-22; verified for the rows
  shown): monthly 32-gallon or nearest cart, Berkeley $67.66 (City; 2026-07-01), Albany $68.26 (WM),
  Oakland $64.66 (WM), Emeryville $26.17 (WM); per the agent also San Leandro $43.34, Hayward
  $47.05, Fremont $48.84, Alameda $52.74, Piedmont $113.12. Services bundled in the rate differ
  (per the agent, about 13% of Zero Waste costs pay for street sweeping, illegal dumping and
  outreach); the rates are not like for like.
- **Z6. What the exit lever would move or leave** (per the agent): self-haul drop-off (about
  130,000 visits a year), Urban Ore's salvage, the Community Conservation Centers recycling center
  and buyback (contract to 2031), and the 110+ vehicle yard (F21). No document found addresses
  disaster debris under either model.
  Also: the Air District fined the City $130,000 for landfill gas violations at César Chávez Park,
  2019-2022 (Air District release, 2024-04-04; verified). The landfill, not the transfer station.

## Hazard data and press (read 2026-11-02)

- **H1. USGS Coastal Storm Modeling System (CoSMoS) v2.1, San Francisco Bay (read 2026-11-03).**
  The Bay is CoSMoS v2.1 (completed June 2014), not v3.1: v3.1 (https://doi.org/10.5066/P9NUO62B) covers
  the outer coast from Point Conception to the Golden Gate. v2.1 is published only through Our Coast, Our
  Future (Point Blue and USGS), with no USGS metadata ("we do not have any official metadata", OCOF
  download instructions, Sept 2025). Alameda County zips,
  `https://d36bibj3hf4jrv.cloudfront.net/ocof-counties/alameda_flooding_slr<cm>.zip` (download page
  https://data.pointblue.org/apps/ocof2_flood_map/download_data; Last-Modified 2022-03-12; retrieved
  2026-11-03): sea level rise of 0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0 and 5.0 m, each with
  background tide, annual, 20-year and 100-year storms and a king tide; 2 m flood depth and water surface
  rasters ("water surface elevation relative to NAVD88"), NAD83 UTM 10N, "vertical datum NAVD88 (in m)".
  What it models (USGS project page "CoSMoS 2.1: San Francisco Bay", read only through a summarizing
  fetch, so paraphrased and not quoted; the page refused direct download): Delta and tributary storm
  discharge, in-Bay wind waves from downscaled global climate model winds, and ocean swell in the
  Central Bay, with sea level rise. A total water level, not
  still water; whether the mapped surface includes wave setup or runup, and the year of the 0 m baseline,
  are not stated in what was read. Its water surface over the open Bay inside the City limits at 0 m is
  7.43 ft NAVD88 with the background tide and 9.33 with the 100-year storm (median; point 518 still water:
  1-year 7.43, 100-year 9.73, W11). No license stated; USGS work, cited as OCOF asks.
  The City republishes three of the extent layers (`CoSMoS_SLR_100_Year_Storm_Event`, ArcGIS item 0f210be8efe149c9ad99387dbe04447b, created 2026-01-12, D4); not used.

Used for: the second published check on the connected fill (C21), and an outline on the map, off by default, chosen by sea level rise and storm and never tied to the explorer's level (`tools/fetch-cosmos.py`, `tools/build-cosmos.mjs`, `data/hazard/cosmos*.bits`, `cosmos.json`).

- The page offers two storms, the background tide and the 100-year storm, at all ten rises (decided 2026-11-04). `node tools/build-cosmos.mjs --all --out DIR` rebuilds the annual, 20-year and king tide storms from `data/raw/cosmos/`, which keeps all five.
- The explorer uses the depth rasters' extent. The extent polygons reach further (C21), and the page says so.
- **H2.** A BCDC comment letter found while searching (CEQAnet 301888) refers to the
  Belmont Creek watershed and OneShoreline, which are in San Mateo County; it belongs to a
  different project and is not used.
- **H3.** El Niño Kelvin wave, autumn 2026: press coverage (The Weather Network, AP via
  NY1 2026-10-03, SAN) puts the coastal sea level increase at about 6 inches to a foot;
  NOAA gave a greater than 90% chance of a very strong El Niño for November 2026 through
  January 2027; Governor Newsom proclaimed a state of emergency in late September 2026.
  Secondary sources; the NOAA and NASA statements themselves have not been read.
- **H4.** Used for: a "Kelvin wave" increment of 0.5–1.0 ft added to tide scenarios.
  Superseded 2026-11-03 by W15 and W16: the increment now cites the Coastal Commission's and
  the 2016 study's statements on El Niño, and the two scenarios are labeled sensitivity tests.
  The NOAA and NASA statements themselves are still unread.
- **H5.** BCDC/MTC Adapting to Rising Tides (ART) Bay Area Sea Level Rise and Shoreline
  Analysis Maps (AECOM, 2017): flooding depth for total water levels of MHHW plus 12, 24,
  36, 48, 52, 66, 77, 84, 96 and 108 inches, connected to the Bay, with disconnected
  low-lying areas mapped separately; the same maps as the Draft EIR exhibits (F9). Served
  as polygons by Caltrans (caltrans-gis.dot.ca.gov, CHhqenvi/DEA_BCDC_polygon_SLR
  MapServer, depth classes in feet; no 84-inch layer in that service) and downloadable as
  county geodatabases from explorer.adaptingtorisingtides.org. Used as the published
  hazard layer the connected-fill rule is checked against, and shown in the explorer.
  The Caltrans services carry only the connected flooding; neither `DEA_BCDC_polygon_SLR` nor
  `DEA_BCDC_SLR` (road and rail lines) has the disconnected layer, and neither do BCDC's
  ArcGIS Online services. The disconnected low-lying areas come from the Alameda County
  geodatabase (`Alameda_SLR_ART_2017.gdb.zip`, 5.3 GB, explorer.adaptingtorisingtides.org
  Download page), layers `Alameda_lowlying_poly_<N>` for all ten levels, read by HTTP range
  requests (`tools/fetch-art-dc.py`, retrieved 2026-11-03; `data/raw/art-dc/`,
  `data/hazard/art-dc-*.bits`). The catalog defines them as "low-lying areas greater than one
  acre … below the inundated water surface elevation, but … not hydraulically-connected to the
  inundated areas" (GIS data catalog, p. 2). ART joins cells by an "eight-side rule" on 1 m
  DEMs (report §3.5, p. 20). The geodatabase also holds the connected layers, `Alameda_inundation_poly_<N>`, one feature per depth class (`DEPTH_FT`, 10–77 MB compressed each).

- **What the explorer uses.** Since 2026-11-04 it uses them for all ten levels (`tools/fetch-art-dc.py --connected`, retrieved 2026-11-04; `data/raw/art-dc/inundation_*.json`, simplified as in C1; `data/hazard/art-*.bits`).
- **Datum.** Its spatial reference is `NAD_1983_UTM_Zone_10N`, datum `D_North_American_1983`, with no realization named. `tools/build-art-dc.mjs` transforms it to the grid's WGS 84 with EPSG:7807 at epoch 2017.0 (`tools/nad83.mjs`; 1.44 m west, 0.28 m north). This applies to the connected and the disconnected layers alike (C1).
- **The Caltrans-served layers.** They (seven levels) differ from the geodatabase in registration and in dry islands (C1). They are no longer shown; `tools/fetch-art.py` and `tools/build-art.mjs <dir> <out dir>` reproduce them.

Used for: C1, C6, C20, C21, the explorer's ART outline and its optional disconnected outline.
- **H6. Tsunami, 2011 (asked by Eric, 2026-11-03, recalling water "at high speed. 20 knots?").**
  California Geological Survey, "Table of Tōhoku-oki tsunami forecast and observation times,
  tsunami amplitudes, and reported damage" (conservation.ca.gov; read 2026-11-03): Oakland,
  observed 8:36, maximum amplitude 0.51 m (about 1.7 ft), "Minor damage at nearby Berkeley Marina";
  San Francisco 0.62 m, "Two piles broken"; Sausalito 1.2–1.5 m, "Houseboat damage". A 2011 news
  report reposted on a blog (secondary, not checked against the original) quotes the Berkeley
  harbormaster on at least four surges "at about 25 mph" (about 22 knots), with docks, slips and a
  piling damaged; no measured current speed for Berkeley was found. The Gilman Gateway Draft EIR
  places that site "within a tsunami hazard area" (CGS 2021 map; F18).
  The State's Tsunami Hazard Area (California Geological Survey, Cal OES, USC Tsunami Research
  Center, AECOM; services.gis.ca.gov Oceans/Tsunami MapServer, layer 0, retrieved 2026-11-03,
  `data/raw/cgs/`): the layer description says the areas "represent a combination of the maximum
  considered tsunamis for each area" and are "used for evacuation planning at the community
  level". Press coverage (not read) gives a 975-year average return period; the layer description
  read here does not state one. Used for: an outline on the map, off by default
  (`tools/build-tsunami.mjs`, `data/hazard/tsunami.bits`), and C16. It is an area to leave on a
  warning, not a flood depth, and does not change with the explorer's water level.
  What it bears on: a tsunami's damage in the Bay in 2011 came from currents and short surges in
  harbors, with a water-level change of about half a meter; a still-water fill models neither.

- **H7. USGS CoSMoS-GW, groundwater emergence and shoaling (read 2026-11-03).** Befus, K.M., Hoover,
  D.J., Barnard, P.L., and Erikson, L.H., 2020, *Projected responses of the coastal water table for
  California using present-day and future sea-level rise scenarios*: USGS data release,
  https://doi.org/10.5066/P9H5PBXP (ScienceBase item 5bd9f318e4b0b3fc5cec20ed). `Alameda_MHHW.zip`
  (110,031,701 bytes, SHA-256 2bbaa22b…a1fa461, retrieved 2026-11-03), metadata XML and the three
  methods PDFs read. Polygons of depth from the ground surface to the modeled water table: "-1 =
  marine inundation (below marine boundary condition (LMSL or MHHW) sea level)", "0 = water table at
  or above ground surface (emergent groundwater)", then 0–1, 1–2, 2–5 and > 5 m (item summary). Sea
  level rise 0–2 m in 0.25 m steps, 2.5, 3 and 5 m. Marine boundary a constant head at MHHW (NOAA
  VDatum) plus the rise. Steady-state MODFLOW, one homogeneous layer to -50 m NAVD88, 10 m cells,
  mean 2000–2013 recharge. Horizontal NAD83 (NSRS2007) UTM 10N, vertical NAVD88. Two versions:
  groundwater reaching the surface "removed from the model, simulating loss via natural drainage",
  or retained ("worst-case 'linear'"). Three conductivities "to bracket reasonable model parameter
  values" (Kh 0.1, 1 and 10 m/day). The release names no best estimate. "Projected water tables for
  future sea-level rise conditions cannot be validated against observations." The model has "only
  natural conditions (i.e., no man-made activities or terrain alteration)" (water table depth
  methods), which we read as no pumping, drains or sewers. It has no storms and no tide above MHHW.
  Closed depressions in the DEM were filled so emergent groundwater can stand in them (model methods).
  Licence: public domain; acknowledge the USGS and the University of Wyoming (metadata). Used: the
  full model (drainage), MHHW, Kh 1.0 m/day, the middle case and our choice, for all 12 rises
  (`tools/fetch-cosmos-gw.py`, `tools/build-cosmos-gw.mjs`, `data/raw/cosmos-gw/`,
  `data/hazard/cosmos-gw-*.bits`, `cosmos-gw.json`), and C22. A groundwater depth is not a flood
  depth and not a water level. The City's Rincon screening (F19) uses the same model.

## Claims from the 2026-11-03 outside review (checked 2026-11-03)

Three claims in the outside review behind E9, checked against primary sources before use.

- **V1. A November 17 ferry terminal vote: unconfirmed.** A Council meeting on 2026-11-17 is
  confirmed: the 2026-10-27 annotated agenda sets second readings of Ordinances 8,036, 8,037 and
  8,038 for that date. A WETA letter to residents, quoted elsewhere and not read here, says the
  Council is to "certify the environmental review and approve the project" that night. No posted
  agenda lists the item as of 2026-11-03, and the City's Berkeley Pier-Ferry Access Project page
  (berkeleyca.gov) gives no Final EIR or approval date. Whether the item touches shoreline flooding
  is unchecked: the Draft EIR and BCDC's 2026 comment letter were not read. Used for: nothing yet.
  The agenda should post about 11 days ahead.
- **V2. BCDC and a Berkeley subregional plan: partly confirmed.** The duty comes from the statute,
  SB 272 (Laird, 2023), which BCDC administers: local governments on the Bay shoreline must address
  sea level rise "through Local Coastal Programs or San Francisco Bay Shoreline Resiliency Plans by
  January 1, 2034" (BCDC staff report on the Regional Shoreline Adaptation Plan, 2024-10-07). BCDC's
  "Local Sea Level Rise Plans" page: a plan "can be for a single city or county or can cover multiple
  jurisdictions", and plans "must be submitted for approval by January 1, 2034". The City of
  Emeryville's sea level rise page says Emeryville, Berkeley and Albany, under the San Francisco
  Estuary Partnership, applied for and were awarded State funding to prepare one plan; the
  Partnership's 2025-10-28 slides name a "Shoreline Adaptation Plan for the Cities of Emeryville,
  Berkeley and Albany in close partnership with Oakland". Conflict: BCDC's 2026-01-15 status report
  on subregional plans (Agenda Item 10) does not list it among the five publicly initiated plans.
  The statute text itself was not read. Used for: nothing yet; it bears on E2 (neighbors' plans).
- **V3. The I-80/Gilman interchange: built, and its documents state flood levels.** Caltrans
  announced it complete on 2025-05-30: two roundabouts and a bicycle and pedestrian bridge over
  I-80 (CEQAnet SCH 2018122057). Location Hydraulic Study Report Addendum, November 2018 (Alameda
  CTC), printed p. 10: site ground 9.0–20.0 ft NAVD88; a 100-year still water level of 10.2 ft
  NAVD88, and about 11.2 ft NAVD88 with 1.0 ft of sea level rise by 2040; low points of about
  10.4 ft NAVD88 (the drain inlet at the westbound roundabout) and 9.0 ft NAVD88 (the Gilman St
  extension). Its one sea level rise measure is a tidal flap gate at the Gilman outfall; the May
  2018 study calls preventing sea level rise impacts "beyond the scope of this Project". Design
  figures; whether the gate was built, and the as-built elevations, are unchecked. The gate goes "at
  the existing headwall of the 60-inch RCP at the west end terminus of Gilman Street" and addresses
  tidal backwater only (p. 10); no invert elevation is given. Conflict: the addendum's 100-year still
  water level (10.2 ft NAVD88) is 0.47 ft above the 2016 study's 9.73 ft NAVD88 at point 518 (W11).
  The addendum cites FEMA's Flood Insurance Study for Alameda County (FIS 06001CV001B–003B, "expected
  to be adopted on December 21, 2018"; not read) and calls 10.2 the still water elevation at the
  Zone AE boundary "in the City of Berkeley" (p. 7). The May 2018 study used FEMA's earlier Zone VE
  levels, 10 and 9 ft NAVD88, which "account for storm surge and wave run-up". The two still water
  figures come from different studies, and no document read explains the gap, so the explorer keeps
  9.73 and treats 10.2 as a FEMA figure to check against the FIS table (the FEMA map service failed
  to connect, 2026-11-03). Used for: D6 (the first documented tide gate on a
  Berkeley outfall) and the CPRA request.

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

## Eric's decisions, 2026-11-03 (Claude Code session)

- **E4.** The transfer station is critical infrastructure ("It is critical."). Eric's reasons:
  flooding it would have disastrous environmental consequences, and with it offline, cleanup
  after a disaster is hindered. Both match the guidance's own test for the High scenario:
  development that "would have considerable public health, public safety, or environmental
  impacts should that level of sea level rise occur, such as most critical infrastructure"
  (Coastal Commission 2024 guidance, Ch. 3, p. 66; W17). The Draft EIR lists hazardous
  materials among the project's potentially significant effects, which it finds mitigable (F3),
  and Baykeeper's 2016 Clean Water Act suit concerned metals, acid, oil and grease in the site's
  ordinary stormwater (F14).
  Applied in `data/scenarios.json` (both State 2024 High scenarios) and C13: the guidance's High
  scenario (W17) is the one that applies to it.
- **E5.** Use the San Francisco gauge for the 2024 scenarios ("SF is ok"; W17), and list only the
  Intermediate-High and High scenarios ("Yes trim"). Applied in `data/scenarios.json`: the two
  Intermediate rows (10.53 and 12.83 ft NAVD88) are removed from the list; C13 keeps their results,
  and the slider still reaches those levels.
- **E6. What mitigations are measured by.** Eric: "All these scenarios have sufficient warning that
  people can evacuate. So the KPI for mitigations is not loss of life, but environmental damage."
  Agreed with three qualifications, which Eric accepted ("yes record it"). Plans and levers are
  compared by: (1) pollutant release: which contaminated or hazardous-materials sites take water,
  and at what level (C15, C16, F14–F19); (2) loss of critical services: the transfer station, the
  sewer system (F15), I-80 and emergency routes, and for how long; (3) life safety as a check, not
  the main measure. The qualifications: warning works only if people receive it and act on it
  (Marina liveaboards and workers, shift workers at the industrial sites, people without cars;
  the City's after-action report on the 2024-12-05 tsunami warning is the evidence to read);
  warning times for the tsunami sources behind the State's hazard area are not yet confirmed (H6);
  and losing a service is a loss that evacuation does not prevent (E4's cleanup point). Basis for
  the long warning: king tides are predicted years ahead (W14), storm tides and rain days ahead, and
  the 2011 tsunami reached the Bay hours after the earthquake (H6).
  Added 2026-11-03 (Eric: "Yes e6"), after Eric asked whether managed retreat applies only to
  pollutant release. What each kind of mitigation reaches:
  | What is at risk | Does retreat help? | Other tools |
  |---|---|---|
  | Hazardous materials in use (operating sites, the transfer station's hazardous waste) | Yes: moving the operation moves what it stores | Flood-proof storage (as Gilman Gateway HYD-4, F18), shut-down plans |
  | Contamination already in the ground (Pacific Steel, plating plumes, the landfill) | No, unless paired with cleanup: leaving a site leaves its pollutants, and nobody maintains its controls | Excavation, containment, monitoring (F17) |
  | Critical services | Yes, for facilities that can move, such as the transfer station (F20) | Raise, protect or gate what cannot move: I-80, frontage roads, sewer mains |
- **E7. No new site needed; doing nothing is the base case (2026-11-03).** Eric: "We do not have to
  find an alternative location for a transfer station." Retreat for the transfer station can mean
  closing it and using a regional transfer station, as neighbors with franchised haulers do (F21);
  the lever does not require a sketched destination. "Do nothing is the base case and definitely
  worth keeping": every comparison starts from today's arrangements at the chosen level, and doing
  nothing stays an option the reader can choose. Applied in `docs/design/mitigations.md`.
  Eric, same day: retreat "can mean that we exit the business of running a transfer station as we
  are no longer a viable site". So the lever is "the City stops running a transfer station; its
  waste goes to a regional one", a decision about the City's role, not a site search. Two
  qualifications, recorded with it: when the site stops working depends on the scenario, and the
  explorer shows that instead of asserting it. The transfer station's mapped ground, outfalls
  assumed open (`analyze`, derived): 3% can fill through the drains at 11.03 ft NAVD88, 18% at 12,
  35% at 12.83; 45% under Bay water at 13.4 (C6), about 2076 under the State's High scenario (C13).
  It lies inside the State's tsunami hazard area today (C16). Second, exiting leaves pieces that
  still need a home or a decision: the City's 110+ collection vehicles parked on the site, the
  recycling center run by Community Conservation Centers, and the public drop-off and buyback
  (F21).
- **E8. The panel's name, and where criticality lies (2026-11-03).** Eric accepted "What's
  exposed" for the panel ("Yes, on the scorecard"). And: "I only consider it vital if we are
  depending on it for that function. If we outsourced to a regional facility, then that facility
  is the vital one." So a critical service is a function the City depends on, attached to whatever
  facility performs it. E4 applies to the transfer station while Berkeley depends on it; under the
  exit lever (E7) the function moves to the regional station, which then appears in the panel's
  critical services. Its exposure reads "not checked here" while it lies outside the map (F21),
  never as safe. Eric, same day: "selection of a third-party site would have to include scrutiny for
  safety". So choosing a regional station is itself a decision with a flood and tsunami check, and
  the exit lever names that check as a step, not a given.
- **E9. The 12 ft scenario's label, and the outside review's page fixes (2026-11-03).** A second
  outside AI review said the label "Scott Ferris's 12 ft" personalizes a hazard and reads as a
  gotcha. Eric: "Yes, adjust the label." It now reads "A 12 ft level quoted at a Council committee
  (Oct 22, 2026)", in a group "Quoted at a public meeting"; his name stays in the source line (M1).
  Eric also approved, from the same review: (1) a stamp on the map with the scenario, level and
  datum, "Not a flood forecast", the date and the site address, so a screenshot keeps them;
  (2) no pool surface for a rain pool under 1 ha (the review found 18–21 ft NAVD88 reported on
  0.0–0.7 ha at 14.53 ft, where every pool spills into Bay water already over its inlet);
  (3) I-80 moved below the other roads in "What's exposed", with the bare-earth caveat first;
  (4) the map before the controls on a phone, scenarios grouped by kind, street lists folded, and
  landmark names on the map.
- **E10. A king tide field check (2026-11-03).** Eric asked for a field guide a non-expert can use
  while he is away: `field-guide.html`. Stops and what the explorer shows at 7.4 ft NAVD88
  (`analyze`, no plan): Bolivar Dr by Aquatic Park, lowest street ground in Berkeley in the
  terrain (7.0–7.2 ft), on low ground that can fill through the storm drains; the frontage road at
  the south end of Aquatic Park (7.6–7.8 ft), dry until about 8.4; Marina Blvd at University Ave
  (lowest street ground 9.9), dry; Second St north of Gilman (9.1–9.3), dry. Tide times are NOAA's
  Richmond predictions (W14), re-read 2026-11-03; the California Coastal Commission's King Tides
  Project names Nov 24–26, Dec 23–25 and Jan 21–22. Results, when they come, are recorded here
  against NOAA's measured water level at Richmond for that morning.

## A third outside review, of published commit b64b41c (shared by Eric in a Claude Code session, 2026-11-04)

- **E11. "Not reached" under the 25% threshold, and ART at 13.2 ft NAVD88.** The review found
  two blocking errors on the page and four optional improvements.
  1. At 12 ft NAVD88 with open outfalls, "Places" showed the transfer station 18% flooded through
     drains while "What's exposed" and "Critical services" said "not reached at this level". The
     cause was the 25% cutoff in `js/exposure.js`. Reproduced: 18.1% of the transfer station and
     13.6% of the Marine Center at 12 ft. Applied: 25% stays the summary's counting rule, and a site
     under it reads "partially reached ... below the summary's 25% counting threshold" with its
     share; the summary line gives how many sites are partially reached. Waste transfer now states
     the site's ground share and that whether the service continues is not assessed here: a share
     of flooded ground does not establish it. Roads and I-80 with no flooded segment now say that no
     segment has a quarter or more of its length flooded, the street rule, in place of "not
     reached". Check: `tests/check.mjs`.
  2. The I-80 connection's warning and the scenario's source line still said ART puts the
     connection near 13.2 ft NAVD88, which C6 and C20 correct: at MHHW + 84 in (13.20 ft NAVD88)
     ART shows the transfer station as 41% disconnected low-lying ground with no connected flooding;
     at + 96 in (14.20 ft NAVD88) it floods 56% of it from the Bay. Applied: both now say so, and
     that the discrete maps bracket the connection without establishing its level. F9's reading of
     the Draft EIR's maps stays in the source line as what that document states.
  3. Optional, applied as text only: the exposure count is a screening result. It does not measure
     release, toxicity, transport or cleanup cost, and a choice of the reader's counts only if the
     measure works. The page says so beside the count.
  4. Optional, not yet applied, for Eric: a "Why these maps disagree" note at the CoSMoS comparison
     (13% best overlap; a best-fitting level is neither validation nor an equivalent scenario);
     clickable SOURCE_NOTES references linking on to primary records; a compact scenario summary
     with jumps to Map, Plans and What's exposed; shareable scenario URLs.
## Eric's decisions, 2026-11-04 (Claude Code session)

- **E12. The third outside review's recommendations (E11).** Eric agreed with the order proposed
  in the session: publish the two blocking fixes (PR #9); then a "Why these maps disagree" note at
  the CoSMoS comparison; shareable scenario URLs; clickable source references; a compact scenario
  summary with jump links; a records request to Caltrans for I-80 profiles and culverts near
  Gilman; and a working rule that a corrected SOURCE_NOTES row is followed by a search of the page
  text for its reference and figure. Applied here: the note, under the CoSMoS outline in
  `index.html`, drawn from C21, C6, C1 and F2 only, and a line in the CoSMoS result saying a best
  match is neither validation nor an equivalent scenario.
  Then shareable views (PR #11): the scenario or level, plan, rain, site choices and outlines are
  kept in the URL after "#" (`js/share.js`), with a "Copy a link to this view" button; map pan and
  zoom are not kept. A link sets only values the page offers, and a wall only if it lies on the
  terrain grid.
  Eric approved merging PRs #9, #10 and #12 and publishing the result to `pages` (a6214f4) in the
  same session, 2026-11-04.
- **E13. The page's opening text (2026-11-04).** Eric: the text at the top "should be greatly
  simplified ... explore how Berkeley and the Bay environment will be impacted by X, Y, Z". Offered
  "could affect" for "will be impacted" (the explorer is never a forecast); he chose: "Explore how
  storm tides, sea level rise and heavy rain could affect west Berkeley's streets, critical
  infrastructure, I-80, pollution sources and the Bay shoreline. Not a flood forecast." The "Start
  here" line is shortened to "pick a water level, then see what it reaches" and the king tide guide
  link. Dropped from the header: "not an official hazard map" and the datum sentence; every level
  on the page still names its datum, and the map stamp still says "Not a flood forecast".
- **E14. Guided and expert modes (2026-11-04).** Eric, on the live page: dead space beside the map,
  the map key below the scenario list, two to three screenfuls of results, wordy technical text,
  and no way in for someone with a question rather than a level ("what are the scenarios under
  which toxic materials from Berkeley can enter the Bay?", "I live at address XXXX", "what can
  disrupt access to I-80, Amtrak"). He asked for a guided mode built on resident questions and an
  expert mode that keeps every scenario open to scrutiny; guided users need not learn NAVD88. On the
  proposal he decided: (1) guided mode's plain-language text need not name the datum, which stays
  in expert mode, under "Show the numbers" and in the map stamp; (2) address lookup by the U.S.
  Census Bureau geocoder, optionally prefilled from the phone's location; (3) add the rail line
  (Amtrak and Union Pacific) to the map. Mockup: `docs/design/mockup/index.html`; design:
  `docs/design/guided-mode.md`; thresholds: C23.
- **E15. Guided mode's first build (2026-11-04).** On the mockup Eric found guided mode promising
  and asked for: "explain this" notes in expert mode, starting with the maps to compare; tsunamis in
  the opening text, with a note on water coming in and going out (storm drains and the rest) and how
  they can happen together; clearer section labels in expert mode, where "1% storm tide today" read
  like a weather forecast. He asked whether the data name the most effective mitigations; the
  answer was C23's defense sweep, with the limits (D6, C11, C6) and the explorer's rule against
  ranking (docs/design/mitigations.md). He accepted the proposals ("those are good answers.
  Proceed"): guided mode answers "What would flood walls, raised roads or tide gates change?" with
  each defense's effect and cost where published, calling none best; the opening text is E13's
  with tsunamis added: "Explore how storm tides, tsunamis, sea level rise and heavy rain could
  affect west Berkeley's streets, critical infrastructure, I-80, pollution sources and the Bay
  shoreline. Not a flood forecast." Scenario groups are renamed "At today's sea level" and "With
  future sea level rise", and "today" is dropped from the 100- and 500-year labels; the map stamp
  adds "at today's sea level" to a level in that group.
- **E16. Follow-ups (2026-11-04).** Eric sent the Caltrans records request drafted in the session
  (As-Built Plans; the flap gate inspection records possibly as a second request): I-80 between
  Ashby Ave and Buchanan St, the Gilman interchange's as-built drainage plans and flap gate, roadway
  profiles with datum, and the Codornices Creek culvert. He asked for the field guide as a PDF with
  his email as the contact, for the volunteer only; the published page keeps "in whatever way he
  arranged with you". He approved archiving the Baykeeper consent decree, the 2016 extreme tides
  study, the Coastal Commission's 2024 guidance and the CGS tsunami data, and the C19 documents
  (archive PRs #31 to #33), and asked for the walls' tracing test (C25), the I-80 and rail heights
  (C27), FEMA's 2018 study (C28), source references as links (`js/refs.js`) and the duration work
  (C26).
- **E17. The fourth outside review, of guided mode (published 354364e, 2026-11-04).** The
  reviewer found both earlier blocking findings fixed (E11, PR #9) and three new ones in
  `js/guided.js`, each guided-mode text claiming more than expert mode's evidence allows:
  (1) "first reached" meant a quarter of a site's grounds, so the defenses table put the transfer
  station's first exposure in 2100 although modeled water first touches its ground through the
  drains at 10.00 ft NAVD88 against 12.40 for a quarter (`data/thresholds.json`, C23); (2) "no
  inland site floods until the water crosses behind I-80" with tide gates left out rain trapped
  behind shut gates, which expert mode states; (3) "When does flooding close the roads and the rail
  line?" promised closures, which flooded terrain samples cannot establish. Done: each site shows
  its first modeled water beside the quarter-of-grounds level, in plain view and in the defenses
  table, with the counting convention stated; the tide gate finding now reads "this model keeps Bay
  water out of the listed inland sites until it crosses the I-80 corridor", with rain held behind
  shut gates stated beside it; the roads question became "Which roads and rail corridors could be
  exposed?", with a note that exposure is not closure and needs road and railway profiles. Also
  taken from the review's optional list: "every sea level estimate" became "all three sea level
  estimates shown"; the I-80 crossing is stated as this terrain model's first surface connection,
  near 13.4 ft NAVD88 (C6), with the real crossings to be confirmed; and a loading message with a
  retry button replaces the empty page left by a failed data download.
