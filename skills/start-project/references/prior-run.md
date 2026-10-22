# Prior Kickoff Run — Reference

How lane 3a of `skills/start-project` checks whether this kickoff already ran.
Do it also on what looks like a bare clone, because the evidence lives outside
the working tree:

```
git worktree list   # a prior session may have worked in another worktree
git stash list      # a prior session may have stashed the scope document
```

Harness-created worktrees land in `.claude/worktrees/<name>`, hand-made ones in
`~/.worktrees/<repo>-<slug>` (`skills/create-pr/references/worktrees.md`); `git worktree list`
shows both. Read what they hold before interviewing:

- per worktree: `git -C <path> status --porcelain`, then `ls <path>/docs`
- per stash: `git stash show --name-only "stash@{n}"` **and**
  `git show --stat "stash@{n}^3"` — the `^3` parent holds the files stashed
  with `-u`, which is where an untracked document hides

None of this shows up in `git status`, `ls`, or a `docs/` glob. Missing it is the
most expensive failure in the skill: a second kickoff that rebuilt the documents
from less evidence chose a different library than the first run had (with a
reason), filed duplicate `docs/todo/` entries under new names, and never saw the
requirements document, which existed only in a stash.
