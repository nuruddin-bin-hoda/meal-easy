# CLAUDE.md — Meal Easy Project Context

## What This Project Is

Meal Easy is a meal management web application for a single residential mess of 100+ users.
It handles: meal toggling, menu management, cost/billing, stock tracking, deposits, chef management, audit logs, PDF reports, push notifications, and bilingual UI (English + Bengali).

## Tech Stack

- Frontend: React (Vite) + Material UI (MUI) + i18next
- Backend: Node.js + Express.js
- Database: MongoDB with Mongoose
- Auth: JWT in httpOnly cookie (NOT localStorage)
- Push: Web Push API + VAPID + Service Worker
- PDF: Puppeteer (server-side)
- i18n: i18next + react-i18next (English + Bengali)
- Containerisation: Docker + Docker Compose

## Project Structure

```
meal-easy/
├── server/src/
│   ├── config/          db.js, multer.js
│   ├── models/          All Mongoose models
│   ├── routes/          Express routers
│   ├── controllers/     Route handlers
│   ├── middleware/       authenticate.js, authorize.js, errorHandler.js, validate.js
│   ├── utils/           billingEngine.js, balanceHelper.js, pushService.js, pdfGenerator.js
│   ├── jobs/            cronJobs.js
│   ├── scripts/         seed.js
│   └── index.js
└── client/src/
    ├── api/             axios.js
    ├── context/         AuthContext.jsx
    ├── components/      layout/, dashboards/, shared UI
    ├── pages/           One file per route
    ├── i18n/            en.json, bn.json, index.js
    └── main.jsx
```

## User Roles

| Role       | Key Facts                                                                       |
| ---------- | ------------------------------------------------------------------------------- |
| superadmin | One per mess. Full control. Created by seed script.                             |
| admin      | Created by superadmin only. Same permissions except cannot manage other admins. |
| user       | Self-registers. Must be approved by Admin before they can log in.               |
| chef       | Created by Admin. Parallel hierarchy. Can update stock. Cannot toggle meals.    |

## Critical Business Rules — Always Enforce These

1. **Meal toggle** — only for TOMORROW, default OFF, locked after cutoffTime. Server always checks time.
2. **Billing lock** — once `BillingCycle.isLocked = true`, NO modifications to purchases, other costs, or billing data.
3. **Balance** — ALWAYS computed dynamically: `sum(Deposits) - sum(UserBill.totalBill)`. Never a stored field.
4. **Account deletion** — soft delete only. Set `status: 'deleted'`, `deletedAt: timestamp`. Records are NEVER hard-deleted.
5. **Guest meal limit** — enforced server-side. Check MessSettings.guestMealMonthlyLimit.
6. **Meal block** — Admin manually blocks. Low balance does NOT auto-block.
7. **Chef auth** — Chef logs in via same `/auth/login` endpoint. JWT role will be `'chef'`.

## API Convention

- Base: `/api/v1/`
- Auth: JWT in httpOnly cookie named `token`
- All inputs validated with express-validator
- Error shape: `{ message: string }` or `{ errors: [...] }`
- Pagination: `?page=1&limit=20`

## MongoDB Collections

users, chefs, messSettings (singleton), mealToggles, menus, purchases, otherCosts,
billingCycles, userBills, deposits, stock, chefSalaries, chefBonuses, auditLogs, notifications

## Key Utilities

- `billingEngine.js` → calculateBilling(month) → used by preview, submit, and predicted rate
- `balanceHelper.js` → getUserBalance(userId) → used everywhere balance is shown
- `pushService.js` → sendPushToUser/sendPushToAdmins/sendPushToAllUsers
- `pdfGenerator.js` → generatePDF(html) → uses Puppeteer, needs --no-sandbox in Docker

## Environment Variables

See `.env.example`. Key vars:

- MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN
- VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
- CLIENT_URL (for CORS)

### MONGO_URI — Important

Two valid values depending on where the server runs:

- Inside Docker Compose: `mongodb://mongo:27017/meal-easy`
  ('mongo' is the Docker internal container hostname)
- Directly on Mac (npm run dev): `mongodb://localhost:27017/meal-easy`

The .env file uses the Docker value by default.
When testing outside Docker, override inline:
MONGO_URI=mongodb://localhost:27017/meal-easy npm run dev

Never permanently change .env to localhost — it will break inside Docker.

## Development Phases (completed items tracked here)

- [ ] Phase 1: Foundation & Auth
- [ ] Phase 2: Meal System
- [ ] Phase 3: Cost, Billing & Deposits
- [ ] Phase 4: Stock & Chef Management
- [ ] Phase 5: Dashboards & Reports
- [ ] Phase 6: Notifications & PWA
- [ ] Phase 7: i18n, PDF & Polish

## SRS Source

Notion → Projects/Meal Easy/SRS - v1
URL: https://www.notion.so/35a7691e357281a0ac9fdcca8d2b2a57

## Notes for Claude Code

- Always verify cutoff logic server-side. Never trust client time.
- AuditLog entries must be written for: stock updates, purchases, deposits, meal toggles, billing submission, user approval/rejection/block, settings changes, menu updates, salary/bonus records.
- Puppeteer in Docker requires: `--no-sandbox`, `--disable-setuid-sandbox` launch args.
- Bengali PDF requires Hind Siliguri font loaded via Google Fonts in the HTML template.
- MessSettings is a singleton — use findOneAndUpdate with upsert, never create multiple documents.
- All push notification sends must be fire-and-forget (wrapped in try/catch, do not block the API response).
