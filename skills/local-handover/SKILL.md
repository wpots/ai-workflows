---
name: local-handover
description: Put a branch or merge request in front of the user to test locally — a direct link to every story it touches and a CMS page that already shows the change, served from the branch itself and never from the main checkout or the developer's database. Use when the user wants to test, check or click through an MR or branch locally ("zet klaar om te testen", "test !66 lokaal", "lokaal testen", "story link", "testpagina in Payload", "local handover"), and when create-pr, work-backlog, address-review-comments or upstream-to-unicore reach a diff that touches the UI.
metadata:
  owner: wieteke.pots
---

# Local Handover

The user tests the change, not their own checkout: serve the branch from its
own worktree, open a direct link for every story it touches and a page that
already renders it, and keep the developer's database out of the branch's
reach.

The diff touches the UI when it changes components, stories, styles, pages or
routes (`## Structure` in `CONVENTIONS.md` says where those live). Otherwise
there is no handover, and the caller's recap names `Local handover` on its ➖
line.

## 1. Check out the branch

- **From a caller** (`create-pr` step 7, `work-backlog` step 9,
  `address-review-comments` before step 9, `upstream-to-unicore` step 5): use
  the checkout that holds the branch.
- **Standalone**, for an MR: read its source branch
  (`glab mr view <iid> -R <repo> -F json`), fetch it, and add a detached
  worktree at `~/.worktrees/<repo>-handover-<slug>` on `<remote>/<branch>`. A
  handover never commits.
- Dependencies and gitignored files (env files, generated types): follow
  "Dependencies and gitignored artifacts" in create-pr's
  `references/worktrees.md`. The dev server bundles with Turbopack, which
  rejects a symlinked `node_modules`.
- A server the user already runs from the main checkout shows the old code:
  never reuse it, restart it or switch that checkout's branch.

## 2. Give the CMS a database of its own

| Where the CMS data lives | Do |
| --- | --- |
| A local database (Payload on a local Postgres) | copy it into `<db>_handover_<slug>` on the same server and point only the worktree at the copy |
| A hosted CMS (DatoCMS, Prepr) | it is the team's: create nothing, name the page and the block for the user to add |
| No database with content (a project the template just generated) | skip the page; hand over the stories and what to add |

The copy, for Postgres in the project's Docker service:

```bash
docker compose -f <compose file> exec -T <service> createdb -U <user> <db>_handover_<slug>
docker compose -f <compose file> exec -T <service> sh -c 'pg_dump -U <user> -Fc <db> | pg_restore -U <user> --no-owner -d <db>_handover_<slug>'
```

`CREATE DATABASE … TEMPLATE <db>` is no shortcut: no other session may be
connected to a template while it is copied (PostgreSQL's `CREATE DATABASE`
docs), and the developer's own server usually is.

Then set the database URL in the **worktree's** copied env file (for Payload
`PAYLOAD_DB_URL`) to the same URL with the copy's database name. The main
checkout's env file is never edited.

- With `push: true` the worktree's dev server pushes the branch's schema into
  the copy, which is the point. When its output stops at a question about data
  loss (the branch drops a field), the background process cannot answer: say
  so, and give the user the dev command to answer it in a terminal in the
  worktree.
- When the schema comes from migrations and the branch adds one, the copy
  needs it, and an agent never runs a migrate script (`rules/payload.md`):
  give the user the migrate command for the worktree and wait for it.

## 3. Serve the branch

Start the Storybook script (when the project has one) and the dev script from
the worktree, each as a background process. A taken port moves a server to the
next free one, so read each URL from the server's output. A subagent's or
headless run cannot keep servers alive: it lists the URLs and the commands
that start them instead.

## 4. Make the links yourself

The user gets finished links. Looking up a story id and building the page is
this skill's work, not a step to hand over.

- **Stories:** every story file the diff adds or changes, plus the story in
  the folder of each component it changes. Fetch the running Storybook's
  `/index.json` yourself (`curl -s <storybook>/index.json`), take the ids of
  the entries whose `importPath` is that file, and make each
  `<storybook>/?path=/story/<id>`.
- **A page:** with the copy from step 2, build it in the worktree's admin
  through the browser you drive (step 5): a page titled `Test <branch>`, the
  new or changed block in it with its required fields filled, published. The
  copy holds the developer's users: when the admin asks for a login, the user
  logs in in that window, and you carry on. The link is the page's public URL
  on the worktree's server.
- Without browser control the page cannot be built for the user: hand over
  the admin URL, the page title and the block to add, and say why.

## 5. Open them and hand over

Open every link in a browser the user sees: the session's built-in browser, or
the `chrome-devtools` MCP, which drives a visible Chrome window. A headless
browser does not count. When neither is available (the sandbox blocks
`open <url>`), hand over the links instead. Leave the tabs and the servers
running.

Hand over in this shape, then wait until the user is done:

| | Step | Detail |
| --- | --- | --- |
| ⏳ | Open items | check the links below · screenshots in the MR, yes or no? · say when you are done, then I clean up |
| ✅ | Stories | `http://localhost:6007/?path=/story/modules-childpagelist--default` · `http://localhost:6007/?path=/story/modules-childpagelist--empty` |
| ✅ | Page | `http://localhost:3001/nl/test-feat-child-page-list`, built and published with a `childPageList` block |
| ✅ | Database | copy `postgres_handover_child-page-list` of `postgres`; the branch's schema is pushed there only |

Every link in full, so each one opens with a click; the `Page` row says what
was built on it.

## 6. Screenshots, only after a yes

A caller with an approval ask (create-pr step 7) asks it there; otherwise the
`Open items` row asks it. Never add them unasked.

1. Take one per story and per page state the change touches, in the handover
   tabs, with an explicit file path in the session's scratchpad or the system
   temp directory — never in the repository.
2. GitLab: upload each with
   `glab api --method POST projects/<encoded-path>/uploads --form "file=@<path>"`.
   The response carries the image's `markdown`. Put those lines in the
   template's verification section, PUT the description from a file
   (create-pr's `references/push-and-mr-mechanics.md`) and read it back.
3. GitHub has no API for PR attachments: say so, and give the user the file
   paths to drag into the PR.

## 7. Clean up once the user is done

Stop the servers by the PIDs this run started (never a pattern kill), drop the
copy (`dropdb` on the `<db>_handover_<slug>` this run created, nothing else),
delete the copied env files, and remove the worktree ("Cleanup" in create-pr's
`references/worktrees.md`). A worktree a caller made stays that caller's to
remove.
