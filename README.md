# Meal Easy

A full-stack meal management web application for a residential mess of 100+ users.

## Features

- **Meal toggling** — members toggle their meal on/off for the next day before a configurable per-meal-type cutoff time
- **Menu management** — admins set the daily menu per meal type; members can view the upcoming menu
- **Mess Settings** — admin configures meal types (each with its own cutoff time), mess timezone, guest meal limit, and notification preferences. A setup-required banner appears until all required fields are configured.
- **Cost & billing** — purchase tracking, other costs, automated billing calculation, and PDF reports
- **Deposits & balance** — per-user deposit ledger, dynamic balance computation
- **Stock tracking** — inventory with low-stock alerts
- **Chef management** — chef profiles, salary, and bonus records. Admin can reset a chef's password from the chef profile page; the password change immediately invalidates the chef's active session.
- **User management** — registration approval, block/unblock; read-only access to Purchases and Other Costs for regular users
- **Admin management** — Super Admin can promote users to Admin or demote Admins back to users. Role changes take effect immediately via JWT reissue. Demotion invalidates the existing session instantly.
- **Audit logs** — every sensitive action is logged with actor, target, and diff snapshots
- **Push notifications** — web-push via VAPID, service worker; cutoff reminders and low-stock alerts via scheduled cron jobs
- **PDF export** — Puppeteer-powered monthly user reports (per-user meal and billing breakdown) and admin billing reports (all users' bills, deposits, and balances for a month)
- **PWA support** — installable as a Progressive Web App on Android and iOS; supports offline app shell and Web Push notifications
- **Bilingual UI** — English and Bengali (বাংলা) via i18next; Bengali font (Hind Siliguri) embedded in PDFs for offline rendering

## Tech Stack

| Layer           | Technology                                                                    |
| --------------- | ----------------------------------------------------------------------------- |
| Frontend        | React 19 + Vite, Material UI v6, i18next, date-fns, dayjs                    |
| Backend         | Node.js + Express.js                                                          |
| Database        | MongoDB 7 + Mongoose                                                          |
| Auth            | JWT in httpOnly cookie                                                        |
| Push            | Web Push API + VAPID + Service Worker                                         |
| PDF             | puppeteer-core (headless Chromium via system install, not bundled)            |
| Proxy / Serving | Nginx (production)                                                            |
| Container       | Docker + Docker Compose                                                       |

## Prerequisites

- [Docker Desktop](https://docs.docker.com/get-docker/) (includes Docker Compose v2)
- [Node.js 20+](https://nodejs.org/) — only needed for the seed script and local development

Verify:

```bash
docker --version        # Docker version 24+
docker compose version  # Docker Compose version v2+
node --version          # v20+
```

## First-time Setup (Docker — recommended)

### 1. Clone the repository

```bash
git clone <repo-url> meal-easy
cd meal-easy
```

### 2. Create the environment file

```bash
cp .env.example .env
```

Open `.env` and fill in the required values (see [Environment Variables](#environment-variables) below).

Minimum required changes:

```dotenv
JWT_SECRET=<generate a long random string>
VAPID_PUBLIC_KEY=<from web-push keygen>
VAPID_PRIVATE_KEY=<from web-push keygen>
VAPID_SUBJECT=mailto:you@example.com
```

Generate VAPID keys (run once, outside Docker):

```bash
npx web-push generate-vapid-keys
```

### 3. Start the containers

```bash
docker compose up --build -d
```

This builds the React client and the API server, then starts MongoDB, the server, and Nginx. The first build takes a few minutes.

### 4. Create the superadmin account

The seed script creates the initial superadmin user and ensures the MessSettings singleton exists. The singleton is created **empty** — you must configure meal types, timezone, and cutoff times via the Settings page before the app is fully usable.

```bash
# From the project root — connects to the running MongoDB container
MONGO_URI=mongodb://localhost:27017/meal-easy node server/src/scripts/seed.js
```

Expected output:

```
Connected to MongoDB.
Super Admin created  phone=01700000000  password=superadmin123
MessSettings created (empty — configure via Settings page).
Done.
```

**Change the superadmin password immediately after first login.**

### 5. Access the app

| URL                                   | Purpose                  |
| ------------------------------------- | ------------------------ |
| `http://localhost`                    | React client (via Nginx) |
| `http://localhost:3000/api/v1/health` | API health check         |

Log in with:

- Phone: `01700000000`
- Password: `superadmin123`

## Development Mode (without Docker)

Run the API server and client dev server directly on your machine. You need MongoDB running locally.

### Start MongoDB

```bash
# macOS with Homebrew
brew services start mongodb-community

# Or with Docker (just the database)
docker run -d -p 27017:27017 --name mongo mongo:7
```

### Start the API server

```bash
cd server
# Override MONGO_URI to point at localhost (not the Docker internal hostname)
MONGO_URI=mongodb://localhost:27017/meal-easy npm run dev
```

The server starts on `http://localhost:3000`.

### Start the React client

```bash
cd client
npm run dev
```

The dev server starts on `http://localhost:4000` (or the next available port).

The client `.env` already sets `VITE_API_URL=http://localhost:3000/api/v1`, so axios points at the local server.

### Seed the database (first time only)

```bash
MONGO_URI=mongodb://localhost:27017/meal-easy node server/src/scripts/seed.js
```

## Accessing from mobile (same WiFi network)

Run: `./scripts/set-ip.sh`

This auto-detects your Mac's IP and updates `MAC_IP` in `.env`.
Then restart Docker and open `http://YOUR_IP` (port 80, served by Nginx) on your phone.
If your IP changes, just run the script again and restart Docker.

> **Note:** Port 4000 is the Vite dev server port and only applies when running the client **outside Docker** (`cd client && npm run dev`). For Docker-based access, always use port 80.

## Project Structure

```
meal-easy/
├── client/                 React + Vite frontend
│   ├── src/
│   │   ├── api/            axios instance with base URL + 401 interceptor
│   │   ├── components/     shared UI (AppLayout, dashboards, NotificationBell)
│   │   ├── context/        AuthContext, SettingsContext, ThemeContext, TopbarContext
│   │   ├── i18n/           en.json, bn.json, i18next init
│   │   └── pages/          one file per route
│   ├── Dockerfile          multi-stage: Node build → Nginx serve
│   └── nginx.conf          SPA fallback + /api/* proxy to server container
│
├── server/                 Node.js + Express API
│   └── src/
│       ├── assets/
│       │   └── fonts/      HindSiliguri-Regular.ttf, NotoSansBengali-Regular.ttf
│       ├── config/         db.js (Mongoose connect), env.js, multer.js
│       ├── controllers/    route handlers (one per resource)
│       ├── jobs/           cronJobs.js (cutoff reminders, low-stock alerts)
│       ├── middleware/      authenticate, authorize, errorHandler, validate
│       ├── models/         Mongoose schemas + barrel index.js
│       ├── routes/         Express routers
│       ├── scripts/        seed.js
│       └── utils/          billingEngine, balanceHelper, mealHelpers,
│                           pdfGenerator, reportTemplate, billingReportTemplate,
│                           pushService
│
├── data/                   Docker bind-mounts (git-ignored)
│   ├── mongo/              MongoDB data files
│   └── uploads/            user/chef photo uploads
│
├── scripts/                helper shell scripts (set-ip.sh for mobile access)
├── .env.example            template for environment variables
├── docker-compose.yml      production service definitions
└── CLAUDE.md               project context for AI assistance
```

## User Roles

| Role           | Capabilities                                                                     |
| -------------- | -------------------------------------------------------------------------------- |
| **superadmin** | Full control. Created by seed script. Can manage admins.                         |
| **admin**      | Same as superadmin except cannot manage other admins.                            |
| **user**       | Self-registers (requires admin approval). Toggles own meals, views own reports. Read-only access to Purchases and Other Costs records. |
| **chef**       | Created by admin. Views today's portions and stock. Can update stock quantities. |

## Environment Variables

There are two `.env` files:

- **Root `.env`** — loaded by the server process via `dotenv`. Copy from `.env.example`.
- **`client/.env`** — Vite build-time variables for the React frontend. Create this file manually for local dev; Docker Compose injects the values at build time.

### Server (`root .env`)

| Variable            | Required | Default                 | Description                                                                                                                          |
| ------------------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`          | No       | `development`           | Set to `production` in Docker Compose                                                                                                |
| `PORT`              | No       | `3000`                  | API server port                                                                                                                      |
| `MONGO_URI`         | Yes      | —                       | MongoDB connection string. Use `mongodb://mongo:27017/meal-easy` inside Docker, `mongodb://localhost:27017/meal-easy` for local dev. |
| `JWT_SECRET`        | Yes      | —                       | Secret for signing JWT tokens. Use a long random string (32+ chars).                                                                 |
| `JWT_EXPIRES_IN`    | No       | `7d`                    | JWT token lifetime (e.g. `1d`, `7d`, `30d`).                                                                                         |
| `VAPID_PUBLIC_KEY`  | Yes\*    | —                       | VAPID public key for web push. Generate with `npx web-push generate-vapid-keys`.                                                     |
| `VAPID_PRIVATE_KEY` | Yes\*    | —                       | VAPID private key. Keep secret.                                                                                                      |
| `VAPID_SUBJECT`     | Yes\*    | —                       | Contact email for VAPID (e.g. `mailto:admin@example.com`).                                                                           |
| `CLIENT_URL`        | No       | `http://localhost:3000` | Allowed CORS origin. Set to the public URL of the client in production.                                                              |
| `SECURE_COOKIES`    | No       | —                       | Set to `true` in production to enable the `Secure` flag on auth cookies (requires HTTPS).                                            |
| `MAC_IP`            | No       | —                       | Your machine's local IP address. Updated automatically by `scripts/set-ip.sh` for mobile access on the same WiFi network.            |

\*Push notifications will silently fail without VAPID keys, but all other features work normally.

### Client (`client/.env`)

| Variable               | Required | Description                                                                                                   |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`         | Yes      | Base URL for API requests. Use `http://localhost:3000/api/v1` for local dev; Docker overrides this to `/api/v1`. |
| `VITE_VAPID_PUBLIC_KEY`| Yes\*    | The **same** public VAPID key as `VAPID_PUBLIC_KEY` above. Required for push notification subscription in the browser. |

\*Without this key the push subscription step is silently skipped and no notifications are delivered to the client.

### MONGO_URI — two valid values

| Context               | Value                                 |
| --------------------- | ------------------------------------- |
| Inside Docker Compose | `mongodb://mongo:27017/meal-easy`     |
| Local dev (Mac/Linux) | `mongodb://localhost:27017/meal-easy` |

The `.env` file defaults to the Docker value. When running the server outside Docker, override inline:

```bash
MONGO_URI=mongodb://localhost:27017/meal-easy npm run dev
```

## Key Business Rules

- **Meal toggle** — only for tomorrow, locked after the configured per-meal-type cutoff time. The server always validates; client time is never trusted.
- **Billing lock** — once a billing cycle is submitted, purchases, other costs, and billing data for that month are immutable.
- **Balance** — always computed dynamically as `sum(Deposits) − sum(UserBill.totalBill)`. Never stored.
- **Account deletion** — soft-delete only (`status: 'deleted'`, `deletedAt`). No hard deletes.
- **Meal block** — admin-triggered. Low balance does NOT auto-block meals.
- **Guest meal limit** — enforced server-side. Admin configures the monthly limit per user in Mess Settings.

## Useful Commands

```bash
# View running containers
docker compose ps

# Stream server logs
docker compose logs -f server

# Rebuild and restart a single service
docker compose up --build -d server

# Stop everything
docker compose down

# Stop and remove data volumes (⚠ deletes all database data)
docker compose down && rm -rf data/

# Run seed script against the Docker MongoDB
MONGO_URI=mongodb://localhost:27017/meal-easy node server/src/scripts/seed.js

# Install client dependencies (for dev)
cd client && npm install

# Install server dependencies (for dev)
cd server && npm install
```

## SRS Reference

Full Software Requirements Specification: [Notion → Projects/Meal Easy/SRS v1](https://www.notion.so/35a7691e357281a0ac9fdcca8d2b2a57)
