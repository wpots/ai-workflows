# Payload Rules

Apply these rules when adding, refactoring, or reviewing Payload CMS schemas,
queries, hooks, admin components, or Payload-backed content blocks.

Load `rules/content-blocks.md` as well when the task involves frontend block
modules.

## Schema Placement

- follow the project's existing Payload folder structure instead of inventing a
  parallel schema layout
- keep block schemas, collection schemas, and shared field helpers in the
  established Payload schema areas for the repo
- shared field definitions and helpers belong in the existing schema helper
  areas instead of being duplicated inline

In repos like this one, common locations are `src/payload/schemas/blocks/**`
and `src/payload/schemas/collections/**`.

## Payload Blocks

For every new Payload block:

- create the schema in the project's block-schema area
- export it from the local block-schema barrel when the repo uses one
- add it to every relevant `layoutBlocks` array or shared page-collection
  config that should allow the block
- run `npm run generate:types` after schema changes so generated Payload types
  stay current

Payload provides `blockType` on block items. Preserve that discriminator through
the frontend transform layer and expose it to the rendered block component.

## Type Boundaries

- treat generated Payload document types as transport types
- map Payload data through `Transform*.ts` helpers before passing it into
  presentation components
- do not hand-maintain unions that are already derivable from generated Payload
  types when the generated types can be the source of truth

## Architecture

- keep `getPayload()` calls, collection queries, and other Payload
  infrastructure concerns out of presentational components
- prefer transforming Payload transport data into trusted module or component
  props before rendering
- keep schema definitions, hooks, and admin concerns within Payload areas rather
  than spreading them through unrelated frontend folders

## Migrations

- agents must never run migration CLI commands (`migrate`, `migrate:create`,
  `migrate:status`, `migrate:fresh`, `migrate:reset`, or any `payload migrate*`
  variant) — the user applies migrations manually; tell them what to run after
  schema changes. `templates/project-claude-settings.json` ships a PreToolUse
  hook that hard-denies `migrate:fresh`/`migrate:create` invocations as a
  deterministic backstop (it ignores mere mentions in grep/cat/echo)
- if the schema change lives on a branch checked out in a git worktree, check
  that branch out in the project's main working directory as soon as a
  migration is needed, and remove the now-unneeded worktree — migrations run
  against the real local dev database from the main checkout, not a worktree

## Generated Artifacts

- treat generated Payload types and special-case generated files as generated
  code
- do not hand-edit generated outputs unless the project has an explicit
  exception
- when generated types drift from schema reality, regenerate them instead of
  patching downstream types around the mismatch
