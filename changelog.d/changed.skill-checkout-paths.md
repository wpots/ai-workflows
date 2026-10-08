- `skills/improve-skill`, `skills/setup-ai-workflows` and `skills/create-pr` no
  longer send a developer to the maintainer's checkout path. They say
  `<ai-workflows>`: `improve-skill` defines it as your local clone of the repo
  (`~/Web/ai-workflows` by default, asking for the path when it is not there,
  never the plugin cache), and `setup-ai-workflows` reads the shared rules and
  templates from the installed plugin first and a local clone second.
  `scripts/validate-skills.mjs` now rejects `~/Web/ai-workflows` in a skill
  outside the five that document the default clone location.
