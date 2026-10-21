---
tags: [run-checks, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "A CI v4 project gets exactly the checks its verify job runs: npm run lint:check, then npm run test, and nothing from the convention list, with the line CI parity: exact (ci-components 4.0.0-rc.1)."
---

Run the checks on my branch before I push. Don't run anything yet: first tell me, one per line, the exact commands you will run in order, and the CI parity line your summary will carry.

The project uses npm (`package-lock.json`). Its `package.json` scripts are `lint`, `lint:check`, `type-check`, `stylelint`, `test` and `build`. Its whole `.gitlab-ci.yml`:

```yaml
include:
  - component: $CI_SERVER_FQDN/greenberrynl/config/ci-components/workflow@4.0.0-rc.1
  - component: $CI_SERVER_FQDN/greenberrynl/config/ci-components/node-npm@4.0.0-rc.1
    inputs:
      node_version: "24.15.0"
      scripts: [lint:check, test]
```
