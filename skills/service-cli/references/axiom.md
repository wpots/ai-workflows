# Axiom via `axiom`

## Install and verify

```bash
brew install --cask axiomhq/tap/axiom
axiom auth login          # personal API token → the CLI config
axiom auth status
axiom auth switch-org     # when the token spans more than one organisation
```

Headless (CI, routines): `AXIOM_TOKEN` and `AXIOM_ORG_ID` replace the login
(`AXIOM_URL` too for a self-hosted deployment). Read the token with
`npx dotenvx get`, never inline.

## Read

```bash
axiom dataset list

# APL query; -f json for anything the agent reads, the default table is for the human
axiom query "['<dataset>'] | where _time > ago(1h) | summarize count() by bin(_time, 5m)" -f json
axiom query "['<dataset>'] | where level == 'error' | take 20" --start-time -24h -f json | jq '.[0]'
```

`--start-time` and `--end-time` take relative values (`-2w`, `-7d`, `-24h`,
`-20m`); `--fail-on-empty` exits 1 when no rows come back, which makes a
check script fail loudly. Run the first query through `jq '.[0]'` to see the
row shape before projecting fields.

## Write

```bash
axiom ingest <dataset> -f <events.ndjson>    # JSON, NDJSON or CSV; see --help for the format flags
axiom dataset create                          # prompts for name and description
```

## Connector-only remainder

Monitors (`checkMonitors`, `getMonitorHistory`), dashboards, notifiers,
spotlight, the service map and saved queries have no CLI command. Use the
Axiom connector for those and say so in the recap.
