# Mitigations the public can explore: design note

Status: proposal, 2026-11-03, for Eric's review. Nothing here is built. Sources are in
`SOURCE_NOTES.md`; the measures come from Eric's decision E6. The explorer stays an educational
comparison tool, not a flood forecast or a recommendation; that holds for every option here.

## Purpose

Eric, 2026-11-03: "What I'm building toward is what would be a set of mitigations that the public
could usefully explore. The city may not choose retreat, but maybe an informed public would."

So the explorer should let a reader put the four kinds of response side by side, for the same
water level, and see what each one changes and what it leaves: protect, accommodate, retreat
and clean up. That includes options no agency has proposed, such as moving the transfer station,
whose Draft EIR rejected another site without weighing flood exposure (F20). Each option is shown
with what is known about it (source, cost, who decides) and what is not.

## What the reader sees: a scorecard by E6's measures

For the chosen level, plan and rain, a panel lists:

1. **Pollutant release.** Each site in `data/sites-checked.json` and each mapped place that takes
   water, and how: Bay water over the surface, through the drains, pooled rain, or inside the
   State's tsunami hazard area (which does not depend on the level). Each site carries its kind
   of risk, from its records:
   - hazardous materials in use (an operating business or the transfer station);
   - contamination in the ground (an open or closed cleanup case, F19);
   - both.
2. **Critical services.** The transfer station, I-80 and its frontage roads, the Marina's access
   roads, and the storm drain outfalls: whether each is reached, at what level, and what the
   reader's plan changes. The sewer system (F15) is listed as not modeled.
3. **Life safety: a check.** The streets under water that people would use to leave, as a list.
   No casualty or evacuation figure; the explorer has no basis for one.

Each line names its source row. A site with no published record of what it stores says so
("what it stores is not published"); it is not counted as zero.

## The levers, by kind

| Kind | Lever | State | What the model does | Known cost | Who decides |
|---|---|---|---|---|---|
| Protect | City study floodwalls, raised roads | Built | Raises ground along lines (P1–P9) | $14.3M, $31.5M, $5.4M cumulative, 2019 dollars (P4, P5) | City |
| Protect | Tide gates on outfalls | Built | Closes drain links (D3) | Not published | City |
| Protect | A drawn wall, any crest | Built | Raises ground along the line | None | Reader |
| Protect | A berm around one site (for example, the transfer station) | New | A drawn wall preset to the site's outline | Not published | City or owner |
| Accommodate | Raise a site's floor or storage to a chosen level | New | Marks the site's materials as kept dry up to that level; the ground still floods | Not published | Owner; City by permit |
| Accommodate | Flood-proof hazardous materials storage (as Gilman Gateway HYD-4, F18) | New | As above, for stored materials only | Not published | Owner; City as CUPA |
| Retreat | Move the transfer station | New | Takes the station's operations off the scorecard; its ground and any contamination stay | Not published; the Draft EIR found no site meeting its criteria (F20) | City |
| Retreat | Move an operating hazardous-materials business | New | As above, for that business | Not published | Owner |
| Clean up | Remove a site's contamination (excavation and off-site disposal, groundwater treatment) | New | Takes the site off the contamination list, as the reader's explicit assumption, beside the case's real status (F17, F19) | Not published | DTSC or the Water Board, with the owner |
| Clean up | Contain a site's contamination (caps, vapor barriers, land use covenants) | New | Keeps the site on the list, marked "contained", with its controls and their limits: flooding or rising groundwater can defeat a vapor-control system (F17) | Not published | DTSC or the Water Board, with the owner |

Rules:
- **Retreat does not delete contamination.** Moving an operation removes what it stores. A
  contaminated site stays on the scorecard until the reader also assumes the contamination is
  removed (E6's table).
- **Containment is not removal.** A contained site stays on the scorecard, with its controls named
  and what can defeat them; only an explicit removal assumption takes it off.
- **A lever never changes the water.** Protection changes the ground; accommodation and retreat
  change what is exposed; removal changes what the ground carries; containment changes how it is
  held, within limits.
- **Every new lever is an assumption the reader makes,** labeled as such, beside the real status.
  For example: "you assumed this site is cleaned up; its case is open (GeoTracker T10000005594)".
- **Cost is shown only where a source gives it.** Otherwise "cost not published", never an
  estimate of ours.

## Neutrality

The explorer shows tradeoffs and does not rank options. Each lever shows:
- what it changes on the scorecard;
- what it leaves unchanged;
- who would have to decide.

Retreat sits beside protection on equal terms; so does doing nothing.

## Data needed

- **What operating sites store.** Hazardous materials business plans are filed with the City's
  Toxics Management Division (the CUPA) through CERS. The public portion may give the facility
  list and categories but not quantities. Without it, the scorecard says "not published".
- **Costs** of relocation, raising a site, flood-proof storage and cleanup, wherever a public
  document gives them (for example, the Gilman Gateway cleanup's financing argument, F17).
- **The tsunami mitigation research now running** (the City's after-action report, the hazard
  mitigation plan, hazardous materials planning rules). It may supply existing plans for the
  scorecard's "what is in place" column.

## Open for Eric

1. Should the scorecard show a site's kind of risk (in use, in the ground) from the research
   agent's reading of the databases, or only rows we have re-read ourselves?
2. Should doing nothing be its own explicit option, with the scorecard showing today's exposure
   at the chosen level?
3. Should moving the transfer station have a sketched destination? A destination would need a
   real site and its own flood check; without one, the lever only removes the current site's
   exposure.
