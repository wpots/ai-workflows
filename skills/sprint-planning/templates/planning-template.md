# Sprint <N> Planning

Planning voor **<sprint naam/id>** (<tracker-status + datums>), opgesteld op
<datum>. Gepland in detail voor <assignee>; de rest van de sprint is meegenomen
voor het dependency-beeld. <Tracker> is read-only geraadpleegd.

**Ankers**

- **Velocity Sprint <N-1>:** <SP> opgeleverd (<toelichting: items, unsized>).
- **Capaciteit:** <werkdagen> resterende werkdagen (<werkpatroon>).
- <Spillover-bron: gaps-doc of herleid uit changelog + tracker-statussen>.

## TL;DR — eerst beslissen

1. <gating item 1: over-commit / externe blocker / unplanned spillover>
2. <gating item 2>
3. <ongeschatte tickets: N stuks → verwijzing naar refinement-doc>

## Planned tickets

> Alleen **geschatte** tickets krijgen een rij. Ongeschatte tickets staan
> hieronder als verwijzing, niet als rij.

### Carry-in uit Sprint <N-1> (spillover)

| Ticket | Titel | SP | Tracker-status | Code state | Rest |
| ------ | ----- | -- | -------------- | ---------- | ---- |
| <KEY>  | <...> | <> | <status>       | <state>    | <0/1> |

Restpunten carry-in: **<som>** (<welke tickets>).

### Nieuw werk deze sprint

| Ticket | Titel | SP | Code state | Rest | BLI |
| ------ | ----- | -- | ---------- | ---- | --- |
| <KEY>  | <...> | <> | <state>    | <>   | <✓/nieuw> |

Rest nieuw werk: **<som> SP**.

**Ongeschat → refinement:** de <N> ongeschatte sprint-tickets (<KEY, KEY, …>)
staan met SP-voorstel in `docs/sprint-<N>-refinement.md` — geen rij hierboven
tot ze in refinement een schatting krijgen.

## Dependency map

**Intern (volgorde-bepalend)**

- <A> → <B>: <reden>

**Extern (risico's, niet inplanbaar)**

- <externe blocker>: <wie/wat, status>

**Ik blokkeer anderen:** <ja/nee, welke>

## Realisme

- **Planned load:** <SP nieuw> + <restpunten> = **±<totaal> SP**, exclusief de
  ongeschatte tickets (die staan in het refinement-doc en tellen als 0) en
  eventuele acceptatie-rework. Load is dus een **ondergrens**.
- **Velocity-anker:** <verdict tegen velocity>.
- **Capaciteits-anker:** <verdict tegen dagen, ×1,5-buffer>.
- **Verdict:** <on-track / over-commit / under-commit + rationale>.

## Voorgestelde volgorde

1. **<KEY>** — <rationale (dependency / surface / risico)>.
2. **<KEY>** — <rationale>.

## Doc-acties

**Aangemaakt (<N> BLIs):** <lijst + migratie-verwachting per stuk>.

**Gemarkeerd "Planned for Sprint <N>":** <lijst>.

**Flags (doc ↔ tracker, beslissing nodig):** <mismatches, unsized, externe
blockers, unplanned spillover>.

## Lokale ankers

- <feature>: <BLI / spec / code-pad / branch>
