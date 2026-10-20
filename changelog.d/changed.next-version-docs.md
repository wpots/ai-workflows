- `rules/stacks/nextjs-payload.md` sends agents to the docs that ship with the
  installed Next.js (`node_modules/next/dist/docs/`, Next 16.4 and later) for
  an API they are not sure of, and asks projects to set `agentRules: false` in
  `next.config.ts`, so `next dev` started by an agent no longer writes its own
  `nextjs-agent-rules` block into the synced `AGENTS.md`. Reviews flag that
  block.
  <!-- slack: Next.js stack rule | agents lezen de Next-docs uit node_modules; `agentRules: false` houdt AGENTS.md schoon -->
