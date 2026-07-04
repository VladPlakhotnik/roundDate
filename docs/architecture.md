# RoundDate Architecture

## Stack

- Next.js App Router on Vercel for SEO-first rendering, routing, server actions, API routes, and cron endpoints.
- pnpm 10.x as the package manager. Vercel supports pnpm, but the project should stay pinned to a Vercel-supported major version rather than local pnpm 11.
- Neon Postgres as the primary database.
- Drizzle ORM and Drizzle Kit for schema-first database work and migrations.
- Better Auth as the planned auth layer for email/password and future providers.
- Resend for transactional and marketing email.
- Stripe for paid bookings.
- Tailwind CSS v4 with custom UI components. Radix primitives are installed only for accessible low-level behavior.
- Vitest, Testing Library, ESLint, Prettier, and TypeScript for local quality gates.

## Runtime Rules

- Database, email, payment, and auth clients must be initialized lazily inside getter functions.
- Server-only modules live under `src/shared/server`.
- Public UI and feature code must not import server-only modules.
- Route handlers are allowed to call server modules directly.
- The project starts as a single Next.js application. Workspaces can be added later only if admin, worker, or shared package boundaries become truly necessary.

## Layers

- `src/app` contains routes and route handlers only.
- `src/views` contains page-level compositions.
- `src/widgets` contains reusable page sections such as header, footer, and event lists.
- `src/features` contains user actions and business workflows.
- `src/entities` contains domain models and entity-specific UI/query/type files.
- `src/shared` contains app-wide utilities, UI primitives, config, hooks, styles, and server adapters.
- `references` is reserved for design references and AI-generated assets.
