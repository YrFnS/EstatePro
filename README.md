# EstatePro

A comprehensive full-stack real estate platform built with Next.js, featuring property listings, AI-powered recommendations, real-time messaging, interactive maps, virtual tours, and a complete admin dashboard.

![Next.js](https://img.shields.io/badge/Next.js-16.x-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma)
![License](https://img.shields.io/badge/license-MIT-green)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the App](#running-the-app)
- [Scripts](#scripts)
- [Key Pages \& Routes](#key-pages--routes)
- [API Routes](#api-routes)
- [Database Schema](#database-schema)
- [Internationalization](#internationalization)
- [Real-Time Features](#real-time-features)
- [AI Integration](#ai-integration)
- [Deployment](#deployment)
- [License](#license)

---

## Features

### Property Management
- **Property Listings** — Browse, search, and filter properties with detailed cards, image galleries, and pagination
- **Property Details** — Full property pages with image carousels, feature lists, location maps, and agent info
- **Property Comparison** — Side-by-side comparison of multiple properties
- **Smart Search** — AI-powered natural language property search
- **Map View** — Interactive Leaflet-based map with property markers
- **Virtual Tours** — 360° virtual tour support (Matterport integration)
- **Property Valuation** — AI-driven property price estimation

### User Features
- **Authentication** — NextAuth.js with credentials and OAuth providers (Google, GitHub)
- **User Dashboard** — Manage profile, saved properties, and activity
- **Favorites** — Save and manage favorite properties
- **Saved Searches** — Create and manage property search alerts
- **Property Alerts** — Get notified about new listings matching criteria
- **Real-Time Messaging** — Socket.IO-powered chat between users and agents
- **Tour Scheduling** — Book in-person or virtual property tours
- **Commute Calculator** — Calculate commute times to/from properties with multiple transport modes
- **Mortgage Calculator** — Built-in payment and affordability calculator

### Admin Dashboard
- **Property CRUD** — Full create, read, update, delete for all property listings
- **Agent Management** — Manage agent profiles and assignments
- **Market Data** — Configure market statistics and data points
- **Neighborhoods** — Manage neighborhood guides and information
- **Testimonials** — Manage client testimonials and reviews
- **Site Settings** — Global site configuration (hero, stats, SEO, contact info)
- **Property Types** — Configure property type categories and icons

### AI Features
- **AI Recommendations** — Personalized property recommendations based on preferences
- **AI Chat** — Conversational assistant for property queries
- **Smart Search** — Natural language property search powered by AI
- **Property Image Generation** — AI-generated property images
- **Property Valuation** — AI-driven market value estimation

### Additional
- **Bilingual Support** — Full English/Arabic internationalization (i18n) with RTL support
- **Responsive Design** — Mobile-first responsive UI with Tailwind CSS
- **Dark Mode** — Theme switching with next-themes
- **Newsletter** — Email subscription management
- **SEO Optimized** — Meta tags, Open Graph, structured data, and sitemap support
- **PWA Ready** — Web app manifest for installable experience

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **UI Library** | React 19 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui (Radix UI) |
| **Database** | SQLite (via Prisma ORM) |
| **ORM** | Prisma 6 |
| **Auth** | NextAuth.js 4 |
| **State** | Zustand + React Query (TanStack) |
| **Real-Time** | Socket.IO |
| **Maps** | Leaflet + React-Leaflet |
| **Forms** | React Hook Form + Zod |
| **i18n** | next-intl |
| **Animation** | Framer Motion |
| **Charts** | Recharts |
| **AI** | Z AI Web Dev SDK |
| **Runtime** | Bun |
| **Icons** | Lucide React |
| **Notifications** | Sonner |

---

## Project Structure

```
EstatePro/
├── prisma/
│   └── schema.prisma          # Database schema (Prisma)
├── public/                     # Static assets
├── scripts/                    # Utility scripts
├── messages/                   # i18n translation files
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── api/                # REST API routes
│   │   │   ├── admin/          # Admin CRUD endpoints
│   │   │   ├── agents/         # Agent endpoints
│   │   │   ├── ai-recommend/   # AI recommendations
│   │   │   ├── auth/           # Authentication (NextAuth)
│   │   │   ├── chat/           # AI chat endpoint
│   │   │   ├── commute/        # Commute calculator
│   │   │   ├── contact/        # Contact form
│   │   │   ├── conversations/  # Messaging conversations
│   │   │   ├── generate-property-image/  # AI image generation
│   │   │   ├── inquiries/      # Property inquiries
│   │   │   ├── market-data/    # Market statistics
│   │   │   ├── neighborhoods/ # Neighborhood data
│   │   │   ├── newsletter/     # Newsletter subscription
│   │   │   ├── properties/     # Property CRUD + map data
│   │   │   ├── reviews/        # Property reviews
│   │   │   ├── seed/           # Database seeding
│   │   │   ├── settings/       # Site settings
│   │   │   ├── smart-search/   # AI smart search
│   │   │   ├── testimonials/   # Testimonials
│   │   │   ├── tours/          # Tour scheduling
│   │   │   └── valuation/      # Property valuation
│   │   ├── about/              # About page
│   │   ├── admin/              # Admin dashboard
│   │   ├── agents/             # Agent listing & profiles
│   │   ├── ai-recommend/       # AI recommendations page
│   │   ├── calculator/         # Mortgage calculator
│   │   ├── commute/            # Commute calculator page
│   │   ├── compare/            # Property comparison
│   │   ├── contact/            # Contact page
│   │   ├── dashboard/          # User dashboard
│   │   ├── favorites/          # Saved favorites
│   │   ├── list-property/      # Property submission form
│   │   ├── market-insights/    # Market data & charts
│   │   ├── messaging/          # Real-time messaging UI
│   │   ├── my-tours/           # User tour bookings
│   │   ├── neighborhood-guide/ # Neighborhood guide
│   │   ├── notifications/      # User notifications
│   │   ├── properties/         # Property listing & detail pages
│   │   ├── property-alerts/    # Property alert management
│   │   ├── saved-searches/     # Saved search management
│   │   ├── settings/           # User settings
│   │   ├── valuation/          # Property valuation page
│   │   └── virtual-tour/       # Virtual tour viewer
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components (145+ files)
│   │   ├── real-estate/        # Domain-specific components
│   │   ├── layout-shell.tsx    # Main layout wrapper
│   │   ├── page-shell.tsx      # Page layout wrapper
│   │   └── providers.tsx       # Context providers
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions & helpers
│   └── types/                  # TypeScript type definitions
├── server.ts                   # Custom server with Socket.IO
├── .env                        # Environment variables
├── components.json             # shadcn/ui configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies & scripts
└── eslint.config.mjs           # ESLint configuration
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.3.4 or later) — JavaScript runtime & package manager
- [Git](https://git-scm.com)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd EstatePro
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database (SQLite)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

### Database Setup

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# (Optional) Seed the database with sample data
bun run dev
# Then visit: http://localhost:3000/api/seed
```

### Running the App

```bash
# Development server (with Socket.IO)
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

The app will be available at **http://localhost:3000** with Socket.IO running on the same port.

---

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start development server with Socket.IO |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run Prisma migrations |
| `bun run db:reset` | Reset database |

---

## Key Pages & Routes

| Route | Description |
|---|---|
| `/` | Homepage with hero, featured properties, market stats |
| `/properties` | Property listing with search & filters |
| `/properties/[id]` | Property detail page |
| `/agents` | Agent directory |
| `/agents/[id]` | Agent profile page |
| `/ai-recommend` | AI-powered property recommendations |
| `/calculator` | Mortgage & affordability calculator |
| `/commute` | Commute time calculator |
| `/compare` | Property comparison tool |
| `/contact` | Contact form |
| `/dashboard` | User dashboard |
| `/favorites` | Saved favorite properties |
| `/list-property` | Submit a property listing |
| `/market-insights` | Market data, trends & charts |
| `/messaging` | Real-time messaging center |
| `/my-tours` | Scheduled property tours |
| `/neighborhood-guide` | Neighborhood information guide |
| `/notifications` | User notifications |
| `/property-alerts` | Property search alerts |
| `/saved-searches` | Saved search queries |
| `/settings` | User account settings |
| `/valuation` | AI property valuation |
| `/virtual-tour` | 360° virtual tour viewer |
| `/admin` | Admin dashboard |

---

## API Routes

### Properties
- `GET /api/properties` — List properties (with filters)
- `GET /api/properties/[id]` — Get property details
- `GET /api/properties/map` — Get properties for map view

### Authentication
- `POST /api/auth/register` — User registration
- `GET/POST /api/auth/[...nextauth]` — NextAuth handlers
- `GET /api/auth/me` — Current user info

### Messaging
- `GET /api/conversations` — List user conversations
- `GET/POST /api/conversations/[id]/messages` — Conversation messages

### AI
- `POST /api/ai-recommend` — Get AI property recommendations
- `POST /api/chat` — AI chat assistant
- `POST /api/smart-search` — Natural language search
- `POST /api/valuation` — Property valuation
- `POST /api/generate-property-image` — AI image generation

### Admin
- Full CRUD for properties, agents, neighborhoods, testimonials, settings, market data, and property types

### Other
- `POST /api/inquiries` — Submit property inquiry
- `POST /api/contact` — Submit contact form
- `POST /api/tours` — Schedule a tour
- `POST /api/reviews` — Submit a review
- `POST /api/newsletter` — Newsletter subscription
- `POST /api/commute` — Calculate commute time
- `GET /api/seed` — Seed database with sample data

---

## Database Schema

The application uses **SQLite** with Prisma ORM. Key models include:

| Model | Description |
|---|---|
| `Property` | Real estate listings with bilingual fields, pricing, location, features |
| `Agent` | Real estate agent profiles with specialization and ratings |
| `User` | User accounts with role-based access (admin, agent, user) |
| `Account` | OAuth account linking (NextAuth) |
| `Session` | User sessions (NextAuth) |
| `Conversation` | Messaging conversations |
| `Message` | Individual chat messages |
| `Inquiry` | Property inquiries from visitors |
| `Review` | Property reviews and ratings |
| `Tour` | Property tour bookings |
| `CommuteProfile` | Saved commute destinations |
| `SiteSetting` | Configurable site settings (key-value) |
| `Testimonial` | Client testimonials |
| `Neighborhood` | Neighborhood guide entries |
| `PropertyTypeConfig` | Property type configurations |
| `MarketDataPoint` | Market trend data points |
| `MarketStat` | Market statistics |
| `NewsletterSubscriber` | Newsletter email subscribers |

---

## Internationalization

EstatePro supports **English** and **Arabic** with full RTL (right-to-left) layout support:

- Translation files are stored in `/messages/`
- Uses `next-intl` for internationalization
- All user-facing content supports bilingual display
- Arabic font: IBM Plex Sans Arabic
- English font: Geist Sans / Geist Mono

---

## Real-Time Features

Powered by **Socket.IO** integrated into the custom Bun server:

- **Live Messaging** — Real-time chat between users and agents
- **Typing Indicators** — See when someone is typing
- **Read Receipts** — Message read status updates
- **Conversation Rooms** — Socket rooms per conversation

---

## AI Integration

EstatePro leverages the **Z AI Web Dev SDK** for:

- **Property Recommendations** — Personalized suggestions based on user preferences
- **Smart Search** — Natural language queries like "3-bedroom villa under $500K near downtown"
- **Chat Assistant** — Conversational AI for property-related questions
- **Image Generation** — AI-generated property images
- **Valuation** — Machine learning-based property price estimation

---

## Deployment

### Production Build

```bash
bun run build
bun run start
```

### Environment Notes

- Set `NODE_ENV=production` for production mode
- Configure `DATABASE_URL` with your production database path
- Set `NEXTAUTH_SECRET` to a secure random string
- The custom server (`server.ts`) handles both Next.js and Socket.IO on the same port

### Recommended Platforms

- **Vercel** — For Next.js hosting (note: Socket.IO requires a custom server, use a VPS for full functionality)
- **Railway / Render** — Full-stack deployment with Socket.IO support
- **VPS (DigitalOcean, AWS EC2)** — Full control over the custom server

---

## License

This project is licensed under the [MIT License](LICENSE).
