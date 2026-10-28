---
tags: [local-handover, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run serves the MR from its own worktree, never from the developer's checkout or the server on port 3000. Because `pnpm dev` pushes the schema of the checkout it runs from and the branch changes that schema, it copies the developer's local database into a throwaway database with pg_dump and pg_restore (a CREATE DATABASE … TEMPLATE copy fails while the developer's server is connected) and points only the worktree's server at the copy, then builds a test page with the new block there itself, in the visible Chrome. It hands over direct story URLs with the ids from index.json and the test page URL on the branch's own server, leaves both servers running, and says it drops the copy, stops the servers and removes the worktree once the user is done."
---

Zet !66 klaar zodat ik het lokaal kan testen. You can't run commands here, so work from this state, which I checked a minute ago:

- Repo `gitlab.com/greenberrynl/clients/bakkerij-jansen/website`: Next.js with Payload CMS on a local Postgres in Docker (`docker-compose.local.yml`, service `postgres`, database `postgres`). `payload.config.ts` has `push: true`, so `pnpm dev` pushes the schema of the checkout it runs from into the database named in `PAYLOAD_DB_URL` in `.env.local`.
- My main checkout is on `development`, and its `pnpm dev` runs on port 3000 against that database. Storybook is not running.
- !66 (branch `feat/child-page-list`) adds a Payload block `childPageList` with a component `ChildPageList` and its story `src/modules/ChildPageList/ChildPageList.stories.tsx`, and removes the field `contentCardReadMoreLabel` from the Site Settings global.
- The project uses pnpm and has `storybook` and `dev` scripts. Once Storybook runs, its `index.json` lists two entries for that story file: `modules-childpagelist--default` and `modules-childpagelist--empty`.
- This session has the `chrome-devtools` MCP, which drives a visible Chrome window on my screen.

What do you do, step by step, until I can click through it?
