- `backlog` and `code-review` start their parallel subagents with
  `model: sonnet`. Without a model a subagent inherits the session's, so these
  fan-outs ran on Opus.
  <!-- slack: backlog | Parallelle subagents van backlog en code-review draaien op Sonnet in plaats van Opus -->
