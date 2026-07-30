# Property alert processing

EstatePro stores signed-in users' property alerts in PostgreSQL and creates
persistent `UserNotification` records when a property becomes a new match.

## Required deployment order

Apply migrations before deploying application code:

```bash
bun run db:generate
bun run db:deploy
```

The alert migration creates `PropertyAlert` and `PropertyAlertMatch`.

## Scheduler options

### GitHub Actions

The repository includes `.github/workflows/property-alerts.yml`, which checks
for due alerts every 15 minutes. Add a repository Actions secret named
`DATABASE_URL`. When the secret is absent, the workflow exits successfully and
reports that processing was skipped.

The workflow can also be started manually and accepts a processing limit.

### Protected HTTP cron endpoint

Any external scheduler can call:

```text
GET /api/cron/property-alerts
Authorization: Bearer <CRON_SECRET>
```

Set `CRON_SECRET` in the deployment environment. The route refuses to run when
the secret is missing and uses a timing-safe comparison for authentication.

An optional `limit` query parameter controls how many due alerts are processed:

```text
/api/cron/property-alerts?limit=250
```

### Direct command

A server with database access can run:

```bash
bun run alerts:process
```

`ALERT_PROCESS_LIMIT` can override the default batch size.

## Delivery behavior

- `instant` alerts become due every 15 minutes.
- `daily` alerts become due every 24 hours.
- `weekly` alerts become due every seven days.
- Saved searches with notifications enabled automatically receive a linked daily alert.
- The first run establishes a baseline and creates one activation notification.
- Later runs inspect properties updated since the previous successful scan.
- A unique alert/property match prevents duplicate delivery.
- Each generated notification uses a unique `sourceId`, so retries are safe.
- Alert and notification history is capped to prevent unbounded account data.
- Signed-in clients poll for new persistent notifications and refresh on focus.

## Operational notes

Alert processing is idempotent and can safely be retried. A failed alert stores
its last error and is scheduled for another attempt after 15 minutes. Manual
refresh is available from the Property Alerts page and is rate-limited.
