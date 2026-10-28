# Rules Index

This directory contains focused rule files. Load the relevant file(s) for the current context.

The priority guidance below is conceptual, not a guarantee about how every tool loads files.
Claude Code and Codex each load instructions differently.
In synced projects, see `AI-WORKFLOWS.md` for the tool-specific loading model.

In practice, treat this directory as a topic-based rule library:

- compact baseline guidance is always-on only where a tool-specific adapter makes it so
- focused rule files are usually loaded on-demand when the task needs them
- developers should explicitly mention a focused rule in the prompt when they want a strong guarantee that the tool applies it

| File                          | Covers                                                              |
| ----------------------------- | ------------------------------------------------------------------- |
| `communication.md`                      | Tone, response style, problem-solving approach                      |
| `project.md`                            | React, Next.js, TypeScript, component design, naming                |
| `type-safety.md`                        | Runtime trust boundaries, strict TypeScript posture, review guardrails |
| `tailwind.md`                           | Tailwind 4, design tokens, Figma export workflow                    |
| `testing.md`                            | Browser verification tool choice, Jest + Storybook split, query priority, coverage |
| `accessibility.md`                      | WCAG requirements, ARIA, keyboard navigation                        |
| `sustainability.md`                     | Sustainable IT: caching/rendering, LCP/assets, bundle & client JS, CI cost, deps |
| `sonarqube.md`                          | Opt-in SonarQube/SonarLint rule parity: avoid flagged patterns, apply preferred fixes |
| `documentation.md`                      | Comments, JSDoc, and docs describing changed behaviour update in the same MR; one home per durable fact; docblocks attach to a declaration |
| `adr.md`                                | Architecture Decision Records: when to write one, `docs/adr/` layout, statuses, MADR-lite template |
| `backlog.md`                            | User stories, backlog items, feature/bug file structure             |
| `mr-sizing.md`                          | MR size budget, sliceability test, split triggers, ticket-to-item mapping |
| `git-flow.md`                           | Branch/MR flow, squash-and-ff merge settings, MR title as history, provenance labels |
| `content-blocks.md`                     | CMS-backed block module structure, transforms, registry, tests      |
| `payload.md`                            | Payload schemas, generated types, hooks, admin integrations, jobs queue <!-- payload-only --> |
| `clean-architecture.md`                 | Layer principles, dependency rules, forbidden patterns (all stacks) |
| `stacks/nextjs-payload.md`              | Next.js conventions (App Router, proxy vs. middleware, read path, DoD); Payload sections optional |
| `stacks/react-native-expo.md`              | React Native + Expo conventions                              |

## Loading Priority

1. Load `communication.md` always — baseline behavior.
2. Load `project.md` when no project-local rules exist.
3. Load `clean-architecture.md` whenever writing or reviewing code.
4. Load `type-safety.md` when handling TypeScript-heavy code, integrations,
   parsing, config, or code review focused on correctness.
5. Load `tailwind.md` when working on styles or design tokens.
6. Load `testing.md` before browser verification, or when writing or reviewing tests.
7. Load `backlog.md` when writing user stories, backlog items, or task specs.
8. Load `mr-sizing.md` alongside `backlog.md` whenever work is sized or sliced
   (backlog, refinement, sprint planning), and when opening or reviewing an MR.
9. Load `git-flow.md` before branching, MR/PR review or rework, rebasing,
   conflict resolution, merge-readiness work, opening or merging an MR, or
   checking merge settings.
10. Load `accessibility.md` when building interactive UI components.
11. Load `content-blocks.md` when building or reviewing CMS-backed content blocks.
12. Load `sustainability.md` when reviewing performance, caching, bundle size,
    CI cost, or dependencies — or when changing public-route rendering.
13. Load `sonarqube.md` when a SonarQube or SonarLint finding is mentioned, or
    when editing code that could trip one of its opted-in rules.
14. Load `documentation.md` when adding comments or JSDoc, when changing code
    that existing comments, JSDoc, or repo docs describe, and during code
    review. Adding comments to new code is the trigger that is easiest to
    miss — load the rule before writing them, not when review flags them.
15. Load `adr.md` when recording or revisiting an architecture decision,
    creating `docs/adr/` or `docs/architecture.md`, or when a change
    contradicts a recorded decision.
16. Load the appropriate stack file based on detected stack (see below).
17. Load `payload.md` when working on Payload schemas, hooks, generated types, jobs, or admin integrations. <!-- payload-only -->

## Stack Detection

Before loading a stack file, read the project's `package.json` and check
`dependencies` + `devDependencies`:

- `"next"` present → load `stacks/nextjs-payload.md` — **every Next.js project,
  with or without Payload**. The file's Payload sections are additive; its
  Next-general rules (App Router, proxy vs. middleware, read path, DoD) apply
  even when neither `payload` nor a `@payloadcms/*` package is present.
- `"expo"` or `"react-native"` present → load
  `stacks/react-native-expo.md` when available
  - if the file is not available locally, fall back to
    `clean-architecture.md` plus a structure probe instead of assuming Expo
    conventions
- Neither detected → apply `clean-architecture.md` principles only; do not
  assume any folder structure

## Structure Probe Directive

When applying stack rules to an **existing project**, do not assume canonical
folder names. Instead:

1. List the top-level directories inside `src/` (or the project root if no
   `src/` exists).
2. Map each detected folder to a CA layer using the mapping table in the
   relevant stack file.
3. If a folder cannot be classified from the table, inspect a sample of its
   files to determine what it imports.
4. Ask the user to classify any folder that remains ambiguous.
5. Only then check CA principles against the resolved mapping.

Never report a violation based on a folder name mismatch. Report violations
based on **principle breaches** within the resolved layer mapping.

## Conflict Resolution

- Project-local rules always win over these baseline rules.
- `communication.md` wins over project rules only for tone and response style.
- Stack rules are additive — they extend `clean-architecture.md`, never
  contradict it.
