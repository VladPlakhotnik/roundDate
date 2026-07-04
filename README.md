# RoundDate

Next.js application for RoundDate offline dating events in Gdańsk.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Neon Postgres
- Drizzle ORM
- Better Auth
- Resend
- Stripe
- Vitest
- ESLint
- Prettier

## Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format
```

## Environment

Copy `.env.example` to `.env.local` and fill values before enabling real database, auth,
email, or payment flows.

## Structure

- `src/app` - routes and route handlers.
- `src/views` - page-level compositions.
- `src/widgets` - reusable page sections.
- `src/features` - user actions and business workflows.
- `src/entities` - domain entities.
- `src/shared` - shared UI, config, hooks, utilities, and server adapters.
- `references` - design references and generated assets.
- `docs` - architecture and technical notes.
- `plan.md` - product and content plan for the Gdansk launch.
