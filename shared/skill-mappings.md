Skills are the canonical surface. A command is listed only where one exists as
fallback for tools that cannot use skills. Alphabetical, so a missing entry is
easy to spot.

Line format: triggers `->` the routing targets, then an optional note after a
`;`. Only paths before the `;` count as routes — a skill named in a note is a
cross-reference, so it still needs its own line.

- `address review comments`, `pick up review comments`, `apply review feedback`, `pak review comments op` -> `skills/address-review-comments` (skill only; evaluate the feedback with `skills/receiving-code-review` first)
- `review architecture`, `check clean arch`, `architecture audit`, `layer violation` -> `skills/architecture-review` (skill only)
- `backlog item`, `user story`, `feature spec`, `bug item`, `bli` -> `skills/backlog` (canonical), `commands/backlog.md` (fallback); for a tracker ticket use `skills/jira-ticket`
- `close sprint`, `sluit sprint af`, `sprint afsluiten` -> `skills/close-sprint` (canonical), `commands/close-sprint.md` (fallback)
- `review code`, `code review`, `review changes` -> `skills/code-review` (canonical), `commands/review-code.md` (fallback)
- `commit message`, `write commit`, `git commit` -> `skills/commit-message` (canonical), `commands/commit-message.md` (fallback)
- `component spec`, `spec component`, `write spec`, `document component api` -> `skills/component-spec` (skill only)
- `create pr`, `open pr`, `submit pr` -> `skills/create-pr` (canonical), `commands/create-pr.md` (fallback)
- `improve skill`, `take learnings`, `verbeter je skill` -> `skills/improve-skill` (skill only)
- `init project`, `setup project`, `apply ai-workflows`, `initialize project` -> `skills/init-project` (canonical), `commands/init-project.md` (fallback)
- `jira ticket`, `maak een jira ticket`, `file a bug`, `meld een bug`, `create a story`, `create a task` -> `skills/jira-ticket` (skill only; writes to the tracker, so it confirms before creating)
- `maintenance`, `project maintenance`, `onderhoud`, `maintenance sweep`, `monthly check`, `health check`, `api key check` -> `skills/maintenance` (skill only; delegates the dependency lane to `skills/npm-maintenance`)
- `migration check`, `check migration`, `verify migration`, `migration already exists` -> `skills/migration-check` (skill only)
- `mr merged`, `post-merge`, `afgerond na merge`, `close out merged MR` -> `skills/mr-merged` (skill only; also the hand-off target when `skills/watch-mrs` reports a merge)
- `npm maintenance`, `update dependencies`, `npm audit`, `fix vulnerabilities`, `npm outdated` -> `skills/npm-maintenance` (skill only)
- `review feedback`, `respond to review`, `reviewer comments`, `beoordeel review`, `reageer op review` -> `skills/receiving-code-review` (skill only; hand off to `skills/address-review-comments` to apply)
- `refinement`, `prepare refinement`, `refine tickets`, `refinement vastleggen` -> `skills/refinement` (canonical), `commands/refinement.md` (fallback)
- `run checks`, `run-checks`, `quality checks` -> `skills/run-checks` (canonical), `commands/run-checks.md` (fallback)
- `new component`, `scaffold`, `create component` -> `skills/scaffold-component` (canonical), `commands/scaffold-component.md` (fallback)
- `skill opportunity`, `learn from sessions`, `spot workflow patterns`, `should this be a skill` -> `skills/skill-opportunity` (skill only)
- `sprint board`, `waar ben ik mee bezig`, `update board`, `werkbord` -> `skills/sprint-board` (skill only; every workflow that changes an item's status updates it)
- `sprint demo`, `demo voorbereiden`, `demo script`, `prepare demo` -> `skills/sprint-demo` (canonical), `commands/sprint-demo.md` (fallback)
- `sprint planning`, `plan sprint`, `sprint start`, `start sprint`, `plan komende sprint` -> `skills/sprint-planning` (canonical), `commands/sprint-planning.md` (fallback)
- `start project`, `new project`, `project kickoff`, `project brief`, `project spec`, `nieuw project`, `project opzetten` -> `skills/start-project` (skill only; writes the brief/spec/architecture, then hands over to `skills/init-project`)
- `sustainable review`, `sustainability review`, `performance audit`, `green refactor`, `ci review`, `dependency review` -> `skills/sustainable-review` (canonical), `commands/sustainable-review.md` (fallback)
- `tdd`, `test-driven development`, `test first`, `test eerst`, `schrijf eerst een test` -> `skills/test-driven-development` (skill only)
- `upstream rule`, `propose rule`, `share rule change` -> `skills/upstream-rules` (skill only)
- `upstream to unicore`, `port to unicore`, `upstream to template`, `unicore-template` -> `skills/upstream-to-unicore` (skill only)
- `watch mr`, `monitor mr`, `notify on approval`, `auto-merge when ready` -> `skills/watch-mrs` (skill only)
- `wcag audit`, `accessibility audit`, `wcag compliance audit`, `a11y audit` -> `skills/wcag-audit` (skill only)
- `work backlog`, `work the backlog`, `next backlog item`, `autonomous delivery` -> `skills/work-backlog` (canonical), `commands/work-backlog.md` (fallback)
