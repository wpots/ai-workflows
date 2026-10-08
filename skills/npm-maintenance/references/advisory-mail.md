# Dev-team mail for a patched advisory

When a dependency advisory is fixed and live, the Greenberry dev team hears
about it in one short mail. That way anyone who runs the same package in another
project can check theirs. Offer this mail after §4 step 6 of the skill. Never
send it. The user sends it.

## Rules

- **Mirror the previous mail.** Search the sent mail for the subject
  `OSV scan (PATCHED)`. Reuse the format and the recipients of the most recent
  one, and propose those recipients to the user before drafting. The template
  below is the format to use when there is no earlier mail.
- **To:** `development@greenberry.nl`, plus whoever was in To of the previous
  mail. The first mail also went to the project lead.
- **Subject:** `OSV scan (PATCHED) - <project> - <GHSA-id>`.
- **Body:** Dutch. One opening sentence, then the facts table. No closing
  line or "Groet": the user's mail signature follows the table. No risk
  analysis, no lockfile tips, no workaround. The dev team wants the facts and
  the dates. Whoever needs more follows the advisory link.
- **Advisory link:** in the opening sentence, link the GHSA id to the GitHub
  advisory page.
- **Advisory date:** show the user both OSV's `published` date and the date on
  the GitHub advisory page when they differ, and let the user choose.
- **"Live" rows:** fill these in only after the proof in step 6 of the skill:
  the commit is on the production ref and the deploy pipeline passed. Until
  then, leave the row out. Never write an expected date in it.

## Delivery

1. **Try a draft first.** Create a draft with the mail connector, such as
   Gmail `create_draft`. Put the table in the HTML body as a real `<table>` with
   borders, and give a plain-text body as the alternative. Report the draft's
   link.
2. **Fall back to paste-ready.** When the connector is missing or refuses (for
   example Gmail's "Insufficient scope", a connector without compose rights),
   say so and give the mail in the reply. Tell the user to copy the table from
   the rendered view, not the Markdown source, so the mail client keeps it as a
   table.

## Template

**Aan:** development@greenberry.nl, plus the recipients of the previous mail
**Onderwerp:** `OSV scan (PATCHED) - <project> - <GHSA-id>`

```markdown
Hi iedereen,

Sinds <datum> staat er een advisory op <pakket>: <GHSA-id>. In het
<project>-project staat <pakket> inmiddels op <versie>.

| Wat                             | Details                                                   |
| ------------------------------- | --------------------------------------------------------- |
| Advisory                        | <GHSA-id> (<CVE-id>)                                      |
| Geraakt                         | <pakket> < <fix-versie> (<waar het lek zit>)              |
| Ernst                           | <ernst>, CVSS <score> (onze OSV-scanner: <scanner-ernst>) |
| Advisory sinds                  | <datum>                                                   |
| Fix                             | <pakket> <versie>                                         |
| In development                  | <datum>                                                   |
| Live op productie en acceptatie | <datum>, release <x.y.z>                                  |
```

## Example

This mail went out for the sharp advisory in OBA on 2026-10-08, to
`development@greenberry.nl` and the project lead.

**Onderwerp:** OSV scan (PATCHED) - OBA - GHSA-wq5f-xc86-pv6w

| Wat                             | Details                                             |
| ------------------------------- | --------------------------------------------------- |
| Advisory                        | GHSA-wq5f-xc86-pv6w (CVE-2026-96889)                |
| Geraakt                         | sharp < 0.35.5 (librsvg, bij het verwerken van SVG) |
| Ernst                           | High, CVSS 8.9 (onze OSV-scanner: critical)         |
| Advisory sinds                  | 6 oktober 2026                                      |
| Fix                             | sharp 0.35.5                                        |
| In development                  | 7 oktober 2026                                      |
| Live op productie en acceptatie | 7 oktober 2026, release 1.5.1                       |
