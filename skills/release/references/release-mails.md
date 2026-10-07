# Release mails

Two mails per release, in one thread: one when the release starts, one when it
is live. The customer reads them, so they are short, in the customer's
language, and free of internal identifiers. The templates below are modelled
on a release mail a client team received well. When the project has an
earlier release mail, follow its subject form and tone over these templates.

Both are drafts. The user sends them, and adds their signature: the Gmail
connector does not insert it.

## Start mail

**Subject:** `Release V<x.y.z>` — or, for an unversioned project,
`Release <dd-mm-yyyy>`.

**Building blocks**, in this order:

1. Greeting that fits the time of day: `Goedemorgen,` / `Goedemiddag,`.
2. What starts and what is in it: the sprint, the support month, or the
   version.
3. The time indication. One hour by default, or what the runbook's own
   duration says. Promise the follow-up mail.
4. Optional: one line about a fix the customer is waiting for, when one is
   in the release.
5. Whether editors can keep working in the CMS. No migration in scope: they
   can. A migration in scope: what the runbook or the user says, for example
   "please do not publish between 10:00 and 10:30".
6. `met vriendelijke groet,`

```text
Goedemorgen,

We zijn gestart met de release van de website naar productie, met daarin
het werk van sprint 15. We verwachten binnen een uur klaar te zijn en
mailen zodra alles live staat en gecontroleerd is.

Deze release lost ook het probleem met <zichtbaar probleem> op. Zodra de
release live staat, werkt <onderdeel> weer.

De redactie kan tijdens de release gewoon doorwerken in <CMS>.

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
   Nieuw, Verbeterd and Opgelost — in the notes' customer language. No
   ticket keys, no MR numbers, no section headings in the mail.
4. `Let op:` lines for anything the customer must do or avoid, from the
   notes' "Goed om te weten".
5. `met vriendelijke groet,`

```text
Goedemorgen,

De release staat sinds 10:12 live op <domein> (versie 1.5.0) en we hebben
de belangrijkste pagina's gecontroleerd. Hieronder een korte samenvatting.

- Zoeksuggesties verschijnen zodra je even stopt met typen, niet meer bij
  elke letter.
- De website en haar koppelingen zijn extra beveiligd en draaien op de
  nieuwste veilige versie van het onderliggende framework.
- Links binnen de site verloren soms de gekozen taal.

Let op: <wat de klant nog wel of niet moet doen>.

met vriendelijke groet,
```

Send it with `htmlBody` (a `<ul>` for the overview) and the plain text above
as `body`.

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
sprint 15. We expect to be done within the hour and will mail once
everything is live and checked." and "The release has been live on <domain>
since 10:12 (version 1.5.0), and we have checked the key pages. A short
summary follows."
