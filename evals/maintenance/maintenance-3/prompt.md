---
tags: [maintenance, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run applies the maintenance sweep's lane E check for declared checks that CI never runs. It lists test as run by the unit_test job (npm t). It lists lint, ts-check and build as not in CI, and rates build high because Exonet builds the site on deploy, so the host's build is the first build; lint and ts-check are medium. It says once that the config/ci include is not resolved. It reports the deploy jobs as calling a shell script that was not read. It says nothing about Storybook: no finding for build-storybook or test:vrt, and no advice to add Storybook to CI. It proposes a CI job as the project follow-up and does not edit .gitlab-ci.yml itself."
---

Monthly maintenance sweep, lane E (repo and CI hygiene), only the part about declared checks that CI never runs. Report only — do not change anything. Answer from these facts, which I already gathered.

`package.json` scripts:

```json
{
  "dev:ghz": "dotenvx run -f .env.local -f .env.ghz.dev -f .env.dev -- next dev -p 3000",
  "build": "rm -rf .next || true && IS_BUILD=1 next build",
  "build:local:ghz": "IS_BUILD=1 npx dotenvx run -f .env.local -f .env.ghz.dev -f .env.dev -- npm run build",
  "start": "next start",
  "lint": "eslint . --fix",
  "ts-check": "npx tsc --noEmit -p jsconfig.json",
  "test": "jest && npm run test:shell",
  "test:watch": "jest --watch",
  "test:shell": "bats scripts/__tests__/*.bats",
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build",
  "test:vrt": "rm -rf .vitest-attachments && vitest run",
  "test:vrt:update": "vitest run --update"
}
```

`vitest.config.ts` loads `@storybook/addon-vitest` and defines no other project.

`node <ai-workflows>/skills/run-checks/scripts/ci-parity.mjs .` printed (trimmed to the relevant jobs):

```json
{
  "parity": "approximate",
  "parityLine": "CI parity: approximate (config/ci version/2.0.0)",
  "projectJobs": [
    { "name": "unit_test", "script": ["npm ci", "npx prisma migrate reset --force", "npx prisma migrate dev", "npx prisma generate", "npm t"] },
    { "name": "deploy_dev", "script": ["chmod +x scripts/trigger-deploy.sh", "./scripts/trigger-deploy.sh \"$EXONET_BUILD_TRIGGER_DEV\" \"$EXONET_DRONE_TOKEN\""] },
    { "name": "deploy_prod", "script": ["chmod +x scripts/trigger-deploy.sh", "./scripts/trigger-deploy.sh \"$EXONET_BUILD_TRIGGER\" \"$EXONET_DRONE_TOKEN\""] }
  ]
}
```

Hosting: Exonet builds the site itself on every deploy, triggered by the deploy jobs. The include is `greenberrynl/config/ci` at `version/2.0.0`, file `/projects/templates/deploy-exonet.yml`.

Give me the lane E lines for the declared checks and the findings, with severity and the proposed fix.
