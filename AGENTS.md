# Agent instructions: Berkeley Bay Flood Explorer

This file is for Codex and any other agent that reviews or contributes to this repository.
`CLAUDE.md` holds the working instructions; where the two disagree, `CLAUDE.md` governs.
`specification.md` is the design brief; every insight and its source is in `SOURCE_NOTES.md`.

The explorer is an educational tool for comparing what Bay water levels reach in west
Berkeley under different plans. It is never a flood forecast and never an official hazard
map. A review succeeds when it catches a number, claim or label that would mislead a
resident or would not survive someone checking the source.

## How Claude Code and Codex work together

The loop is the one in the wildfire simulator's `AGENTS.md`
(https://github.com/ericdf/berkeley-wildfire-simulator/blob/main/AGENTS.md): Claude Code
writes the PR and marks it ready when the first complete draft is in, which starts Codex's
first review; Claude Code posts `@codex review` after each substantive push and answers
every finding with the commit SHA or its reasons; the loop ends at a clean review or an
issue that needs the maintainer, and closes with a completion report (Produced / Verified
by Codex / Uncertain / Needs your approval).

**Reserved to the maintainer:** what the explorer claims to show or its "not a forecast"
framing; adding or withdrawing a scenario, water level or plan option; choosing between
conflicting sources; replacing a sourced value with an assumption; anything touching
personal information. The decision counts only when given in a Claude Code session naming
the PR.

**No agent ever** approves or merges a PR, pushes to `main` or `pages`, or commits
credentials, personal data or parcel owner names.

## Review guidelines

Mark every finding **blocking** or **optional** with its location.

### Blocking

- **A water level without a datum,** or a level presented as a rise (or the reverse). Guided
  mode's plain-language text is exempt from the datum (CLAUDE.md, E14); its levels must still
  trace to a scenario or a derived threshold, shown with the datum under "Show the numbers".
- **Still water and wave-inclusive elevations mixed** in one comparison or table.
- **Untraceable numbers.** Every figure traces to a cited source, a file in the repository
  or a reproducible run. Recompute where you can.
- **Missing or wrong provenance category.**
- **Forecast language.** Results must not read as predictions of a real event.
- **Unlogged insights** missing from `SOURCE_NOTES.md`.

### Optional

- Clearer wording, simpler code, better tests, and proposals that reshape the work.
