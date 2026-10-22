# Interview Rounds — Reference

The four rounds of lane 3b of `skills/start-project`. Ask each as one small
batch; skip anything lane 2 or the harvest already answered.

**Round 1 — Why and for whom** (feeds the brief)
Problem being solved · commissioning organization and decision makers ·
audiences and what each comes to do · what success looks like and how anyone
would know · hard constraints (legal, privacy, budget, deadline) · what this
product must never become.

**Round 2 — Scope** (feeds the brief and spec)
Which journeys exist and who walks them — **names plus one line each; lane 4
specs them** · what is in scope for this release · what is explicitly out ·
which audience wins when a tradeoff appears · the smallest credible release and
what it has to prove.

**Round 3 — Product rules** (feeds the spec)
Roles and what each may reach · core entities and their relationships ·
CMS-managed vs code-owned content · locales and what is translated ·
accessibility target · personal data handled and the rule that follows ·
integrations and who owns their credentials · environments · release constraints
("no X in this phase").

**Round 4 — Architecture** (feeds the architecture doc)
System context: which processes serve which surfaces, and every external service
they talk to · the runtime paths — how a request reaches a surface, what is
cached cross-request and what may never be, what invalidates it, scheduled work
and what keeps it from running twice · intended layer mapping for this project's
actual folders, and whether anything enforces it · where the schema lives and how
it changes · every edge untrusted data enters, and what validates it · hosting,
database, media, email, preview, CI, observability, plus the runtime constraints
those imply · the cross-cutting choices (authentication, localization, headers,
consent, testing) · known deviations that exist in the code today and what
tracks them · and for each real choice: what was decided, when, why, and what
was rejected.
