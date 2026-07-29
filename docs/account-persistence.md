# Account persistence

EstatePro stores signed-in account state in PostgreSQL instead of treating browser
storage as the source of truth.

## Persisted data

- favorite properties
- the ordered three-property comparison list
- saved searches and their alert preference
- in-app notifications and read status

Guests can still use these features. Guest data is kept locally and is imported
into the account after a successful sign-in.

## Database deployment

The schema change is included in:

```text
prisma/migrations/20260729150000_account_persistence/migration.sql
```

Apply it in production before deploying the application code:

```bash
bun run db:generate
bun run db:deploy
```

For development databases, `bun run db:migrate` or `bun run db:push` may still be
used as appropriate.

## API ownership

All routes below derive the user ID from the NextAuth session. They never accept
a user ID from the browser:

```text
/api/account/favorites
/api/account/comparison
/api/account/saved-searches
/api/account/notifications
```

## Migration behavior

On sign-in, the providers import existing guest and legacy browser records.
Successful imports clear the migrated local records. Favorites and comparison
lists keep a small pending cache so interrupted writes can be retried during the
next hydration.
