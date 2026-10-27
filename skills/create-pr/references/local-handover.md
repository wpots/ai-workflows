# Local Handover — Reference

How `create-pr` puts a UI change in front of the user before the approval ask
(step 7), and how screenshots reach the MR description after a yes (step 7.5).
`work-backlog` runs the same handover in step 9.

The diff touches the UI when it changes components, stories, styles, pages or
routes (`## Structure` in `CONVENTIONS.md` says where those live). Otherwise
there is no handover and the recap's `Local handover` row is ➖.

## Serve the branch

- Start the Storybook script (when the project has one) and the dev script
  from the checkout that holds the branch, each as a background process. A
  worktree needs the gitignored files from "Dependencies and gitignored
  artifacts" in `worktrees.md` first.
- A server the user already runs from the main checkout shows the old code,
  so never reuse it. A taken port moves the new server to the next free one:
  read each URL from the server's output.
- A subagent's or headless run cannot keep servers alive after it ends. It
  lists the URLs and the commands that start them instead.

## Open what the user checks

Open the pages in a browser the user sees: the session's built-in browser or
the `chrome-devtools` MCP, which drives a visible Chrome window. A headless
browser does not count. When neither is available (the sandbox blocks
`open <url>`), hand over the URLs instead.

- **Every story the diff adds or changes**, on its own story URL
  (`/?path=/story/<id>`). The running Storybook's `/index.json` lists the ids
  per file: the entries whose `importPath` is that story file.
- **A page on the dev server that renders the component.** A new CMS block
  renders nowhere yet. When the CMS database is local (Payload on a local
  Postgres), add the block to a new test page named after the branch. A
  hosted CMS (DatoCMS, Prepr) is shared, so name the page and the block to add
  instead of creating content there.

Leave the tabs and the servers running, and list each URL plus how to stop the
servers. A worktree that serves them stays until the user is done checking;
then stop the servers and remove it (Cleanup in `worktrees.md`).

## Screenshots, only after a yes

The approval ask in step 7 also asks whether screenshots go into the
description. When the push needs no approval, ask it on the last line of the
recap instead. Never add them unasked.

1. Take one per story and per page state the change touches, in the handover
   tabs, with an explicit file path in the session's scratchpad or the system
   temp directory — never in the repository.
2. GitLab: upload each with
   `glab api --method POST projects/<encoded-path>/uploads --form "file=@<path>"`.
   The response carries the image's `markdown`. Put those lines in the
   template's verification section, PUT the description from a file
   (`push-and-mr-mechanics.md`) and read it back.
3. GitHub has no API for PR attachments: say so, and give the user the file
   paths to drag into the PR.
