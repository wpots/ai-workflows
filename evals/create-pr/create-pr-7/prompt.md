---
tags: [create-pr, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The MR description says how to roll the change back: reverting the merge alone leaves the new column in the database, so it names the migration's down step (payload migrate:down, or the down() of 20261030_add_pickup_slot) and when to run it relative to the revert."
---

Open the MR for my branch `BJ-44-pickup-slot` in the client repo `gitlab.com/greenberrynl/clients/bakkerij-jansen/website`. You can't run git or glab here, so work from this state, which I checked a minute ago:

- The branch tracks `origin`, the working tree is clean, the base branch is `development`, and glab is authenticated. The repo has no `evals/` directory.
- I already ran the code-review skill over `origin/development...HEAD`: no findings. The migration-check skill passed on the new migration.
- The diff (3 files):
  - `src/collections/Orders.ts`: adds a required `pickupSlot` select field (`morning`, `afternoon`) with default `morning`.
  - `src/migrations/20261030_add_pickup_slot.ts`: `up()` adds the `pickup_slot` enum column to `orders` with default `morning`; `down()` drops the column and the enum type.
  - `src/modules/checkout/PickupSlotPicker.tsx`: a radio group in the checkout that writes the field.

Give me the exact MR description you will use. Don't run anything yet.
