# Tideborne JAR audit cache

Generated Tideborne audit snapshots belong in this directory.

A valid audit must record at minimum:

- Tideborne version,
- exact JAR filename,
- SHA-256,
- audit date,
- FishScore behavior/formula,
- Body Type behavior,
- Condition behavior,
- size behavior,
- Satchel behavior,
- commands,
- meaningful config,
- integrations,
- migration behavior,
- useful class/resource paths supporting the findings.

Use matching `.json` and `.md` files when practical, for example:

- `tideborne-1.3.57.json`
- `tideborne-1.3.57.md`

There is intentionally no current audit file yet because the exact authoritative Tideborne 1.3.57 JAR and its SHA-256 are not present in the repository/current task inputs.

If a supplied JAR SHA-256 matches an existing cached audit, reuse the audit. If it differs, mark the audit stale and update it before relying on old mechanic documentation.
