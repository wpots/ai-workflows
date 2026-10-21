---
name: release-notes
description: "Release Notes Runbook"
---

# Release Notes Runbook

Canonical runbook for writing release notes a customer can read. The
`release-notes` skill on skill-aware tools wraps this runbook; Codex, Copilot,
and other prompt-first tools should follow these steps directly.

Goal: turn what shipped — a release between two refs, or the delivered set of a
closed sprint — into plain-language notes the customer's product owner can
forward unedited: what is new, what improved, what was fixed, what upkeep we
did, what they should know, and where it is live. The sprint changelog from
`commands/close-sprint.md` is an internal audit trail (commit SHAs, MR numbers,
ticketless rows, justification) and the demo runsheet from
`commands/sprint-demo.md` is presenter material. Neither is shareable as-is;
both are good input. The issue tracker is read-only throughout.

## Safety

- **Never** post the notes anywhere — no Jira comment, Slack message, mail,
  Confluence page, or release description. The document and a paste-ready
  block are the deliverable; the user shares them.
- **Never** run `git commit` — the user commits themselves.
- **Never** mutate the tracker.
- **Nothing is called live without proof.** An item appears under the
  production heading only when its delivering commit is an ancestor of the
  production ref (Phase 2). Merged to the integration branch is not live.
- Stop and ask when an item cannot be described without internal detail, or
  when its customer-visible effect is unclear. Do not invent value.

## Inputs

Ask the user at start, one question at a time; take a default silently when the
repo answers it:

1. **Scope key** — a release (`<previous-tag>..<release-tag>`, or
   `<production-ref>..<integration-ref>` for "what goes live with the next
   deploy") or a sprint (`Sprint <N>`, whose delivered set comes from the
   sprint changelog; in support mode the month, `support-<yyyy>-<mm>`).
   Default: the most recent release tag to the integration branch head.
2. **Production ref** — the branch or tag deployed to production (e.g.
   `origin/main`). Needed for Phase 2 even when the scope key is a sprint.
3. **Audience** — the customer's product owner (default) or end users.
   End-user notes drop the ticket appendix and the "goed om te weten" items
   only a product owner acts on.
4. **Language** — the customer's. Default Dutch; the project's `CONVENTIONS.md`
   may name another.
5. **Tracker project key** — infer from backlog filenames (e.g. `RFW`).

## Phase 0 — Sources, in order of trust

Collect the delivered set from the first source that exists; use later ones to
fill gaps, never to override an earlier one:

1. `docs/sprint-<N>-changelog.md` (or `docs/support-<yyyy>-<mm>-changelog.md`)
   § Opgeleverd — the "Wat" column is already one functional sentence per item,
   verified at sprint close, with the delivering commit in "Bewijs".
2. `docs/demo/sprint-<N>/demo-script.md` — the "Wat" and "Waarom het telt"
   lines per story plus the talk-only list; once close-sprint has flattened
   the folder, the same content is `docs/sprint-<N>/demo.md`.
3. Tracker tickets in the range: `git log <range> --format=%s` for the keys,
   then each ticket's summary and acceptance criteria, and its BLI in
   `docs/backlog/` or `docs/sprint-<N>/`.
4. Commit subjects — for finding items only. A commit subject is never the
   customer-facing sentence.

Record per item: key (or `—`), one functional sentence, source, and the commit
or MR that delivered it. The commit is kept for Phase 2 and dropped from the
output.

## Phase 1 — Classify for the customer

| Class | Goes to | Test |
| --- | --- | --- |
| `new` | Nieuw | the customer or their users can do something they could not before |
| `improved` | Verbeterd | an existing thing works better, faster, or more clearly |
| `fixed` | Opgelost | something that was wrong now works — name the symptom the user saw, never the cause |
| `maintenance` | Onderhoud | upkeep the team does on its own initiative, not a customer request or a reported bug: dependency and framework updates, cleanup of unused fields or data, housekeeping of background jobs |
| `notice` | Goed om te weten | changed behaviour, a feature flag or test period, something the customer must do or decide |
| `internal` | omitted, or one summary line under Onderhoud | refactor, CI, lint, types, docs, test infrastructure |
| `security` | Onderhoud, as an outcome; Verbeterd when the customer asked for it or reported it | a vulnerability, leaked secret, exposed route, or hardening |

Onderhoud answers the question a customer asks about these lines: which ticket
or bug is this? None, it is upkeep. Ask per item whether the customer could have
requested or reported it: yes goes to Nieuw, Verbeterd, or Opgelost; no goes to
Onderhoud.

Security items are phrased as the protection the customer now has ("de
koppeling met het bibliotheeksysteem is extra beveiligd"), never as the weakness
that existed ("sleutels stonden in logs"). When the customer must act — rotate a
key, re-approve access — that action goes under Goed om te weten without the
reason spelled out.

## Phase 2 — Verify where each item is live

For each item's delivering commit:

```bash
git fetch --all --quiet
git merge-base --is-ancestor <sha> <production-ref> && echo live || echo not-live
```

- `live` → the item may appear under the production heading. Its date is the
  release tag's date, or the deploy date the user names.
- `not-live` → the item goes under the heading of the environment it is on
  (acceptance, staging), or the notes are titled as the upcoming release and
  "Waar staat het" says so. Never mix the two silently.
- A sprint changelog verified against `development` is not a production
  statement — run this check anyway.

## Phase 3 — Write

Write `docs/releases/<key>.md` from the [Template](#template) below, with
`<key>` the release tag without the `v` (`1.5.0`), `sprint-<N>`, or
`support-<yyyy>-<mm>`. Create the folder when it does not exist. Filling rules:

- **One sentence per item, functional, from the user's side** — what they can
  see or do now. No ticket keys, commit SHAs, MR numbers, branch names, file
  paths, component names, or vendor internals in the body.
- **Group by what the customer recognises** — a product area, a page, a user
  task — not by ticket order. Only "Nieuw" gets sub-headings; the other
  sections are flat lists.
- **"Goed om te weten" holds decisions and actions**, one bullet each, with the
  date or condition when known.
- **"Onderhoud" is a short flat list, one line per kind of upkeep** (a framework
  update, a security patch, a cleanup), not per package or per ticket. Package
  names and versions stay out. The fixed line under the heading carries the "no
  ticket, no bug" explanation, so the bullets do not repeat it. Leave the
  section out when it is empty.
- **"Waar staat het" is mandatory** and states per environment what is there
  and since when. It is the only place environment names and URLs appear.
- **The ticket appendix** (`## Bijlage — tickets`) maps every body line to its
  key, one row each; an Onderhoud line without a ticket gets `—`. Included for
  the product-owner audience, omitted for end users.
- Target size: under one screen for a sprint, under 6 KB in any case. Longer
  means the internal changelog is leaking in.

Then print a **paste-ready block** in the reply: the same notes without the
appendix, formatted for the channel the user names (Slack, mail) or as plain
Markdown by default.

## Phase 4 — Review pause (stop here)

Print the file path, the paste-ready block, the item count per class, the
`internal` items you dropped, the items that failed the Phase 2 check and where
they landed, and any item you could not phrase without internal detail. Then
stop. The user reads, edits, and shares.

## Output

End with a concise list of:

- The notes path (`docs/releases/<key>.md`).
- The paste-ready block.
- Dropped `internal` items, so the user can promote one back.
- Items not yet live and the environment they are on.
- Open questions from Phase 1 or Phase 3.

## Template

The section structure and filling rules are normative; the labels follow the
customer's language — the example is Dutch. In English the Onderhoud heading is
"Maintenance" and its fixed line reads "Regular maintenance by Greenberry, not a
requested change or a bug."

````markdown
# Release 1.5.0 — <datum>

Voor: <klant>, productowner · Van: Greenberry

## Nieuw

### Zoeken in de collectie

- Zoekresultaten tonen per titel of hij nu aanwezig is in een vestiging.
- Uitgebreid zoeken heeft een leeftijdskeuze en een jaartalbereik.

## Verbeterd

- Boekentips uit het CMS laden sneller en tonen altijd een omslag.

## Opgelost

- Een collectiepagina met alleen een korte titel gaf een foutmelding.
- Verdwenen knoppen op de homepage zijn terug.

## Onderhoud

Regulier onderhoud door Greenberry, geen aangevraagde wijziging of bug.

- De koppeling met het bibliotheeksysteem is extra beveiligd.
- De website draait op de nieuwste veilige versie van het onderliggende
  framework.

## Goed om te weten

- Specificaties op de detailpagina staan tot <datum> achter een schakelaar;
  daarna kiezen we samen welke set blijft.
- Oude links en bladwijzers naar de collectie blijven werken.

## Waar staat het

- **Productie** (<url>): alles hierboven, sinds <datum>.
- **Acceptatie**: niets dat hier nog niet in staat.

## Bijlage — tickets

| Regel | Ticket |
| --- | --- |
| Zoekresultaten tonen per titel of hij nu aanwezig is in een vestiging | OBA-120, OBA-123 |
| Uitgebreid zoeken heeft een leeftijdskeuze en een jaartalbereik | OBA-124 |
| De koppeling met het bibliotheeksysteem is extra beveiligd | OBA-119, OBA-140 |
| De website draait op de nieuwste veilige versie van het onderliggende framework | — |
````
