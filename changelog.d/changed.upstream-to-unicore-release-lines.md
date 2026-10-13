- `skills/upstream-to-unicore` targets the template's release lines instead of
  the archived `experimental-new-setup`: v4 (`feat/declarative-cms-presets`)
  or v3 (`development`), chosen per change with the user until the team
  decides how the lines relate, and CMS code goes to `src/vendor/<cms>/` on
  v4. It reads the target line's conventions (package
  manager, env wrapper, agent instructions) at run time instead of carrying a
  hardcoded dotenvx recipe, finds the project's base from `.unicore.json` (v4)
  or estimates it (v3), and adds a harvest mode that lists the template-owned
  changes a project made since that base. Every run starts with the open
  template MR queue and ends by offering `skills/watch-mrs`, because the
  finish line is a merged MR.
- `skills/mr-merged` and `skills/close-sprint` propose that harvest when a
  merged MR or a sprint touched template-owned files, so upstreaming no longer
  waits for someone to ask; `skills/start-project` checks a project's template
  lineage through `.unicore.json` rather than a merge-base the template's own
  hook makes impossible.
