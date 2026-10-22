- `skills/start-project` lane 1b, first run: after the config lane it runs the
  project the way a developer starts it on day one — prerequisites (Docker,
  gitleaks, 1Password CLI, a free database port), install from the lockfile,
  tests without CMS env, `db:up` after a go, migrations, build and the hook
  commands — and routes each failure to a template fix through
  `upstream-to-unicore` or a backlog item, instead of fixing it in the kickoff.
- `skills/start-project` check 2b, template delta: lists the template MRs
  merged or open since `template.commit`, decides per MR whether the project
  has it, needs a port or is not affected, and writes the ports to
  `docs/todo/unicore-template-ports.md`.
- `skills/start-project` keeps its SKILL.md under 500 lines: the first-run
  steps, the template delta, the prior-run detection, the interview questions
  and the draw.io details moved to `references/`.
- `rules/git-flow.md` names lane 0, check 3b, as the kickoff surface for the
  merge settings; it said lane 1.
