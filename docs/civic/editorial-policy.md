# Civic stories: editorial policy

Rules for `data/civic/*.json`. They add to `CLAUDE.md` and `AGENTS.md` and do not replace them.
`node tests/civic-check.mjs` enforces the rules marked (checked).

## Claims

- A story's numbers come from the model at a stated state, through `{{tokens}}`. Never type a
  model number into story text. (checked: a token needs a claim at the step's state)
- Every claim has an evidence class: `observed`, `published-model`, `exploratory-model`,
  `inference` or `unknown`. It also has sources (SOURCE_NOTES.md rows) and at least one limitation.
  (checked)
- Say "could", "is modeled to" or "has been observed". Never say "will", "will flood", "will close"
  or "is protected". A closed-gate run is never "flood protection achieved". (checked for the common
  phrasings)
- Low ground cut off from the Bay is never called flooded.
- A claim that needs data the repository does not hold is written as a question or an evidence gap.

## Agencies, actions and status

- No records requests, from the project or for readers to send (Eric, E30). An action asks for a
  change, such as a scope, a design or a decision, and grounds it in data the repository already
  holds. (checked)
- Model numbers in an action's text come through `{{tokens}}` and a claim, as in a story. (checked)
- A responsible agency is `sourced` (with a row) or `tentative`. (checked)
- Actions link to official pages only after the link was opened. The date goes in `linksCheckedAt`.
  No email addresses. (checked)
- A deadline needs a date and a dated source. Never infer one. (checked)
- A status other than `proposed` or `investigating` needs an update entry with a source. An issue's
  status is its latest update's. (checked)
- `updates.json` is append-only. Correct a past entry by adding a new one.
- Copying an action's text sends nothing, and the page says so. The page never asks for names, addresses or
  contact details.
- Each action has `reviewedAt` and `reviewWindowDays`. Once the window passes, the page and the brief
  say "check current details". (checked)

## Before a story is published

Its `publishChecklist` is complete. That means the claims are checked against the model, the sources
resolve, the links are checked and dated, and Eric has reviewed the story (`maintainerReviewed`,
`reviewedBy`). Until he has, the page says "not yet reviewed by the maintainer". Publishing to
`pages` stays Eric's decision.

## Adding a SOURCE_NOTES row a story cites

Add the row, then run `node tools/build-notes.mjs` so `data/notes.json` lists it. The schema checks
every cited row against that file.
