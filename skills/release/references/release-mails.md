# Release mails

Two mails per release, in one thread: one when the release starts, one when it
is live. The customer reads them, so they are short, in the customer's
language, and free of internal identifiers. The templates below are modelled
on a release mail a client team received well. When the project has an
earlier release mail, follow its subject form and tone over these templates.

Both are drafts. The user sends them, and adds their signature: the Gmail
connector does not insert it. When the connector cannot write ("Insufficient
scope"), the text goes in the reply instead, in the same form.

## Start mail

**Subject:** `Release V<x.y.z>` — or, for an unversioned project,
`Release <dd-mm-yyyy>`.

**Building blocks**, in this order:

1. Greeting that fits the time of day: `Goedemorgen,` / `Goedemiddag,`.
2. What starts and what is in it: the sprint, the support month, or the
   version.
3. The time indication. Two hours by default: the margin covers the build,
   the migrations and the checks, so the customer never waits past it. Or what
   the runbook's own duration says. Promise an update once everything is
   checked.
4. Optional: one line about a fix the customer is waiting for, when one is
   in the release.
5. Whether editors can keep working in the CMS. No migration in scope: they
   can. A migration in scope: what the runbook or the user says, for example
   "please do not publish between 10:00 and 10:30".
6. `met vriendelijke groet,`

```text
Goedemorgen,

We zijn gestart met de release van de website naar productie, met daarin
het werk van sprint 15. We verwachten binnen twee uur klaar te zijn en
sturen een update zodra alles gecontroleerd is.

Deze release lost ook het probleem met <zichtbaar probleem> op. Zodra de
release live staat, werkt <onderdeel> weer.

De redactie kan tijdens de release gewoon doorwerken in <CMS>.

met vriendelijke groet,
```

## Acceptance deploy mail

One internal mail, to the team, when the deploy to acceptance starts. There is
no live follow-up mail: acceptance is not the customer's release, and the
start mail above waits until the promotion starts. Same time indication, same
promise of an update.

```text
Goedemorgen,

We zijn gestart met de deploy van versie 1.5.0 naar de acceptatieomgeving.
We verwachten binnen twee uur klaar te zijn en sturen een update zodra alles
gecontroleerd is.

met vriendelijke groet,
```

## Live mail

A reply in the start mail's thread, so the subject becomes `Re: Release
V<x.y.z>`.

**Building blocks:**

1. Greeting.
2. Since when it is live, where, and which version. Say the key pages were
   checked only when the run actually checked them.
3. The overview: one bullet per item from the release notes' body —
   Nieuw, Verbeterd and Opgelost — in the notes' customer language. The
   Onderhoud items come last, behind one lead-in line that says what the notes'
   fixed Onderhoud line says. No ticket keys, no MR numbers, no section
   headings in the mail. A release of more than about twelve items gets
   themed bullets (eight to ten) instead of one per item: say so when handing
   over the draft.
4. `Let op:` lines for anything the customer must do or avoid, from the
   notes' "Goed om te weten".
5. `met vriendelijke groet,`

```text
Goedemorgen,

De release staat sinds 10:12 live op <domein> (versie 1.5.0) en we hebben
de belangrijkste pagina's gecontroleerd. Hieronder een korte samenvatting.

- Zoeksuggesties verschijnen zodra je even stopt met typen, niet meer bij
  elke letter.
- Links binnen de site verloren soms de gekozen taal.

Daarnaast hebben we onderhoud uitgevoerd, geen aangevraagde wijziging of bug:

- De website en haar koppelingen zijn extra beveiligd en draaien op de
  nieuwste veilige versie van het onderliggende framework.

Let op: <wat de klant nog wel of niet moet doen>.

met vriendelijke groet,
```

Send it with `htmlBody` (a `<ul>` for the overview and a second one for the
Onderhoud bullets) and the plain text above as `body`.

## Delay or rollback mail

Replaces the live mail when Step 5 fails. Also a reply in the thread.

```text
Goedemiddag,

De release loopt vertraging op: <wat er misging, in klanttaal>. De website
draait ongewijzigd op de vorige versie. We laten <tijdstip of "later
vandaag"> weten wanneer we het opnieuw proberen.

met vriendelijke groet,
```

After a rollback, say the site is back on the previous version and what
happens next. Never name the technical cause in more detail than the
customer needs.

## English

For an English-speaking customer, keep the same building blocks: "We have
started the release of the website to production, containing the work of
sprint 15. We expect to be done within two hours and will send an update once
everything is checked." and "The release has been live on <domain>
since 10:12 (version 1.5.0), and we have checked the key pages. A short
summary follows." The Onderhoud lead-in reads "We also carried out maintenance,
not a requested change or a bug:".
