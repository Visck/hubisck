# Hubisck - Link Aggregation Platform

## Overview

Hubisck is a multilingual link-in-bio SaaS platform similar to Linktree, designed to help users create personalized landing pages that aggregate their social media links and online presence. The platform emphasizes smart remarketing capabilities through Google Ads integration, multilingual support (Portuguese, English, French), and comprehensive analytics.

The application is built as a full-stack monorepo with a React frontend and Express backend, featuring a modern design system based on shadcn/ui components with a distinctive orange (#FF6600) brand identity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server for fast HMR and optimized production builds
- **Wouter** for lightweight client-side routing instead of React Router
- **TanStack Query v5** for server state management, data fetching, and caching

**UI Component System**
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for utility-first styling with custom design tokens
- **CVA (Class Variance Authority)** for variant-based component styling
- Custom theme system supporting light/dark modes with HSL color variables
- Orange-first color palette (#FF6600 primary) as defined in design guidelines

**State Management**
- React Context API for global state (LanguageContext for i18n)
- TanStack Query for server state caching and synchronization
- Local component state via React hooks

**Internationalization**
- Custom i18n implementation in `client/src/lib/i18n.ts`
- Support for Portuguese (PT), English (EN), and French (FR)
- Dynamic language switching with browser language detection
- Currency localization (BRL, EUR, USD) with geolocation-based detection

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript for the REST API server
- HTTP server created via Node's `http` module for potential WebSocket support
- Development mode uses Vite middleware for SSR and HMR
- Production mode serves static builds from `dist/public`

**Database Layer (Dual Database Architecture)**
- **Hostinger MySQL** for app data (users, link_pages, links, link_clicks)
  - mysql2/promise with connection pooling and SSL
  - Auto-creates tables on first startup via `server/mysql.ts`
  - Secrets: DB_HOST, DB_NAME, DB_USER, DB_PASS, DB_PORT
  - Requires Remote MySQL access enabled in Hostinger control panel
- **Replit PostgreSQL** for Stripe data only (via stripe-replit-sync)
  - Uses Drizzle ORM with Neon serverless driver
  - Stripe schema for products, prices, subscriptions, etc.
- Storage interface (`IStorage`) in `server/storage.ts` abstracts MySQL operations
- Types defined locally in storage.ts (User, LinkPage, Link, LinkClick)

**Authentication**
- **Supabase Auth** for user authentication
- Email + Password ONLY (no OAuth - Google/Apple completely removed)
- Separate pages for clean UX:
  - `/login` - Email + password login form
  - `/signup` - Email + password + confirm password with live validation
- Strict email verification enforcement:
  - Unverified users are signed out immediately and see red banner
  - Only verified email addresses can access protected routes
  - ProtectedRoute component gates all dashboard/smart-link routes
- Password requirements: 8+ chars, uppercase, lowercase, number (with live visual feedback)
- AuthContext manages frontend auth state via `supabase.auth.onAuthStateChange`
- After signup: Shows "Check your email to activate your Hubisck account" screen
- Supabase project: mgvpyjlpouvgmaodbdjk
- Environment: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

**Session & Storage**
- MySQL-backed user storage synced from Supabase auth
- Storage interface (`IStorage`) in `server/storage.ts` supporting multi-page CRUD operations
- Methods: getLinkPagesByUserId, getLinkPageById, createLinkPage, updateLinkPage, deleteLinkPage, getTotalClicksByUserId

**API Design**
- RESTful endpoints under `/api` prefix
- Authentication: JWT tokens in Authorization header (Bearer token)
- Link Pages API: /api/link-pages, /api/link-page/:id, /api/dashboard/stats
- Links API: /api/links, /api/links/:id
- Analytics API: /api/analytics
- Stripe API: /api/create-checkout-session, /api/customer-portal
- Geolocation endpoint (`/api/geolocation`) for currency detection
- JSON request/response format with proper error handling

### Build & Deployment

**Build Process**
- Custom build script (`script/build.ts`) orchestrates dual compilation:
  - Client: Vite production build → `dist/public`
  - Server: esbuild bundling → `dist/index.cjs`
- Selective dependency bundling (allowlist) to optimize cold starts
- Single-file server bundle for simplified deployment

**Development Workflow**
- `npm run dev`: Concurrent Vite dev server + Express with HMR
- `npm run build`: Production build of client and server
- `npm start`: Production server serving static assets
- `npm run db:push`: Drizzle schema synchronization

### Code Organization

**Monorepo Structure**
```
/client          # Frontend React application
  /src
    /components  # React components (UI + feature)
    /pages       # Route components
    /lib         # Utilities, i18n, queryClient
    /hooks       # Custom React hooks
    /contexts    # React context providers
/server          # Backend Express application
  index.ts       # Server entry point
  routes.ts      # API route handlers
  storage.ts     # Data persistence layer
  static.ts      # Static file serving
  vite.ts        # Vite dev middleware
/shared          # Code shared between client/server
  schema.ts      # Database schema + Zod types
```

**Path Aliases**
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

## External Dependencies

### Third-Party UI Libraries
- **Radix UI** - Headless component primitives (accordion, dialog, dropdown, etc.)
- **Lucide React** - Icon library for consistent iconography
- **Embla Carousel** - Touch-enabled carousel component
- **cmdk** - Command palette/menu component
- **Recharts** - Charting library (prepared for analytics features)
- **react-day-picker** - Date picker component
- **vaul** - Drawer component for mobile interactions

### Data & Validation
- **Zod** - Schema validation for forms and API
- **drizzle-zod** - Automatic Zod schema generation from Drizzle schemas
- **@hookform/resolvers** - React Hook Form + Zod integration
- **date-fns** - Date manipulation utilities

### Backend Services
- **Supabase** - Authentication provider with email+password only (no OAuth)
- **Hostinger MySQL** - Primary database for app data (users, link_pages, links, link_clicks)
- **Neon PostgreSQL** - Used only for Stripe schema via stripe-replit-sync
- **Stripe** - Payment processing for subscription model (R$19.99/€19.99/$19.99)
- **Spotify API** - Track detection for Smart Link pages (using client credentials flow)
- **Google Tag Manager** - Customer-configurable GTM container injection for remarketing

### Smart Link Track Detection
- Uses Spotify Web API exclusively for track/album detection
- Client credentials flow for authentication (no user login required)
- Extracts: track title, artist name, cover art, ISRC, release date
- Auto-generates URL slug from track title
- Users manually add other streaming platform links (YouTube, Apple Music, Deezer, etc.)

### Google Tag Manager Integration
- Customers can add their own GTM Container ID (format: GTM-XXXXXXX) per page
- GTM script is injected on public landing pages when configured
- Enables customer remarketing through Google Ads, conversion tracking, and analytics
- Server-side validation ensures valid GTM ID format
- Clean script removal on page unmount to prevent cross-page leakage

### Custom Domain Support (Account-Level)
- **Account-Level Custom Domains**: Each user can set ONE custom domain that applies to ALL their pages
- **DNS Verification**: TXT record verification for custom domains
  - TXT record: `_hubisck-verify.yourdomain.com` with verification token
  - CNAME record: Points to deployment URL (e.g., `hubisck.com`)
- **Database Storage**: Custom domain fields stored in users table
  - Fields: customDomain, customDomainVerified, customDomainVerifiedAt, customDomainVerificationToken
- **Dynamic URL Display**: URL previews throughout app automatically show user's custom domain when verified
- **API Routes**:
  - `GET /api/account/domains/status` - Get user's domain configuration status
  - `POST /api/account/domains` - Set custom domain for account
  - `POST /api/account/domains/verify` - Verify DNS records
  - `DELETE /api/account/domains` - Remove custom domain
- **Helper Functions** (server/urlHelpers.ts):
  - `getBaseUrl(userId)` - Returns user's custom domain or hubisck.com
  - `getFullUrl(userId, slug)` - Returns full page URL with proper domain
- **Frontend Integration**:
  - CustomDomainSettings component in Dashboard Domains tab
  - All page forms dynamically show URL preview based on domain status

### Development Tools
- **TypeScript** - Type safety across full stack
- **ESBuild** - Fast server bundling
- **PostCSS + Autoprefixer** - CSS processing
- **Replit Plugins** - Dev banner, error overlay, cartographer for Replit environment

### Notable Design Decisions

**Why Wouter over React Router?**
- Lightweight (~1.3KB) for simple SPA routing needs
- Current application has minimal routing requirements (landing page + 404)

**Why Dual Database Architecture?**
- Hostinger MySQL provides affordable, high-performance storage for app data
- PostgreSQL retained for Stripe integration via stripe-replit-sync
- Clear separation of concerns between app data and payment data

**Why Custom i18n vs. i18next?**
- Small translation surface area (landing page only)
- Reduces bundle size and complexity
- Direct integration with currency detection logic

**Monorepo with Shared Types**
- Single source of truth for data schemas
- Type safety between frontend and backend
- Simplified validation with drizzle-zod