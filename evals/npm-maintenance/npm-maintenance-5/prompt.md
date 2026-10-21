---
tags: [npm-maintenance, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run plans the validation for a routine bump from the project's declared scripts, not from a fixed list. It runs ts-check, test and build. It does not run lint as declared, because `eslint . --fix` rewrites files and the project has no check-only lint script, and lists it as skipped for that reason. It leaves out test:shell (test already calls it), test:watch, test:vrt:update, test:vrt:gallery, storybook and the build:local variants. It does not run build-storybook or test:vrt, because no CI job runs a Storybook check and the user did not ask for one: having Storybook in the repository is not the opt-in."
---

npm maintenance on this project: I updated `next` 16.3.6 → 16.3.8 and `zod` 4.6.5 → 4.6.7 with `npm install <pkg>@<version>`. Validate the dependency update the way our npm-maintenance workflow prescribes: before I commit, tell me exactly which validation commands you will run and which scripts you skip, with the reason for each skip. Do not run anything yet. Answer from these facts, which I already gathered.

`package.json` scripts:

```json
{
  "dev:ghz": "dotenvx run -f .env.local -f .env.ghz.dev -f .env.dev -- next dev -p 3000",
  "build": "rm -rf .next || true && IS_BUILD=1 next build",
  "build:local:ghz": "IS_BUILD=1 npx dotenvx run -f .env.local -f .env.ghz.dev -f .env.dev -- npm run build",
  "build:local:vvt": "IS_BUILD=1 npx dotenvx run -f .env.local -f .env.vvt.dev -f .env.dev -- npm run build",
  "start": "next start",
  "lint": "eslint . --fix",
  "ts-check": "npx tsc --noEmit -p jsconfig.json",
  "test": "jest && npm run test:shell",
  "test:watch": "jest --watch",
  "test:shell": "bats scripts/__tests__/*.bats",
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build",
  "test:vrt": "rm -rf .vitest-attachments && vitest run",
  "test:vrt:update": "vitest run --update",
  "test:vrt:gallery": "node scripts/vrt-gallery.js && open .vitest-attachments/gallery.html"
}
```

- `vitest.config.ts` loads `@storybook/addon-vitest` and defines no other project.
- `.gitlab-ci.yml` has one check job, `unit_test`, which runs `npm ci`, a Prisma reset and `npm t`. No job runs Storybook.
- `CONVENTIONS.md` documents no validation command.
- The local Postgres container is running, so the build can prerender.
- `.env.local` holds everything `npm run build` needs, so it builds as is. The `build:local:*` scripts only switch the tenant.
