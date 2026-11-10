# Handoff

Open work for the next session, as of 2026-11-06. Read `CLAUDE.md` and `AGENTS.md` first. Delete
each item here once it is done.

## Ready when Eric asks

1. **FEMA's wave setup question (C28 (b)).** Open. Settling it needs FEMA's BakerAECOM coastal
   report for Alameda County, which is expensive to obtain and changes only the labels of two
   scenarios (`fema100`, `fema500`). Not requested. FIS Volume 2 (pulled 2026-11-06) checks the
   transect values but does not settle it (SOURCE_NOTES C31). The scenario labels now say "FEMA's
   still-water column" (E28), so they are no longer inferred.
   The question about how FEMA fitted its still water levels (C28 (c)) is also open, with low impact.

## Waiting on Eric

- **Civic stories (E29).** Review the calls listed in `docs/civic/implementation-notes.md`: building
  on `main` and not dedd762; extending guided mode; and a records request that readers send
  themselves, given E26. Then review the drain story's claims, which lets `reviewedBy` be set. Then
  decide whether to publish. The next phase rebuilds the roads, contaminated-site and defenses
  questions as stories.

## Deferred (each adds a control to the page)

2. **A barrier at the crossing behind I-80 (C6),** tested like the walls (C25). Deferred: it adds a
   defense option and a new result. Build it only when a specific question needs it.
3. **Waves.** FEMA's 2018 transects (C28) give wave-inclusive Base Flood Elevations of 12 to 16 ft
   NAVD88 along Berkeley's shore; CoSMoS (C21) models waves. Deferred until question 1 is settled,
   and it needs a design that keeps still water and waves apart (CLAUDE.md).

## After the king tides

4. **Run the king tide comparison** after each field date: Nov 24–26, Dec 23–25 and Jan 21–22.
    The volunteer's readings go in `data/field/kingtide-YYYY-MM-DD.csv`, and
    `node tools/kingtide-compare.mjs` compares each with NOAA's predicted level at Richmond
    (9414863, `data/raw/noaa/richmond-predictions-kingtide.csv`) and with the explorer's 7.4 ft
    NAVD88 level. The script and predictions are merged (PR #32). Publish the output, and record
    the result under E10 in `SOURCE_NOTES.md`, credited or anonymous as the volunteer chose.

## Housekeeping

- Private correspondence that gave leads on the transfer station economics stays out of the
  repository. Its claims were checked against public records only (Z1–Z6).
