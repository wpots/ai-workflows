# Conventions — Demo Shop

## Project

- Webshop in Next.js (App Router), React 19, TypeScript strict, Tailwind 4.
- Tests met Vitest, naast de code (`*.test.ts`).
- Prijzen rekenen we in centen (`number`), en we tonen ze met `formatPrice`.

## Tracker

- Jira, project **DEMO** (board "DEMO board", sprints van twee weken).
- Elke branch, commit en BLI draagt de ticketsleutel: `DEMO-123`.
- BLI's staan in `docs/backlog/` als `DEMO-<n>-<type>-<slug>.md`.

## Branches

- `development` is de integratiebranch; `main` is productie.
- Werk gaat op `feature/DEMO-<n>-<slug>`, `fix/DEMO-<n>-<slug>` of
  `chore/DEMO-<n>-<slug>`, en via een MR naar `development`.
- Een release is een merge van `development` naar `main`.

## Architectuur

- `src/app/` — routes en route handlers
- `src/modules/<feature>/` — componenten, logica en tests per feature
- `src/lib/` — adapters naar externe diensten
- `src/utils/` — gedeelde pure functies
- `src/components/` — gedeelde UI

## Sprint-documenten

- `docs/sprint-<N>-planning.md`, `docs/sprint-<N>-changelog.md`,
  `docs/sprint-<N>-gaps.md`
- Afgeronde BLI's verhuizen bij de close naar `docs/sprint-<N>/`.
