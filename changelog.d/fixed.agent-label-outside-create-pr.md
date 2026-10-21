- MRs opened outside `skills/create-pr` now carry the `ai:agent-authored`
  provenance label as well. The upstream MR rule names it for both routes,
  `glab mr create` and the `--input` JSON, and its read-back confirms the label
  and adds it when it is missing. The MR recipes in `upstream-rules`,
  `upstream-to-unicore` and `service-cli` set it too. Before this fix, 17 of 53
  MRs on `ai-workflows` went without the label, so `delivery-metrics` counted
  too little agent work.
- `scripts/validate-skills.mjs` now also checks `shared/`, fenced
  `glab mr create` snippets and `-X POST` MR creation, and `--input` payloads
  that never set the label.
