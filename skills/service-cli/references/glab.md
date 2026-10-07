# GitLab via `glab`

## Install and verify

```bash
brew install glab
glab auth login     # Personal Access Token, scopes api + write_repository
glab auth status
```

The MR mechanics (branch carving, `-R` plus `-H`, the body via `glab api`,
the reviewer rule for `ai-workflows`) live in
`skills/create-pr/references/push-and-mr-mechanics.md` and the "Shared
Workflow Assets Land via MR" section of `CLAUDE.md`. Two reminders that cost
the most time when forgotten:

- `-R <group/project>` on every command (and `-H` on `mr create`) when the
  current directory's remote is not the target; `glab` otherwise reads the
  cwd's remote.
- Inside the sandbox, SSH remotes fail with GitLab's "correct access rights"
  message. Use the https remote.

## Read

```bash
glab mr view 123 -R <group/project> --output json \
  | jq '{iid, title, state, draft, reviewers: [.reviewers[].username], pipeline: .head_pipeline.status, conflicts: .has_conflicts, web_url}'
glab mr list -R <group/project> --author=@me --output json | jq '.[] | {iid, title, state, web_url}'
glab mr list -R <group/project> --reviewer=@me --output json
glab ci status -R <group/project> --branch <branch>
glab api "projects/<group>%2F<project>/merge_requests/123/notes?per_page=100" \
  | jq '.[] | select(.system | not) | {id, author: .author.username, body, resolvable, resolved}'
glab api "projects/<group>%2F<project>/merge_requests/123/discussions"
glab api "projects/<group>%2F<project>/pipelines?ref=<branch>&per_page=1" | jq '.[0] | {id, status, web_url}'
glab release list -R <group/project>
```

`--output json` on `mr view` and `mr list`; `glab api` returns JSON by
default. URL-encode the project path (`%2F`) in `glab api` calls.

## Write

```bash
glab mr create -R <group/project> -H <group/project> -b main -t "<title>" -d "<one line>"
glab api "projects/<group>%2F<project>/merge_requests/123" --method PUT --field "description=@body.md"
glab mr update 123 -R <group/project> --reviewer <username>
glab api "projects/<group>%2F<project>/merge_requests/123/notes" --method POST --field "body=@comment.md"
glab mr merge 123 -R <group/project> --squash --remove-source-branch
```

## Connector-only remainder

None. No GitLab MCP server is shipped or needed (`docs/tooling.md`).
