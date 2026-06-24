# MCP Definitions

Canonical MCP server definitions for this workflow repo.

## Files

- `servers.json` - source-of-truth MCP server definitions

## Sync behavior

`scripts/sync.sh` mirrors this folder to:

- `~/.cursor/mcp/ai-workflows`

## Activation

These synced files are intentionally namespaced to avoid overwriting
existing local MCP config.

Merge the `mcpServers` entries from `servers.json` into your active client
configuration (for example, `~/.cursor/mcp.json`) and keep secrets in env vars.

## Notes

- Prefer environment variables for tokens and API keys.
- Keep command paths and args portable across devices when possible.
- Edit definitions in this repo first, then run `./scripts/sync.sh`.
