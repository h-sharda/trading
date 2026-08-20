# Trading

Personal trading workspace. Next.js 16, Prisma 7, and Postgres.

## Prerequisites

- Node.js 20.19 or later
- npm

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root with a Postgres connection string:

```bash
DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DATABASE"
```

For local development, start Prisma’s local Postgres server and put the URL it prints into `DATABASE_URL` (either `postgres://…` or `prisma+postgres://…`):

```bash
npx prisma dev
```

Keep that process running while you develop. You can run it in the background with `npx prisma dev --detach`.

3. Apply database migrations (creates `User` and `Session` tables):

```bash
npx prisma migrate dev
```

`npm install` already runs `prisma generate`. Run it again after schema changes:

```bash
npx prisma generate
```

4. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Auth

| Page | URL |
| --- | --- |
| Sign up | [/sign-up](http://localhost:3000/sign-up) |
| Sign in | [/sign-in](http://localhost:3000/sign-in) |
| Sign out | [/sign-out](http://localhost:3000/sign-out) |

Sessions stay active until you sign out.

## Kite

After sign-in, save your Kite API key and API secret, then authenticate with Zerodha. Register this redirect URL in the Kite developer console:

| Purpose | URL |
| --- | --- |
| Login callback | [/kite/callback](http://localhost:3000/kite/callback) |

Access tokens are stored per user and treated as expired at 6:00 AM IST. Re-authenticate after that to place trades.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
```
