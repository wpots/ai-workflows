- `skills/start-project` lane 1b no longer has the agent run `migrate:status`
  and `migrate` after `db:up`: it names the command, the developer applies the
  migrations, and a step that needs a migrated database stays not run until
  they report it ran, per `rules/payload.md`.
