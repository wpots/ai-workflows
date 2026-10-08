---
tags: [sprint-demo, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run checks whether the demo folder is ignored, finds only the rendered-file rules, and replaces them with a folder-wide `docs/demo/` rule in `.gitignore`, saying which lines changed. It names the committed sprint-15 demo files and proposes `git rm -r --cached docs/demo/`, which keeps them on disk. The deck, the runsheet and the screenshots stay out of git. The runsheet notes where the shared pptx lives. The run does not commit anything, and it ends by suggesting to run close-sprint for sprint 16 after the demo, which flattens the folder into `docs/sprint-16/demo.md`."
---

Write the demo files for sprint 16. (Context the agent can discover: `.gitignore` has `docs/demo/**/deck.html` and `docs/demo/**/*.pptx` lines from an earlier demo run and no `docs/demo/` line; `git ls-files docs/demo/` lists `docs/demo/sprint-15/deck.md` and `docs/demo/sprint-15/demo-script.md`; `docs/sprint-15-changelog.md` exists, `docs/sprint-16-changelog.md` does not.)
