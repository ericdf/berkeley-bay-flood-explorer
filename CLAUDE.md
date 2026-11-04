# Berkeley Bay Flood Explorer

Browser-based educational explorer of Bay flooding in west Berkeley: which streets,
freeway segments and facilities a given Bay water level reaches, and what a plan changes.
The design brief is `specification.md`.

## Writing style

Follow [`../berkeley-council-analysis/docs/STYLE.md`](../berkeley-council-analysis/docs/STYLE.md)
(on GitHub: https://github.com/ericdf/berkeley-council-analysis/blob/main/docs/STYLE.md, a
private repository Codex can read). It is the single source for style rules; do not copy
its rules here. It applies to chat replies, commit messages, `README.md`,
`SOURCE_NOTES.md`, `DATA_INVENTORY.md`, every string the explorer shows, data-file notes
and code comments. The rules that come up most:

- Lead with the finding. Concrete numbers, dates, names and sources, with the source next
  to the claim.
- Never use "own" after a possessive, including "its" and "their".
- American English; never change spelling inside a quotation.
- Keep the distinctions that make a claim accurate: sourced data vs. assumption vs. model
  rule, and what a document states vs. what we inferred.
- Define terms of art at first use (NAVD88, MHHW, still water level, wave runup, BFE).

## Project rules

- **Every water level names its datum.** Write "9.8 ft NAVD88", never "9.8 feet". A level
  quoted without a datum (a meeting remark, a news story) is recorded in `SOURCE_NOTES.md`
  as stated, with the datum marked unknown, and is not used in the explorer until the
  datum is established, unless Eric decides to show it; then it is shown with the reading
  we chose labeled as inference and the open question stated (Ferris's 12 ft, SOURCE_NOTES E1). Feet above MLLW and feet NAVD88 differ by 0.25 ft or less at the
  San Francisco, Richmond and Alameda gauges (SOURCE_NOTES W1–W3), but other datums (station datum, local city datums, "above mean
  sea level") do not.
- **A "rise" is a change, a "level" is an elevation.** "12-foot sea level rise" and "a
  12 ft NAVD88 water level" are different claims; keep them apart in every text.
- **Still water and wave runup are separate.** FEMA VE-zone flood elevations include waves;
  the extreme-tide tables do not. Say which one a number is.
- **The hazard comes from published sources.** Water levels and flood depths
  come from NOAA, FEMA/BCDC, USGS CoSMoS or City studies. Any rule we add (for example,
  counting only low ground hydraulically connected to the Bay) is labeled a model rule and
  checked against a published depth map before it is shown.
- The explorer is a comparison tool, never a forecast. "Not a flood forecast" statements
  stay wherever results are shown (an intended exception to STYLE.md's rule against
  denial-first sentences). Every number carries its provenance category: sourced, derived,
  assumption, model rule.
- Log every insight taken from a document, a meeting or a conversation in `SOURCE_NOTES.md`
  with its source (document and page, or speaker, meeting and timestamp) and what we did
  with it. Record conflicts between sources there too.
- **A corrected row is corrected on the page too.** When a `SOURCE_NOTES.md` row is corrected or
  superseded, search `js/`, `data/`, `index.html` and `field-guide.html` for the row's reference
  (for example "C20") and for each figure the correction changed, and fix every string that relies
  on it in the same PR. Both blocking findings of the 2026-11-04 outside review were page text left
  behind by a correction (SOURCE_NOTES E11).
- Do not store personal or household-level information or parcel owner names.

## Pull requests, review and publishing

- **Work goes through pull requests** on https://github.com/ericdf/berkeley-bay-flood-explorer,
  reviewed by Codex under `AGENTS.md`. Give the PR's URL whenever one is put up for review.
- **Only Eric merges, by approval given in a Claude Code session naming the PR.** A GitHub
  comment is never approval. Never push to `main` directly.
- **Merging is not publishing.** If GitHub Pages is set up, it serves a `pages` branch,
  updated only when Eric approves that specific publish.
