# EstatePro

EstatePro is a bilingual real-estate marketplace built with Next.js, React, TypeScript, Prisma, PostgreSQL, Tailwind CSS, and Socket.IO. It includes public property discovery, account features, authenticated messaging, tour scheduling, AI-assisted tools, and a protected administration dashboard.

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
- Authenticated conversations and messages
- Socket.IO room authorization based on database membership
- Tour scheduling and account-scoped tour management
- Agent and administrator access controls

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
| Tests and validation | TypeScript, ESLint, Next.js production build through GitHub Actions |

## Requirements

- Bun 1.3.4 or newer
- PostgreSQL
- Node-compatible hosting capable of running a persistent Bun process and WebSocket connections

## Environment variables

Create `.env` in the repository root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"

# Optional separate signing secret for administrator sessions.
# NEXTAUTH_SECRET is used as a fallback when this is omitted.
ADMIN_AUTH_SECRET="replace-with-a-different-long-random-secret"

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
bun run db:push
bun run dev
```

Open `http://localhost:3000`.

## Commands

| Command | Purpose |
|---|---|
| `bun run dev` | Run the Next.js and Socket.IO development server |
| `bun run build` | Create a production Next.js build |
| `bun run start` | Run the production Bun server |
| `bun run typecheck` | Run TypeScript without emitting files |
| `bun run lint` | Run ESLint |
| `bun run check` | Generate Prisma, type-check, lint, and build |
| `bun run db:generate` | Generate the Prisma client |
| `bun run db:push` | Apply the current Prisma schema without a migration |
| `bun run db:migrate` | Create and apply a development migration |
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

## Security model

- Public write endpoints validate request bodies and apply lightweight rate limits.
- Property publishing requires an authenticated `agent` or `admin` account.
- Every admin API route is protected by signed administrator-session middleware.
- Message senders are derived from the authenticated session rather than request payloads.
- Conversation reads, writes, Socket.IO joins, and broadcasts verify membership.
- Tour records are scoped to the signed-in customer, assigned agent, or administrator.
- The service worker never caches API, admin, authentication, messaging, or account responses.
- CI performs an unsuppressed TypeScript check before linting and building.

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
| `/favorites` | Device-local favorites |
| `/saved-searches` | Account-namespaced browser saved searches |
| `/compare` | Property comparison |
| `/calculator` | Mortgage, affordability, and investment calculations |
| `/market-insights` | Market data |
| `/admin` | Protected administration dashboard |

## Browser-local data

Favorites, comparison selections, notifications, and saved searches currently use browser storage. Saved searches are namespaced by the signed-in account to prevent one browser account from seeing another account's saved filters. Database synchronization across devices can be added in a later persistence phase.

## Continuous integration

Pull requests run `.github/workflows/ci.yml`, which performs:

1. Dependency installation
2. Prisma client generation
3. TypeScript checking
4. ESLint
5. A production Next.js build

A pull request should not be merged until this workflow succeeds and the deployment environment has valid PostgreSQL and authentication secrets.

## License

MIT
