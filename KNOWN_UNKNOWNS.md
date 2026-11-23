# Known unknowns

What this explorer does not know, and what would settle each point. Each item names the source row in [SOURCE_NOTES.md](SOURCE_NOTES.md). Items marked "pending" are in an open pull request and are not yet on `main`.

Maintained by the project. Add an item when a source leaves a question open, and remove it only when a source settles it and the page is corrected to match.

## Water levels and datums

1. **The Marina's shore: 12–14 ft or 12–16 ft?** The City's 2019 Marina study gives 12 to 14 ft NAVD88. FEMA's Volume 2, Table 10 gives a wave runup range of 12 to 16 ft on transects 4 to 12 (C31, C33). We have not checked where FEMA's transects 4 to 12 lie relative to the Marina (C33 leaves this open; C35 places them, pending in PR #44). Until that is checked, it is unknown whether the City's range and FEMA's describe the same shore. We have no source for a difference of method. *Would settle it:* a location check against the Marina's own shore, and the City's and FEMA's descriptions of the shore each range covers.
2. **Does FEMA's still-water column include wave setup?** Table 10 labels its column "Stillwater Elevation" but does not say whether wave setup is included (C31). *Would settle it:* FEMA's technical documentation for the 2018 study.
3. **Ferris's 12 ft.** The source, datum and whether it includes waves are unconfirmed. The explorer shows it by your decision, labeled as an inference (E1). *Would settle it:* the source document or meeting record for the figure.
4. **Ashby Avenue flooding, November 18, 2026.** The article gives no depth, elevation or datum. It names rain as the cause and does not mention the Bay or tides. It is logged as news only (H8). *Would settle it:* the City's or the Nixle alert's own measurement, if any.

## Model and rules

5. **Working tide gates.** Which storm-drain outfalls have working gates is not published. The "up the storm drains" results assume none of them do (D7, D9). *Would settle it:* the City publishing its gate inventory or inspection records.
6. **Floor heights.** The explorer's address lookup says floor heights are not published, so it cannot say whether a home's floor would flood (lookup page text; no SOURCE_NOTES row yet). *Would settle it:* a published floor-elevation survey, or the property's own survey.
7. **The 300 m count near the Bay.** The count of City screening sites within 300 m of open Bay water is a straight-line model rule. The 300 m radius is our choice. It has not yet been checked against a published depth map, as CLAUDE.md asks of a rule that shows a result. (E34.) *Would settle it:* a published depth map to compare against, and a sourced radius.
8. **Bare-earth terrain under I-80 and the rail line.** The lidar removes bridges and raised decks, so the page's road results for I-80 and the rail line rest on terrain without them (C24, F2). *Would settle it:* Caltrans and railroad profiles for those corridors.
9. **Sites outside the map.** The City's table lists sites beyond the explorer's grid. They are not shown (E29). *Would settle it:* a larger terrain grid.

## Contamination

10. **Whether the contamination controls work.** Unknown. The 2016 consent decree required trench drains, berms and sampling (F22 in PR #38, merged). The transfer station's state record shows an active registration with no sampling results reached (F24). The recycling center's own state record was not found (F25). *Would settle it:* the state's sampling reports and inspection records for both sites.
11. **Whether the 2016 decree was extended past its 2019 end.** Unchecked. The court docket was not readable (F26). *Would settle it:* the docket's full filing history.
12. **What the City's contaminated-site layer shows.** It shows the City's groundwater-rise ranking at current levels, not contamination or whether any control works (E29). *Would settle it:* nothing in the layer itself; the controls question above is separate.
13. **The rows the layer leaves out.** Thirty-three residential or owner-named rows, 22 address-only rows, 7 possible private names and one more owner-named row found at review were removed by judgment on the names: 63 in all (E29). They are not in the repository, and the judgments have not been checked by anyone outside the project. *Would settle it:* an independent check of the removals by the maintainer.

## Sources not read

14. **Four scanned Caltrans PDFs.** In the shared Drive folder. Not read (C34). *Would settle it:* OCR of each file, or text versions from Caltrans.
15. **The FEMA Map Service Center listing for the Berkeley shore.** The 2018 panels are effective according to the NFHL (C28 (a)). The Map Service Center listing itself has not been checked separately. *Would settle it:* that listing.

## Civic stories

16. **The two City projects in the comment.** Their costs and scope come from the City's CIP documents. The comment asks for two changes, which are advocacy positions. The story's claims have not yet been reviewed, so `reviewedBy` is not set (E31, pending in PR #36). *Would settle it:* the maintainer's review of the story's claims.

## Observed levels

17. **Observed winter king tides.** The explorer uses NOAA predictions for the three winter windows. No field readings have been taken (W14, E10). *Would settle it:* field readings at the windows, compared with the predictions.
