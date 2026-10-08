---
tags: [backlog, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run checks each file the item touches against the convert-on-touch rule, notices that three .js files fall under it, and folds the conversion into the item's scope and size — measuring it by renaming the files, running the type checker and reverting, rather than guessing. Because the component sits in another queued item's path, it proposes moving that part out of this item rather than creating a rename-against-edit conflict, and says so in the recap."
---

Refine the autocomplete item: it changes the suggestions route, its test, and the search-bar component. (Repo context the agent can discover: CONVENTIONS.md requires every .js file a delivery changes to be converted to TypeScript in the same delivery; the route, its test and the component are .js; another item already queued edits and renames the component.)
