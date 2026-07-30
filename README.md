# EstatePro

EstatePro is a bilingual real-estate marketplace built with Next.js, React, TypeScript, Prisma, PostgreSQL, Tailwind CSS, and Socket.IO. It includes public property discovery, synchronized account features, authenticated messaging, tour scheduling, scheduled property alerts, AI-assisted tools, and a protected administration dashboard.

## Current capabilities

### Property discovery

- Property listing and detail pages
- URL-backed search, filters, sorting, and pagination
- Grid, list, and interactive map views using one shared filter model
- English and Arabic content with RTL support
- Property comparison, favorites, recently viewed listings, and saved searches
- Property galleries, maps, reviews, inquiries, mortgage estimates, and virtual tours

### Accounts and communication

- Credentials authentication through NextAuth
- User registration with bcrypt password hashing
- Cross-device favorites, comparison selections, saved searches, and notifications
- Authenticated conversations and messages
- Socket.IO room authorization based on database membership
- Tour scheduling and account-scoped tour management
- Agent and administrator access controls

### Property alerts

- Account-owned instant, daily, and weekly property alerts
- Reuse of the same filters used by property search and map views
- Saved searches can automatically create linked daily alerts
- Scheduled matching with duplicate-safe property and notification records
- Persistent notification delivery across devices
- Manual alert refresh, pause, edit, delete, and match history
- Scheduler support through GitHub Actions, a protected HTTP cron endpoint, or a direct worker command

### Administration

The protected `/admin` dashboard includes:

- Platform overview metrics
- Property CRUD and agent assignment
- Agent CRUD
- Testimonial and neighborhood management
- Bilingual site-setting management
- Signed administrator sessions with server-side authorization

### AI tools

Users can supply their own OpenRouter API key in the application settings for:

- Natural-language property search
- Property recommendations
- Real-estate chat assistance
- Valuation support

Property-image generation uses the configured Z AI SDK integration.

## Technology

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Radix UI |
| Language | TypeScript 5 |
| Database | PostgreSQL |
| ORM | Prisma 6 |
| Authentication | NextAuth 4 credentials sessions |
| Realtime | Socket.IO |
| Maps | Leaflet and React Leaflet |
| Forms and validation | React Hook Form and Zod |
| Runtime | Bun |
| Tests and validation | Bun tests, Prisma validation, TypeScript, ESLint, and Next.js production builds through GitHub Actions |

## Requirements

- Bun 1.3.4 or newer
- PostgreSQL
- Node-compatible hosting capable of running a persistent Bun process and WebSocket connections
- A scheduler for property-alert processing

## Environment variables

Copy `.env.example` to `.env` and replace every development value:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"

# Optional separate signing secret for administrator sessions.
# NEXTAUTH_SECRET is used as a fallback when this is omitted.
ADMIN_AUTH_SECRET="replace-with-a-different-long-random-secret"

# Required when an external scheduler calls /api/cron/property-alerts.
CRON_SECRET="replace-with-a-scheduler-bearer-secret"

# Optional canonical public URL used by the realtime server's origin allowlist.
APP_URL="http://localhost:3000"

PORT="3000"
HOSTNAME="0.0.0.0"
```

Generate secrets with a trusted password generator or a command such as:

```bash
openssl rand -base64 48
```

Never commit `.env` or production credentials.

## Installation

```bash
git clone <repository-url>
cd EstatePro
bun install
bun run db:generate
bun run db:deploy
bun run dev
```

For an empty development database where migration history is not required, `bun run db:push` remains available. Production and shared environments should use `bun run db:deploy`.

Open `http://localhost:3000`.

## Commands

| Command | Purpose |
|---|---|
| `bun run dev` | Run the Next.js and Socket.IO development server |
| `bun run build` | Create a production Next.js build |
| `bun run start` | Run the production Bun server |
| `bun run test` | Run Bun unit tests |
| `bun run typecheck` | Run TypeScript without emitting files |
| `bun run lint` | Run ESLint |
| `bun run check` | Generate Prisma, validate the schema, test, type-check, lint, and build |
| `bun run alerts:process` | Process due property alerts once |
| `bun run db:generate` | Generate the Prisma client |
| `bun run db:push` | Apply the current Prisma schema without migration history |
| `bun run db:migrate` | Create and apply a development migration |
| `bun run db:deploy` | Apply committed migrations in deployment environments |
| `bun run db:reset` | Reset the configured database |

## Database initialization

Public HTTP seed routes are intentionally disabled. Do not initialize production data through a public `/api/seed` endpoint.

For development, use one of these controlled approaches:

- Create records through the protected administration dashboard.
- Use Prisma Studio:

```bash
bunx prisma studio
```

- Add a deployment-only seed script protected from HTTP access.

Create the first administrator through a controlled database or deployment task. Store the password as a bcrypt hash and set the user's `role` to `admin`.

## Property-alert scheduler

Apply migrations before starting the scheduler:

```bash
bun run db:generate
bun run db:deploy
```

Choose at least one execution method:

1. Configure the repository Actions secret `DATABASE_URL`. `.github/workflows/property-alerts.yml` checks due alerts every 15 minutes.
2. Configure `CRON_SECRET` and call the protected endpoint from an external scheduler:

```text
GET /api/cron/property-alerts?limit=250
Authorization: Bearer <CRON_SECRET>
```

3. Run the worker command from a server cron or process manager:

```bash
ALERT_PROCESS_LIMIT=250 bun run alerts:process
```

Detailed behavior and operational notes are documented in `docs/property-alerts.md`.

## Security model

- Public write endpoints validate request bodies and apply lightweight rate limits.
- Property publishing requires an authenticated `agent` or `admin` account.
- Every admin API route is protected by signed administrator-session middleware.
- Message senders are derived from the authenticated session rather than request payloads.
- Conversation reads, writes, Socket.IO joins, and broadcasts verify membership.
- Tour records are scoped to the signed-in customer, assigned agent, or administrator.
- Favorites, comparisons, searches, notifications, and alerts derive ownership from the authenticated session.
- Property-alert cron execution requires `CRON_SECRET` when using the HTTP endpoint.
- Alert matches and notifications use unique identifiers so scheduler retries are idempotent.
- The service worker never caches API, admin, authentication, messaging, or account responses.
- CI performs unsuppressed Prisma, test, TypeScript, lint, and production-build validation.

The included in-memory rate limiter protects a single application instance. Multi-instance production deployments should replace it with a shared store such as Redis.

## Realtime deployment

`server.ts` runs Next.js and Socket.IO on the same long-lived HTTP server. Deploy it to infrastructure that supports:

- Persistent Node/Bun processes
- WebSocket upgrades
- Sticky sessions or a Socket.IO adapter when scaling horizontally
- The configured public origin in `NEXTAUTH_URL` or `APP_URL`

For multiple application instances, add a shared Socket.IO adapter and a distributed rate-limit store.

## Main routes

| Route | Description |
|---|---|
| `/` | Marketplace homepage |
| `/properties` | Searchable property catalogue |
| `/properties/[id]` | Property details |
| `/agents` | Agent directory |
| `/messaging` | Authenticated conversations |
| `/my-tours` | Authenticated tour management |
| `/favorites` | Cross-device account favorites with guest fallback |
| `/saved-searches` | Cross-device saved searches and optional linked alerts |
| `/property-alerts` | Scheduled account property alerts and match history |
| `/notifications` | Persistent account notifications |
| `/compare` | Cross-device property comparison with guest fallback |
| `/calculator` | Mortgage, affordability, and investment calculations |
| `/market-insights` | Market data |
| `/admin` | Protected administration dashboard |

## Account and guest state

Signed-in users store favorites, comparison selections, saved searches, notifications, and property alerts in PostgreSQL. Existing guest browser state is imported after login where supported. Guests can continue using favorites, comparison, and saved-search features locally without being forced to create an account.

## Continuous integration

Pull requests run `.github/workflows/ci.yml`, which performs:

1. Dependency installation
2. Prisma client generation
3. Prisma schema validation
4. Bun unit tests
5. TypeScript checking
6. ESLint
7. A production Next.js build

A pull request should not be merged until this workflow succeeds and the deployment environment has valid PostgreSQL, authentication, migration, and scheduler configuration.

## License

MIT
