---
name: greenberry-maintenance
description: Inventariseer de actuele Greenberry-onderhoudssetup over GitLab, gedeelde CI, het bestaande Notion-register en dependency-meldingen in Slack. Gebruik wanneer een portfolio-maintenance-report, herhaalde inventaris, CI-adoptie/dekkingscontrole of refinement van Greenberry-repo-processen wordt gevraagd. Vergelijk met het vorige rapport en onderscheid configuratie, uitvoering en productie. Read-only; implementeert of publiceert niets.
metadata:
  owner: wieteke.pots
---

# Greenberry maintenance

Maak één controleerbaar rapport in de huidige documentatierepo. Gebruik de bestaande scanner, updater en Notion-sync als bronnen. Start geen nieuwe scans om de inventaris compleet te laten lijken.

## Werkwijze

1. Lees projectinstructies en het recentste rapport onder `docs/maintenance/`. Neem de datum uit de gebruikerscontext en benoem het meetvenster. Lees [sources-and-evidence.md](references/sources-and-evidence.md); herontdek de actuele schema's en refs.
2. Verzamel zichtbare GitLab-projecten en CI-adoptie met:
   ```sh
   python3 <skill-dir>/scripts/collect_gitlab.py --date YYYY-MM-DD --output docs/maintenance
   ```
   Gebruik bestaande glab-authenticatie en normale sandbox-netwerktoegang. Het script doet uitsluitend GET-requests, pagineert en leest bestanden op vaste default-branch-SHA's. Het weigert bestaande JSON-snapshots te overschrijven; gebruik een andere outputmap voor een tweede meting op dezelfde dag.
3. Controleer de grenzen: alleen zichtbare projecten, root manifest-ranges en statische CI-includes. Lees `errors`, `ci_unresolved` en `ci_resolution`. Dit is geen YAML-parser of GitLab merged-config-evaluator. Een include bewijst niet dat iedere job wordt gebruikt. Een SHA-pin moet apart via de commit-API worden bevestigd. Inline syntax, alternatieve CI-configpaden en externe/dynamische includes vragen vervolgonderzoek.
4. Verdiep waar het rapport dat vereist:
   - CI: actuele branches/tags/SHA, install/cache/lint/audit/deploy/Lighthouse-code, ontbrekende refs en lokale adopter-overrides.
   - Scanner/updater: broncode op vaste SHA, huidige projectlijsten, paginated schedules met owner/tijdzone/last_pipeline, laatste bestaande succesvolle artifact met job/pipeline/SHA. Neem recenter mislukte/geannuleerde runs ook op. Een groene updaterjob kan bewust niets doen.
   - Vergelijk huidige scannerconfiguratie met het laatste succesvolle artifact, per project en branch. Alleen aantallen volstaan niet.
   - Notion: fetch register/schema, query alle rijen met paginatie, bewaar ids, status, hosting, bestaande Next/Node/Payload/etc.-velden en syncdatum. Join op GitLab-id en bepaal Live-dekking in configuratie én artifact.
   - Sync-repo: leesbranch, lockfileprofielen, pagination, foutpropagatie en geschreven velden. Roep de syncroute niet aan: een GET kan Notion wijzigen.
   - Slack: lees een begrensd venster van het publieke dependencykanaal; noteer afzender, tijdvak, permalink, pipelinebron en engine. Tel berichten per afzender; projectnamen binnen één portfolio-overzicht zijn geen losse meldingen. Markeer onvolledige paginatie.
5. Voor versie-/productieclaims: lees de passende productie-ref en lockfiles op dezelfde SHA. Manifest-range, lockversie, Notion-waarde en hostingruntime zijn verschillende soorten bewijs. Een scan op main bewijst geen uitgerolde productiecommit.
6. Vergelijk met de vorige inventaris met dezelfde definities. Match hernoemde projecten op id. Default-commitactiviteit is geen all-branch-activiteit. Meer gescande projecten maakt raw kwetsbaarheidstotalen onvergelijkbaar. Schrijf opgeloste of achterhaalde bevindingen expliciet af.
7. Schrijf `docs/maintenance/maintenance-YYYY-MM-DD.md`: meetgrenzen, kernstatus, verschillen, geprioriteerde bevindingen, bedoelde repo/eigenaar, bewijslinks en open refinementkeuzes. Bewaar JSON/CSV met scope/schema. Geen tokens, .env of ruwe traces in exports.
8. Maak lokale BLIs alleen als gevraagd; gebruik de backlog-skill en bestaande ticketankers. Scheid config/ci van scanner-, updater-, dashboard- en consumerwerk. Conceptkeuzes zijn geen startopdracht voor implementatie.
9. Controleer JSON, documentlinks en `git diff --check`; rapporteer concrete verificatiegrenzen.

## Grenzen

- Geen install/update/auditcommando's in doelrepo's; geen pipelines, deployhooks, branchmutaties, schedules, sync-GETs, externe tickets of Slack-posts starten.
- Geen secrets of ruwe jobtraces ophalen/printen. Ontbrekend bewijs blijft onbekend.
- Geen healthy/0 kwetsbaarheden bij ontbrekend manifest, kapotte JSON, scanfout, expired artifact of 403.
- Onderhoudseigenaar niet afleiden uit Developers, commitstilte of schedule-owner; benoem die rollen apart.
- OSV- en npm-totalen niet optellen. Deduplicatie vraagt project-id, branch/SHA, lockfile, packageversie en advisory-aliases.
- Geen volledige maintenance-sweep claimen op basis van metadata. Hosting, tokenverval, backups, runtimekwaliteit en scans blijven onbevestigd zonder afzonderlijk bewijs.
