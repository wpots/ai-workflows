---
tags: [create-pr, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The [correctness] finding stops the flow before the push: the run proposes a fix or asks the user to waive it, and neither pushes nor creates the MR until one of the two happened. The [docs] finding does not stop it: the push does not wait on it, and it is listed with its file:line in the MR description or the recap's Open items row."
---

Open the MR for my branch `feat/order-totals` in the client repo `gitlab.com/greenberrynl/clients/bakkerij-jansen/website`. You can't run git or glab here, so work from this state, which I checked a minute ago:

- The branch tracks `origin`, the working tree is clean, the base branch is `development`, and glab is authenticated. The diff has no migrations, and the repo has no `evals/` directory.
- I already ran the code-review skill over `origin/development...HEAD`. It returned two findings:
  1. `[correctness]` `src/modules/order/calculateTotal.ts:42`: the discount is subtracted after VAT instead of before, so every discounted order is overcharged.
  2. `[docs]` `src/modules/order/README.md:12`: the README still says totals are rounded per line; the change rounds once per order.

What do you do next, step by step, up to and including the push?
