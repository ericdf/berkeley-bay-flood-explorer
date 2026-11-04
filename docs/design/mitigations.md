# Mitigations the public can explore: design note

Status: 2026-11-03. Built: the "What's exposed" panel (`js/exposure.js`, `data/exposure.json`) with "What current plans leave out", and the site choices (flood-proof, move, exit, contain, remove). Not built: a berm around one site (a drawn wall does this), sourced costs beyond the City study's. Sources are in
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

## What the reader sees: "What's exposed", by E6's measures

The panel is titled "What's exposed", not a panel. A score implies points and a ranking, and
the explorer ranks nothing (Neutrality, below). It has two columns: **Do nothing**, the base case
(E7), and **Your choices**. For the chosen level, plan and rain, it lists:

1. **Pollutant release.** Each site in `data/sites-checked.json` and each mapped place that takes
   water, and how: Bay water over the surface, through the drains, pooled rain, or inside the
   State's tsunami hazard area (which does not depend on the level). Each site carries its kind
   of risk, from its records:
   - hazardous materials in use (an operating business or the transfer station);
   - contamination in the ground (an open or closed cleanup case, F19);
   - both.
2. **Critical services.** Functions the City depends on, each attached to the facility that
   performs it (E8): waste transfer (today the City's station; under the exit lever, the regional
   station), I-80 and its frontage roads, the Marina's access roads, and the storm drain outfalls.
   For each, whether it is reached, at what level, and what the reader's choices change. A facility
   outside the map reads "not checked here". The sewer system (F15) is listed as not modeled.
3. **Life safety: a check.** The streets under water that people would use to leave, as a list.
   No casualty or evacuation figure; the explorer has no basis for one.

Each line names its source row. A site with no published record of what it stores says so
("what it stores is not published"); it is not counted as zero.

## The levers, by kind

| Kind | Lever | State | What the model does | Known cost | Who decides |
|---|---|---|---|---|---|
| Protect | City study floodwalls | Built | Raises ground along the traced lines (P1–P4, P9) | $14.3M for 2050 protection, $31.5M for 2100, cumulative, 2019 dollars (P5) | City |
| Protect | City study raised roads (Spinnaker Way, University Ave west of I-80) | Built | Raises the road lines (P6, P7) | Not stated separately in the study; its $5.4M by 2050 is revetment and breakwater work (P5) | City |
| Protect | Tide gates on outfalls | Built | Closes drain links (D3) | Not published | City |
| Protect | A drawn wall, any crest | Built | Raises ground along the line | None | Reader |
| Protect | A berm around one site (for example, the transfer station) | New | A drawn wall preset to the site's outline | Not published | City or owner |
| Accommodate | Raise a site's floor or storage to a chosen level | New | Marks the site's materials as kept dry up to that level; the ground still floods | Not published | Owner; City by permit |
| Accommodate | Flood-proof hazardous materials storage (as Gilman Gateway HYD-4, F18) | New | As above, for stored materials only | Not published | Owner; City as CUPA |
| Retreat | Exit: the City stops running a transfer station and its waste goes to a regional one, as neighbors with franchised haulers do (F21, E7) | New | Takes the station's operations, its stored waste and the 110+ service vehicles parked there off the panel; its ground and any contamination stay. Moves the critical function, not deletes it: the regional station becomes the critical facility in the panel, its exposure "not checked here" while outside the map; choosing one would include a flood and tsunami check of its own (E8). Lists what still needs a home: the vehicle yard, the recycling center and the public drop-off. Shows the level, by scenario, at which the site stops working (E7) | Not published for exiting. Doing nothing carries a $120M rebuild need in the proposed 2027-31 capital plan, unfunded, and the station's operating cost is not published (Z1, Z2) | City |
| Retreat | Move an operating hazardous-materials business | New | As above, for that business | Not published | Owner |
| Clean up | Remove a site's contamination (excavation and off-site disposal, groundwater treatment) | New | Takes the site off the contamination list, as the reader's explicit assumption, beside the case's real status (F17, F19) | Not published | DTSC or the Water Board, with the owner |
| Clean up | Contain a site's contamination (caps, vapor barriers, land use covenants) | New | Keeps the site on the list, marked "contained", with its controls and their limits: flooding or rising groundwater can defeat a vapor-control system (F17) | Not published | DTSC or the Water Board, with the owner |

Rules:
- **Retreat does not delete contamination.** Moving an operation removes what it stores. A
  contaminated site stays on the panel until the reader also assumes the contamination is
  removed (E6's table).
- **Containment is not removal.** A contained site stays on the panel, with its controls named
  and what can defeat them; only an explicit removal assumption takes it off.
- **A lever never changes the water.** Protection changes the ground; accommodation and retreat
  change what is exposed; removal changes what the ground carries; containment changes how it is
  held, within limits.
- **Every new lever is an assumption the reader makes,** labeled as such, beside the real status.
  For example: "you assumed this site is cleaned up; its case is open (GeoTracker T10000005594)".
- **Cost is shown only where a source gives it.** Otherwise "cost not published", never an
  estimate of ours.

## Neutrality

The explorer shows tradeoffs and does not rank options. Guided mode's defenses question (Eric, E15)
shows each defense's effect, the level at which places are first reached with and without it, beside
its cost where a source gives one, and calls none of them best. Each lever shows:
- what it changes on the panel;
- what it leaves unchanged;
- who would have to decide.

Retreat sits beside protection on equal terms. Doing nothing is the base case every option is
compared against, and an option in its own right (E7).

## Data needed

- **What operating sites store.** Hazardous materials business plans are filed with the City's
  Toxics Management Division (the CUPA) through CERS. The public portion may give the facility
  list and categories but not quantities. Without it, the panel says "not published".
- **Costs** of relocation, raising a site, flood-proof storage and cleanup, wherever a public
  document gives them (for example, the Gilman Gateway cleanup's financing argument, F17).
- **The tsunami mitigation research now running** (the City's after-action report, the hazard
  mitigation plan, hazardous materials planning rules). It may supply existing plans for the
  panel's "what is in place" column.

Settled 2026-11-03: every site in the panel has been re-read against the State record (C18,
T5), so the open question of showing unverified rows is moot. The "not re-read" tag stays in
the code for any site added later.

Settled (E7): doing nothing is the base case and stays an option; the transfer station lever
needs no new site, since a regional station can take Berkeley's waste.
