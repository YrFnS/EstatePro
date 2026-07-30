# EstatePro

EstatePro is a bilingual real-estate marketplace built with Next.js, React, TypeScript, Prisma, PostgreSQL, Tailwind CSS, and Socket.IO. It includes public property discovery, moderated property publishing, account-synchronized features, authenticated messaging, tour scheduling, scheduled property alerts, AI-assisted tools, and a protected administration dashboard.

## Current capabilities

### Property discovery

- Property catalogue and detail pages that expose only published listings
- URL-backed search, filters, sorting, and pagination
- Grid, list, and interactive map views using one shared filter model
- English and Arabic content with RTL support
- Property comparison, favorites, recently viewed listings, and saved searches
- Property galleries, maps, reviews, inquiries, mortgage estimates, and virtual tours
- AI recommendations restricted to published inventory

### Listing creation and moderation

- Private property drafts tied to the signed-in owner
- A My Listings workspace for drafts, reviews, scheduling, publication, and archival
- Bilingual submission-readiness checks and completion scoring
- Statuses for draft, pending review, changes requested, scheduled, published, rejected, and archived listings
- Review notes and persistent owner notifications
- Administrator approval, rejection, change requests, scheduling, reopening, and archival
- Immutable property audit history
- Automatic scheduled publication through a protected worker

### Property media

- Normalized and ordered images, videos, floor plans, and documents
- Cover-image selection, drag-and-drop reordering, accessible move controls, previews, and deletion
- Optional direct uploads to AWS S3, Cloudflare R2, MinIO, or another S3-compatible service
- External HTTP/HTTPS media URLs when object storage is not configured
- Legacy image-string synchronization for existing components and migrated data

### Accounts and communication

- Credentials authentication through NextAuth
- User registration with bcrypt password hashing
- Cross-device favorites, comparison selections, saved searches, and notifications
- Authenticated conversations and messages
- Socket.IO room authorization based on database membership
- Tour scheduling and account-scoped tour management
- Listing-owner notifications for inquiries and tour requests
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

The protected administration experience includes:

- Platform overview metrics
- Property CRUD and agent assignment
- Agent CRUD
- Testimonial and neighborhood management
- Bilingual site-setting management
- A dedicated `/admin/moderation` listing-review workspace
- Ordered property-media inspection and audit history
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
| Authentication | NextAuth 4 credentials sessions and signed administrator sessions |
| Realtime | Socket.IO |
| Object storage | Optional S3-compatible presigned uploads |
| Maps | Leaflet and React Leaflet |
| Forms and validation | React Hook Form and Zod |
| Runtime | Bun |
| Tests and validation | Bun tests, Prisma validation, TypeScript, ESLint, and Next.js production builds through GitHub Actions |

## Requirements

- Bun 1.3.4 or newer
- PostgreSQL
- Node-compatible hosting capable of running a persistent Bun process and WebSocket connections
- A scheduler for property-alert processing and scheduled listing publication
- Optional S3-compatible object storage for direct property-media uploads

## Environment variables

Copy `.env.example` to `.env` and replace every development value:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"

# Optional separate signing secret for administrator sessions.
# NEXTAUTH_SECRET is used as a fallback when this is omitted.
ADMIN_AUTH_SECRET="replace-with-a-different-long-random-secret"

# Required for protected scheduler endpoints.
CRON_SECRET="replace-with-a-scheduler-bearer-secret"
ALERT_PROCESS_LIMIT="250"
LISTING_PUBLISH_LIMIT="250"

# Optional canonical public URL used by the realtime server's origin allowlist.
APP_URL="http://localhost:3000"

PORT="3000"
HOSTNAME="0.0.0.0"

# Optional S3-compatible property-media storage.
S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
S3_REGION="auto"
S3_BUCKET="estatepro-media"
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_PUBLIC_BASE_URL="https://media.example.com"
S3_FORCE_PATH_STYLE="true"
```

Generate secrets with a trusted password generator or a command such as:

```bash
openssl rand -base64 48
```

Never commit `.env`, storage credentials, or production database credentials.

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
| `bun run listings:publish` | Publish due scheduled listings once |
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

## Listing lifecycle and media

New account listings begin as private drafts. Owners add details and media, then submit the listing to `/admin/moderation`. Administrators may publish immediately, schedule publication, request changes, reject, or archive the listing. Only published listings are returned by public property APIs.

The media layer supports:

- ordered image, video, floor-plan, and document records
- one cover image per property
- direct S3-compatible uploads using short-lived presigned PUT URLs
- external media URLs as a fallback
- automatic synchronization of the legacy `Property.images` field

Detailed workflow, storage CORS, upload limits, migration behavior, and smoke tests are documented in `docs/listing-lifecycle.md`.

## Property-alert scheduler

Apply migrations before starting schedulers:

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

Detailed alert behavior is documented in `docs/property-alerts.md`.

## Scheduled listing publication

Approved listings may be scheduled up to one year in advance. Choose one execution method:

1. Configure the repository Actions secret `DATABASE_URL`. `.github/workflows/listing-publishing.yml` checks due listings every 15 minutes.
2. Call the protected endpoint:

```text
GET /api/cron/publish-listings?limit=250
Authorization: Bearer <CRON_SECRET>
```

3. Run the worker directly:

```bash
LISTING_PUBLISH_LIMIT=250 bun run listings:publish
```

The publisher uses a conditional database update so concurrent workers cannot publish the same listing twice.

## Security model

- Public write endpoints validate request bodies and apply lightweight rate limits.
- Public property queries and AI recommendations are restricted to published inventory.
- Listing ownership is derived from the active session; clients cannot choose another owner's ID.
- Owners cannot edit listings while they are under review, scheduled, or publicly active.
- Direct uploads use short-lived server-signed URLs and listing-scoped object keys.
- Every admin API route is protected by signed administrator-session middleware.
- Message senders are derived from the authenticated session rather than request payloads.
- Conversation reads, writes, Socket.IO joins, and broadcasts verify membership.
- Tour records are scoped to the signed-in customer, assigned agent, or administrator.
- Favorites, comparisons, searches, notifications, alerts, and listings derive ownership from the authenticated session.
- Scheduler HTTP execution requires `CRON_SECRET`.
- Alert matches, notifications, and scheduled publication use idempotent identifiers or conditional claims.
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
| `/properties` | Searchable published-property catalogue |
| `/properties/[id]` | Published details or authorized owner/admin preview |
| `/agents` | Agent directory |
| `/list-property` | Create a private listing draft |
| `/my-listings` | Account listing workflow and performance dashboard |
| `/my-listings/[id]/edit` | Protected listing editor and media manager |
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
| `/admin/moderation` | Protected property-listing review queue |

## Account and guest state

Signed-in users store favorites, comparison selections, saved searches, notifications, property alerts, and listing ownership in PostgreSQL. Existing guest browser state is imported after login where supported. Guests can continue using favorites, comparison, and saved-search features locally without being forced to create an account, but creating a property listing requires authentication.

## Continuous integration

Pull requests run `.github/workflows/ci.yml`, which performs:

1. Dependency installation
2. Prisma client generation
3. Prisma schema validation
4. Bun unit tests
5. TypeScript checking
6. ESLint
7. A production Next.js build

A pull request should not be merged until this workflow succeeds and the deployment environment has valid PostgreSQL, authentication, migration, scheduler, and optional object-storage configuration.

## License

MIT
