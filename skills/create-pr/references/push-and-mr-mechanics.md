# Push & MR Mechanics — Reference

Deep-dive pitfalls for `create-pr` step 7. Read this file when the generated
description is longer than a paragraph or `glab` is driven from outside the repo
directory. When the branch lives in a git worktree, read
[worktrees.md](worktrees.md) as well: setup, running the hooks by hand, and
cleanup.

## Long descriptions go via a file, not inline

A multi-paragraph body passed inline (`--body`/`--description`) is fragile:
shell quoting breaks easily, and very large single arguments can crash agent
permission flows mid-command. Write the generated body to a temp file first,
then:

- **GitHub**: `gh pr create … --body-file <file>`.
- **GitLab**: `glab mr create` has **no** body-file flag — no
  `--description-file`, no `--body-file`, no `-F`; only `-d/--description`,
  which takes a string. Do not reason by analogy from GitHub's `--body-file`:
  guessing the flag fails with `Unknown flag: --description-file` and costs a
  round trip. Create the MR in one API call with the body read from the file:

  ```bash
  glab api "projects/<url-encoded-project-path>/merge_requests" \
    --method POST \
    --field "source_branch=<branch>" --field "target_branch=<base>" \
    --field "title=<title>" --field "description=@<file>" \
    --field "labels=ai:agent-authored" --field "remove_source_branch=true"
  ```

  (`--field key=@file` reads the value from the file.) `labels` and
  `remove_source_branch` are plain fields here, unlike the reviewer below —
  carry them in this call, or the file-based route quietly ships an MR without
  the one provenance signal that survives a squash merge. Verify the response
  echoes a non-trivial description before reporting the URL.

### When the MR also needs an assignee or a reviewer

`--assignee` and `--reviewer` take a **username** on `glab mr create`; the API
POST above takes numeric ids, and `--field "assignee_ids[]=<id>"` sends the
bracket as a literal JSON key so the field is silently dropped. Split it in
two instead — no id lookup needed:

```bash
# 1. create with the username-only fields and a throwaway description
glab mr create --target-branch <base> --title "<title>" \
  --description "placeholder" --assignee <username> \
  --label "ai:agent-authored" --remove-source-branch --no-editor

# 2. PUT the real body from the file
glab api "projects/<url-encoded-project-path>/merge_requests/<iid>" \
  --method PUT --field "description=@<file>"
```

Pass `--no-editor`: without it `glab mr create` may open an interactive editor
and hang a non-interactive session. Then confirm with `glab mr view <iid>` that
both the description **and** the assignee/reviewer stuck.

## Driving the repo from another directory

When running e.g. from a worktree via `git -C`: `glab mr create` resolves its
repo context from the current directory's git remotes and fails even with
`--repo` when the cwd points at a different host's repo. The `glab api` call
above has no cwd dependency — prefer it. Related pitfall: when git uses glab
as its HTTPS credential helper, an expired glab OAuth token breaks
`git push`/`fetch` too (`could not read Username`) — `glab auth login` fixes
both.

## Carving one MR out of a dirty tree

The single-MR case of step 3's "create a fresh branch from the base and stage
only the files that belong to this PR": the change is ready, the tree also holds
unrelated edits, and the current branch is the wrong base.

1. Park your own files, not the tree:
   `git stash push -u -m "<what>" -- <paths>`, so unrelated WIP stays where it
   is. (A branch switch carries uncommitted changes along anyway — the stash is
   insurance against a switch that refuses, not a requirement.)
2. `git switch -c <branch> --no-track <remote>/<base>`, then `git stash pop`.
3. **Verify you moved**: `git branch --show-current`, before staging anything.
4. Stage by path (`git add <paths>`) — never `git add -A` or `git commit -a`.
   The unrelated edits are still in the tree and otherwise ride along into the
   MR.

**Why `--no-track`: `git checkout -b <new> <remote>/<base>` can create the
branch and leave you on the old one.** Where the shell is sandboxed, git cannot
write `.git/config`, so the tracking setup fails:

```text
error: could not lock config file .git/config: Operation not permitted
error: unable to write upstream branch configuration
```

The command exits 1, the new branch exists at the right commit, and `HEAD` never
moved — so the next commit lands on the branch you were trying to leave.
`--no-track` writes no config and switches cleanly; `git push -u <remote> HEAD`
sets the upstream later regardless. And never pipe a branch-creating command
through `head`/`tail` in an `&&` chain: the pipe swallows the error line and the
exit status both, so the chain marches on as if it had worked.

## Splitting one working tree into several MRs

When a session produced more change than belongs in one MR, the user may ask
for it split. Two things make this go wrong: losing work while shuffling
branches, and files whose hunks belong to different MRs.

**Ask first, because it changes every branch you create:**

- **Stacked** (each branch targets the previous) or **independent** (each
  targets the base)? Independent is nicer to review but conflicts on merge
  whenever two MRs touch the same file — say so, with the file names.
- What happens to commits already on the branch that aren't part of this work?
  Fold into a related MR, give them their own, or leave them.
- Which ticket key(s) the branches should carry, if the project uses them.

**Then:**

1. **Snapshot before touching anything.** `git checkout -b wip-snapshot` and
   commit the whole tree. Nothing can be lost, and it becomes the ref every
   branch pulls from. Keep it until the MRs land; never push it.
2. Per MR: `git switch -c <name> --no-track <remote>/<base>` (see the trap
   above), then `git checkout wip-snapshot -- <paths>` for the files that
   belong to it.
3. **A file whose hunks span two MRs**: take the whole file from the snapshot,
   then hand-revert the hunks belonging elsewhere. Prove the separation with a
   grep for the other MR's markers, e.g.
   `git diff <remote>/<base> -- <file> | grep -c "<other MR's symbol>"` → `0`.
4. **Verify per branch, not once at the end.** A branch may not build alone
   because it depends on a fix that lives in another MR. Cherry-pick that
   commit onto a throwaway `measure-*` branch, take the measurement there,
   delete the branch — and state in the MR which combination produced the
   number. Never quote a figure measured on a different combination; if a
   commit message already claims one, amend it.
5. **Integrity check before reporting.** Branch off the base, merge every new
   branch into it, and diff against the snapshot:

   ```bash
   git checkout -b verify-union <remote>/<base>
   for b in <branches>; do git merge --no-edit -q "$b"; done
   git diff verify-union wip-snapshot --stat   # empty == nothing lost
   ```

   Cosmetic-only residue (a moved declaration) is fine; report it rather than
   silently accepting a non-empty diff. Delete `verify-union` afterwards.

**When the lower MR of a stack merges** and deletes its branch, GitLab
retargets the next MR to the base and marks its pipeline stale ("You should run
a new pipeline, because the target branch has changed"; Merge then asks "Merge
unverified changes?"). Rebase that branch onto `<remote>/<base>`, run the full
checks again, and push with `--force-with-lease`; the push starts the fresh
pipeline. Run the checks even when the rebase reports no conflict: a branch that
mirrors something another merged MR changed — a path list, a fixture, a count —
conflicts in meaning, not in text. Seen in practice: a merged MR dropped two
templates from a digest list that the stacked branch's test compares against.
Name this step in the upper MR's "Open items" when you open a stack.
