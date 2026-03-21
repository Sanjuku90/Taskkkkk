# Workspace

## Overview

TaskCoin — a crypto investment platform with daily tasks. Users deposit USDT TRC20 / TRX, choose investment plans, complete daily tasks to earn rewards, and request withdrawals. Admins manage users, validate transactions, and control site settings.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: express-session + connect-pg-simple + bcryptjs
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (auth, plans, tasks, transactions, admin)
│   └── taskcoin/           # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (seed, etc.)
└── ...
```

## Features

### User Features
- Register / Login with email + password
- 7 investment plans (Starter $45 → VIP Elite $400)
- Daily tasks (3-7 per day, $10-$80 per task)
- 24h task reset with countdown timer
- USDT TRC20 / TRX deposits and withdrawals
- Full transaction history

### Admin Features (admin@taskcoin.com / admin123)
- Platform statistics dashboard
- User management (suspend/reactivate, add bonus)
- Transaction validation (approve/reject deposits & withdrawals)
- Site settings (maintenance mode, block tasks/withdrawals, deposit address)

## Database Schema

- `users` — user accounts with balance and active plan
- `plans` — 7 investment plans (seeded)
- `task_logs` — completed task records per user per day
- `transactions` — deposit/withdrawal requests
- `site_settings` — key-value site configuration
- `user_sessions` — session storage (auto-created by connect-pg-simple)

## Admin Credentials

- Email: admin@taskcoin.com
- Password: admin123

## Deposit Address

- TAB1oeEKDS5NATwFAaUrTioDU9djX7anyS (USDT TRC20 / TRX)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. Run `pnpm run typecheck` from root.

## Key Commands

- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/scripts run seed` — seed plans and admin user
- `pnpm --filter @workspace/api-server run build` — build API server

## Deployment — Render

The file `render.yaml` at the root configures everything needed to deploy on Render.

### What it does
- Creates a **PostgreSQL** database (`taskcoin-db`)
- Creates a **Web Service** (`taskcoin-api`) that:
  1. Installs dependencies
  2. Builds the React frontend (`BASE_PATH=/ PORT=3000`)
  3. Builds the Express API server
  4. Copies the frontend static files into the API server's dist folder
  5. Starts the Express server which serves both `/api/*` routes and the React SPA

### Steps to deploy on Render
1. Push this repo to GitHub / GitLab
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your repository — Render will detect `render.yaml` automatically
4. `DATABASE_URL` is automatically linked to the provisioned Postgres database
5. `SESSION_SECRET` is auto-generated
6. After first deploy, run the seed script manually via Render Shell:
   ```
   pnpm --filter @workspace/scripts run seed
   ```

### Production notes
- Express serves the React SPA from `dist/public` in `NODE_ENV=production`
- Cookies are `secure: true` in production (HTTPS)
- `trust proxy` is enabled so sessions work behind Render's proxy

## Mobile App — iOS & Android (EAS)

The mobile app uses **Expo Application Services (EAS)** for building distributable binaries.
Config file: `artifacts/taskcoin-mobile/eas.json`

### Build profiles
| Profile | Output | Use case |
|---|---|---|
| `development` | Simulator build | Local development with dev client |
| `preview` | Internal APK (Android) | Testing on real devices |
| `production` | AAB (Android) + IPA (iOS) | App Store / Play Store submission |

### Steps to build
1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. From `artifacts/taskcoin-mobile/`:
   ```
   eas build --profile preview --platform android   # APK téléchargeable
   eas build --profile preview --platform ios        # IPA pour TestFlight
   eas build --profile production --platform all     # Stores
   ```
4. Update `EXPO_PUBLIC_API_URL` in `eas.json` with your actual Render API URL
5. Update `extra.eas.projectId` in `app.json` with your EAS project ID (from `eas init`)

### API URL
The mobile app reads `EXPO_PUBLIC_API_URL` at build time and calls `setBaseUrl()` in `app/_layout.tsx`.
