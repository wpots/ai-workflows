# Bronnen en bewijsvorm

Bevestig deze bekende bronnen opnieuw bij elke run:

| Bouwsteen | Bron |
| --- | --- |
| Gedeelde CI | greenberrynl/config/ci, project 16582603 |
| OSV | greenberrynl/the-greenhouse/dependency-scanner, project 86854752 |
| Updater/legacy triggers | greenberrynl/config/dependencies-runner, project 78111637 |
| Notion-sync | greenberrynl/the-orchard/gb-dashboard, project 67231036 |
| Teamregister | https://app.notion.com/p/7b6d195bd2564e28aa6af3db468f5c43 |
| Notion datasource | collection://119e2b5f-7eab-4ad0-afa7-b21625326bf4 |
| Code metrics view | view://19d7078e-5514-8075-b034-000c5cf20b14 |
| Publiek Slackkanaal | #dependencies-scanner, C0ACFRNS1V0 |
| Weekly beleidscontext | https://app.notion.com/p/3e57078e5514807296fdfc922123c3d1 |

Gebruik connectoren als beschikbaar. Ontbreken ze, maak GitLab af en benoem de ontbrekende Notion/Slack-toegang. Gebruik niet de deprecated Applicaties-database. Live is een teamstatus, geen technische activiteitsklasse.

## Aanvullende GitLab GETs

URL-encode projectpaden, bestanden en refs. Toon geen authenticatiemateriaal.

- `projects/{id}/repository/branches/{branch}` → vaste SHA voor reads.
- `projects/{id}/repository/files/{encoded_path}?ref={sha}` → base64 bronbestand.
- `projects/{id}/pipeline_schedules?per_page=100&page=N` en details → owner, cron, tijdzone, laatste run.
- `projects/{id}/pipelines?per_page=100&page=N` → laatste succesvolle run en recenter falen, dezelfde branch/engine.
- `projects/{id}/pipelines/{id}/jobs?per_page=100&page=N` → jobstatus en artifact-retentie.
- `projects/{id}/jobs/{id}/artifacts/report.json` → bestaande OSV-uitkomst; 404 is ontbrekend bewijs, geen nul bevindingen.

Geen POST/PUT/DELETE of CI-variablewaarden. gb-dashboard GET /api/update schrijft in Notion en valt buiten deze workflow.

## Rapport en vergelijking

Noteer datum/scopes, wijzigingen sinds de vorige vergelijkbare meting, inrichting, geprioriteerde bevindingen, gedaan/voorgesteld/onbekend, refinementkeuzes en plan-/BLI-links. Per feit: meettijd, project-id, ref/SHA, bronlink en bewijssoort (broncode, run/artifact, register, kanaalsample). Laat oudere rapporten intact.

## Scriptdekking

collect_gitlab.py gebruikt Python stdlib en glab. Het inventariseert default branches; geen productie, alle branches, aangepaste CI-configpaden, nested manifests, lockversies, open MRs of schedules. De statische extractor ondersteunt expliciete project/ref- en local-keys. Gebruik bronbestanden of GitLab CI lint voor aanvullende verificatie; claim geen pipelinecorrectheid uit de extractor.

Een brede branch-/lockfile-inventaris is duurder: bepaal die scope expliciet. Een vorige brede snapshot blijft historische baseline als de nieuwe meting smaller is.
