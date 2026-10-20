- In a Next.js 16.4+ project, add `agentRules: false` to `next.config.ts` and
  remove the block between `<!-- BEGIN:nextjs-agent-rules -->` and
  `<!-- END:nextjs-agent-rules -->` from `AGENTS.md` if it is there.
  unicore-template sets the option for new projects.
  <!-- slack: next.config.ts | zet `agentRules: false` en haal het nextjs-agent-rules blok uit AGENTS.md -->
