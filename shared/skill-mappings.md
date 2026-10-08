Skills are the canonical surface. A command is listed only where one exists as
fallback for tools that cannot use skills. Alphabetical, so a missing entry is
easy to spot.

Line format: triggers `->` the routing targets, then an optional note after a
`;`. Only paths before the `;` count as routes — a skill named in a note is a
cross-reference, so it still needs its own line.

- `address review comments`, `pick up review comments`, `apply review feedback`, `pak review comments op` -> `skills/address-review-comments` (skill only; evaluate the feedback with `skills/receiving-code-review` first)
- `review architecture`, `check clean arch`, `architecture audit`, `layer violation` -> `skills/architecture-review` (skill only)
- `backlog item`, `user story`, `feature spec`, `bug item`, `bli` -> `skills/backlog` (canonical), `commands/backlog.md` (fallback); for a tracker ticket use `skills/jira-ticket`
- `close sprint`, `sluit sprint af`, `sprint afsluiten`, `close support month`, `support maand afsluiten` -> `skills/close-sprint` (canonical), `commands/close-sprint.md` (fallback); projects without sprints close a calendar month (support mode, `docs/support-<yyyy>-<mm>/`)
- `review code`, `code review`, `review changes` -> `skills/code-review` (canonical), `commands/review-code.md` (fallback)
- `compact sprint`, `compact old sprints`, `sprint compacten`, `oude sprints opruimen`, `prune sprint docs`, `compact support months` -> `skills/compact-sprint` (canonical), `commands/compact-sprint.md` (fallback); runs after `skills/close-sprint`, only on a sprint whose close is pushed (the last-closed one after the next planning; in support mode never the current or previous month)
- `datocms migration`, `cms migration`, `fork cms environment`, `change the cms schema` -> `skills/datocms-migration` (skill only; the DatoCMS counterpart to `skills/migration-check`, which covers Payload/Postgres)
- `dependency hotfix`, `critical hotfix`, `security hotfix`, `pak de critical op`, `scanner critical`, `critical uit de dependency scanner` -> `skills/dependency-hotfix` (skill only; criticals on production only — highs and lower go to `skills/npm-maintenance` on development)
- `commit message`, `write commit`, `git commit` -> `skills/commit-message` (canonical), `commands/commit-message.md` (fallback)
- `component spec`, `spec component`, `write spec`, `document component api` -> `skills/component-spec` (skill only)
- `create pr`, `open pr`, `submit pr` -> `skills/create-pr` (canonical), `commands/create-pr.md` (fallback)
- `greenberry maintenance`, `portfolio maintenance`, `portfolio-maintenance-report`, `greenberry onderhoud`, `herhaal onderhoudsinventaris`, `CI-adoptie en scannerdekking` -> `skills/greenberry-maintenance` (skill only; read-only portfolio inventory across GitLab, Notion and dependency reporting; project fixes stay in their own workflows)
- `improve skill`, `take learnings`, `verbeter je skill`, `skill opportunity`, `learn from sessions`, `spot workflow patterns`, `should this be a skill` -> `skills/improve-skill` (skill only; also decides whether a recurring pattern deserves a new skill, an update, or a lighter surface)
- `jira ticket`, `maak een jira ticket`, `file a bug`, `meld een bug`, `create a story`, `create a task` -> `skills/jira-ticket` (skill only; writes to the tracker, so it confirms before creating)
- `maintenance`, `project maintenance`, `onderhoud`, `maintenance sweep`, `monthly check`, `health check`, `api key check` -> `skills/maintenance` (skill only; delegates the dependency lane to `skills/npm-maintenance`)
- `migration check`, `check migration`, `verify migration`, `migration already exists` -> `skills/migration-check` (skill only)
- `mr merged`, `post-merge`, `afgerond na merge`, `close out merged MR` -> `skills/mr-merged` (skill only; also the hand-off target when `skills/watch-mrs` reports a merge)
- `npm maintenance`, `update dependencies`, `npm audit`, `fix vulnerabilities`, `npm outdated` -> `skills/npm-maintenance` (skill only)
- `payload jobs`, `jobs queue`, `scheduled jobs`, `nightly job`, `cronjob`, `autoRun`, `job runner`, `jobs draaien dubbel`, `job draait niet`, `INSTANCE_NUMBER` -> `skills/payload-jobs` (skill only; the deep audit behind lane F of `skills/maintenance`; policy lives in `rules/payload.md` § Jobs Queue)
- `review feedback`, `respond to review`, `reviewer comments`, `beoordeel review`, `reageer op review` -> `skills/receiving-code-review` (skill only; hand off to `skills/address-review-comments` to apply)
- `refinement`, `prepare refinement`, `refine tickets`, `refinement vastleggen` -> `skills/refinement` (canonical), `commands/refinement.md` (fallback)
- `release`, `start release`, `release starten`, `naar productie`, `release afronden`, `promote to production`, `versie op de tickets`, `tickets van de release naar done` -> `skills/release` (skill only; runs around the project's own release runbook — start and live mail drafts, Slack, tracker version and Done, housekeeping; hands the notes to `skills/release-notes`)
- `release notes`, `releasenotes`, `release notes voor de klant`, `klantupdate`, `wat is er live` -> `skills/release-notes` (canonical), `commands/release-notes.md` (fallback); the customer-facing half of a release — `skills/close-sprint` writes the internal changelog, and both it and `skills/sprint-demo` hand off here after their review pause
- `run checks`, `run-checks`, `quality checks` -> `skills/run-checks` (canonical), `commands/run-checks.md` (fallback)
- `new component`, `scaffold`, `create component` -> `skills/scaffold-component` (canonical), `commands/scaffold-component.md` (fallback)
- `service cli`, `jira cli`, `glab`, `axiom query`, `via de cli`, `cli first` -> `skills/service-cli` (skill only; the recipes behind the CLI-first rule in `docs/tooling.md` — the tracker-reading skills and `skills/jira-ticket` route Jira through it, and the plugin's PreToolUse hook sends a denied connector call here)
- `apply ai-workflows`, `setup ai-workflows`, `generate conventions`, `refresh project config` -> `skills/setup-ai-workflows` (canonical), `commands/setup-ai-workflows.md` (fallback); the config lane only — a whole new project starts with `skills/start-project`
- `sprint demo`, `demo voorbereiden`, `demo script`, `prepare demo` -> `skills/sprint-demo` (canonical), `commands/sprint-demo.md` (fallback)
- `sprint planning`, `plan sprint`, `sprint start`, `start sprint`, `plan komende sprint` -> `skills/sprint-planning` (canonical), `commands/sprint-planning.md` (fallback)
- `start project`, `new project`, `init project`, `setup project`, `initialize project`, `project kickoff`, `project brief`, `project spec`, `nieuw project`, `project opzetten` -> `skills/start-project` (skill only; the single kickoff entry — it runs `skills/setup-ai-workflows`, writes brief/spec/architecture, and hands the journeys to `skills/user-journeys`)
- `sustainable review`, `sustainability review`, `performance audit`, `green refactor`, `ci review`, `dependency review` -> `skills/sustainable-review` (canonical), `commands/sustainable-review.md` (fallback)
- `tdd`, `test-driven development`, `test first`, `test eerst`, `schrijf eerst een test` -> `skills/test-driven-development` (skill only)
- `upstream rule`, `propose rule`, `share rule change` -> `skills/upstream-rules` (skill only)
- `upstream to unicore`, `port to unicore`, `upstream to template`, `unicore-template` -> `skills/upstream-to-unicore` (skill only)
- `user journeys`, `spec the journeys`, `user flows`, `customer journey`, `journeys uitwerken` -> `skills/user-journeys` (skill only; writes `docs/journeys/`, then hands the slice candidates to `skills/backlog`)
- `watch mr`, `monitor mr`, `notify on approval`, `auto-merge when ready` -> `skills/watch-mrs` (skill only)
- `wcag audit`, `accessibility audit`, `wcag compliance audit`, `a11y audit` -> `skills/wcag-audit` (skill only)
- `work backlog`, `work the backlog`, `next backlog item`, `autonomous delivery` -> `skills/work-backlog` (canonical), `commands/work-backlog.md` (fallback)
