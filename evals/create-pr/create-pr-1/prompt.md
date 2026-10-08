---
tags: [create-pr, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "After the label, heading and reviewer read-back, the run waits for the pipeline's setup stage in a bounded poll, sees the failed `install` job, and reads its log. The recap's Checks row reports the MR pipeline as failed, naming the job and quoting the E401 lines, rather than 'pipeline running' or a tick. Local checks passing does not stop it from reporting the failure."
---

Open the MR for this branch. (Context the agent can discover: local lint, type-check, tests and build all pass; the branch changes `package-lock.json`; the CI install job needs a registry token stored as a protected variable, which feature-branch pipelines do not receive; two minutes after the MR is created its pipeline fails in `install` with `npm error code E401`.)
