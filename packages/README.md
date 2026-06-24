# Packages

`packages/` contains optional reusable presets for shared AI workflow setup.

Use packages when a project should opt into a Greenberry baseline or a specific
stack/concern bundle without forcing that choice on every synced project.

Each package should expose a small `package.yaml` manifest so package selection
can remain tool-agnostic and later be consumed by sync or bootstrap scripts.

Design rules:

- Keep packages composable and narrowly scoped.
- Put stable shared defaults in `greenberry-base/`.
- Put stack or concern-specific additions in separate packages.
- Keep project-specific deviations in `CONVENTIONS.md`.
- Avoid duplicating canonical workflow assets from `rules/`, `skills/`, and
  `commands/` unless a package needs a curated subset or overlay.

Selection model:

- Start with `greenberry-base/`.
- Add stack packages such as `frontend/`, `nextjs/`, and `payload/` as needed.
- Add concern packages such as `accessibility/` and `testing/` when the project
  wants stronger defaults in those areas.
- Resolve final project-specific differences in `CONVENTIONS.md`.

Example compositions:

- Marketing site: `greenberry-base` + `frontend` + `nextjs` + `accessibility`
- Content platform: `greenberry-base` + `frontend` + `nextjs` + `payload` + `testing`
- Service repo with no UI: `greenberry-base` only
