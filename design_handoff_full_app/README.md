# Handoff: Full Meal Easy redesign

A complete refresh of the Meal Easy client. Same React + MUI v6 + i18next stack, same routes, same business logic — new design system (warm-neutral palette, refined hairline cards, Inter, sage brand) and reworked layouts for every key screen.

## About the Design Files

The HTML/JSX in this bundle is a **design reference** rendered in a sandboxed canvas using inline styles. It is **not production code**. The work to do is to recreate the design inside the existing `client/` codebase using its established patterns: MUI components, the `theme.js` token system, i18next for strings, AppLayout for shell. **Do not port the inline styles directly** — translate them into `sx` props or theme tokens.

## Fidelity

**High-fidelity.** Exact hex values, spacing, typography, and component composition below are the source of truth.

## What's in this bundle

- `Full Application.html` — the master canvas. Open in a browser to see every screen live.
- `app/tokens.jsx` — palette tokens (light + dark) and atomic UI primitives (Avatar, Toggle, Stepper, Badge, Input, Card, PrimaryBtn, GhostBtn, Eyebrow, icons).
- `app/shell.jsx` — `MobileFrame` and `DesktopFrame` shell components. Source of truth for sidebar nav, topbar, mobile top bar + bottom tab bar.
- `app/data.jsx` — mock data showing the data shape every screen consumes.
- `app/screens-auth.jsx` — Sign in, Register.
- `app/screens-user.jsx` — Dashboard, Meal Toggle, Menu (week), My Report, Profile.
- `app/screens-admin.jsx` — Dashboard, Set Menu, Purchases, Deposits, Billing, Stock, Members.
- `app/screens-misc.jsx` — Chef Dashboard, Notifications.
- `brand/` — Logo SVGs + PNGs + brand README. See `brand/README.md` for icon installation.

---

## Design tokens

Update `client/src/theme.js` to use these. The existing slate/cool palette is replaced wholesale with warm-neutral.

### Light theme

| Token         | Value     |
| ------------- | --------- |
| `bg`          | `#FAF8F3` |
| `surface`     | `#FFFFFF` |
| `soft`        | `#F4F0E8` |
| `softer`      | `#EFEAE0` |
| `ink`         | `#1F1B17` |
| `muted`       | `#6B665E` |
| `dim`         | `#9A9388` |
| `hairline`    | `#E5DFD2` |
| `hairlineSoft`| `#EFEAE0` |
| `accent`      | `#9D5C3B` (warm brown-orange; used sparingly) |
| `brandSage`   | `#7F9E6E` (logo + default avatar) |
| `brandSageDeep`| `#5A7140` |

Semantic (light): success `#EBF2DC` / `#3B5E1F` · warn `#F6E9CC` / `#7A4F0B` · danger `#F4DBD6` / `#7B2520` · info `#E2EDF3` / `#1F4C68`.

### Dark theme (Claude warm-neutral)

| Token         | Value     |
| ------------- | --------- |
| `bg`          | `#1F1E1D` |
| `surface`     | `#2A2927` |
| `soft`        | `#34332F` |
| `softer`      | `#3F3E3A` |
| `ink`         | `#F0EEE6` |
| `muted`       | `#A8A69D` |
| `dim`         | `#7A786F` |
| `hairline`    | `#34332F` |
| `hairlineSoft`| `#2A2927` |
| `accent`      | `#D97757` (Claude orange) |

Semantic (dark): success `#1F2E15` / `#B6DA98` · warn `#3A2A10` / `#F0C277` · danger `#3C1F1A` / `#F0A299` · info `#13283A` / `#9CC9E5`.

### Typography

- Family: `"Inter", "Roboto", sans-serif` (existing).
- Bengali: `"Hind Siliguri", "Noto Sans Bengali", system-ui` — switch automatically when `i18n.language === 'bn'`.
- Enable tabular numerals globally: `fontFeatureSettings: '"tnum","cv11"'`.

| Role                  | Size | Weight | Letter-spacing |
| --------------------- | ---- | ------ | -------------- |
| Page title (topbar)   | 18px | 500    | `-0.01em`      |
| Hero / dashboard h1   | 22px | 500    | `-0.01em`      |
| Eyebrow / small caps  | 11px | 500    | `0.06em` UPPER |
| KPI big number        | 24–28px | 500 | `-0.02em`      |
| Rate hero number      | 50–56px | 500 | `-0.035em`     |
| Body                  | 14px | 400    | normal         |
| Secondary / meta      | 12–13px | 400 |               |

### Spacing / radius / borders

- Card border-radius: `12px`
- Pill / badge: `999px`
- Button: `6–8px`
- Card border: `1px solid hairline` (no elevation/shadow)
- Inner row padding: `10px 0`
- Page padding: desktop `24px 28–32px`, mobile `16px`

---

## App shell — required structural changes

### Desktop (`client/src/components/layout/AppLayout.jsx`)

Replace the current MUI Drawer with this structure:

```
240px sidebar (background.paper, 1px right border) | 1fr content
  ├── 14px padding header with: 30×30 logo (inline SVG) + "Meal Easy" + role tag
  ├── nav list (role-aware — see below)
  └── footer: 32px avatar + name/room + logout icon
content
  ├── topbar (1px bottom border, background.paper): subtitle eyebrow + title + search + lang toggle + theme + bell + action slot
  └── main outlet (background.default)
```

Nav by role:
- **Member (5 items)**: Dashboard · Meals · Menu · My report · Profile
- **Admin (11 items)**: Dashboard · Meal totals · Set menu · Purchases · Other costs · Deposits · Billing · Stock · Chefs · Members · Audit logs
- **Chef (3 items)**: Today · Stock · Profile

Active item: `bgcolor: 'background.default'` (subtle warm-white in light mode), text ink.

### Mobile

Replace the current responsive Drawer with two strips:

- **Top bar** (12px 16px, 1px bottom border): leading slot (e.g. back arrow on detail screens) · subtitle eyebrow + title · bell with badge · 36px avatar
- **Bottom tab bar** (8px 4px 14px, 1px top border, surface bg) — 5 tabs, each centered icon + 10px label, active gets ink color + slightly heavier stroke. Member tabs: Home · Meals · Menu · Report · More. Admin tabs: Home · Meals · Stock · Money · More.

### Page chrome convention

**Every page's title and actions live in the topbar**, not in the body. The body starts directly with content. (We had duplication earlier — remove inline `<Typography variant="h1">` page headers when migrating.)

---

## Screens

For each screen, the canonical implementation is in the JSX file noted; treat it as exact intent, then implement with MUI.

### Auth — `app/screens-auth.jsx`

#### Sign in (`LoginPage.jsx`)
- Centered card, max-width 360.
- 48×48 logo block (rounded-square, brand sage mark inside cream).
- Inputs: Phone (with `+88` adornment) · Password.
- "Forgot password?" link right-aligned above the primary button.
- Primary button `Sign in` full-width.
- Footer: "No account? Request access →" link + EN · বাংলা switcher.

#### Register (`RegisterPage.jsx`)
- Back-to-sign-in link at top.
- Form: Full name · Phone · Room · Password · Confirm password.
- Optional photo uploader — dashed-border drop zone with 40px avatar placeholder + helper text "JPEG, PNG, WebP · max 2 MB".
- Primary button `Submit request` full-width.
- Below: small info banner explaining the admin-approval flow.

### Member — `app/screens-user.jsx`

#### Dashboard (`Dashboard.jsx` user mode)
- **Greeting card**: surface card with a 4px Claude-orange accent strip on the left, "Good evening · {firstName}", and a `Plan tomorrow →` primary button. Cutoff countdown subtitle.
- **KPI tiles row** (3-up on mobile, 3-up on desktop): Balance · Meals this month · Predicted rate.
- **Tomorrow's meals card** (single sheet) — header eyebrow `Tomorrow / Sun, May 19` + warn-tone "Cutoff in 4h 23m" pill. Inside: a row per meal with name + time + menu (inline truncated) + an optional "+N guest" badge + toggle. Footer line shows summary + auto-saved indicator.
- **Recent notifications** — 3 most recent, each with a 4px unread dot (Claude orange), title, timestamp.

#### Meal Toggle (`MealTogglePage.jsx`)
- Cutoff hint at top: "{X} left · cutoffs differ per meal".
- Single composed sheet with three meal rows separated by hairlines:
  - 32×32 roman-numeral marker (I / II / III) — sage-bg if ON, soft-bg if OFF.
  - Meal name + time + cutoff hint.
  - Inline menu (`item · item · item`).
  - Stack on the right: Toggle, then a 24×24 stepper when ON (− `+N` +).
- **Mobile summary card** below: 4px accent strip + "Your tomorrow" eyebrow + big estimated cost + "X meals · Y guests" + rate footer with auto-save indicator.
- **Desktop side rail**: same summary card + "Heads up" tip card. Sticky at top.

#### Menu (`MenuPage.jsx` user mode)
- Stack of day cards (one per day for the current week).
- Today's card gets `bg: soft`, border ink.
- Each day card has header (date + "Today" badge if applicable) + 3-column body (Breakfast/Lunch/Dinner) on desktop, stacked on mobile. Each cell: eyebrow + items inline.

#### My Report (`ReportPage.jsx`)
- Month picker row (← arrow · "Billing month / {Month}" centered · → arrow).
- Big numbers card (4-up on desktop, 2×2 on mobile): Meal rate · Total meals (sub: "incl. N guest") · Total bill · Closing balance (posInk color if positive).
- Two-column row: **Attendance** (B/L/D progress bars vs days in month) + **Cost breakdown** (line items + total).
- **Deposits this month** list.
- Full-width `Download PDF report` primary button at bottom.

#### Profile (`ProfilePage.jsx`)
- Hero card: 56px **accent** avatar + name + role/room + success-tone balance badge + Edit ghost button.
- Settings list as a hairline-divided card: Phone · Room · Member since · Language · Theme · Push notifications. Each row has a chevron.
- Danger row: "Sign out" with danger-tone icon and text.

#### Notifications (`NotificationsPage.jsx`)
- Header row: "{N} unread" eyebrow + "Mark all read" ghost button.
- Hairline-divided card. Each row: 36×36 icon tile (semantic-tinted by kind: `rate→warn`, `cutoff→info`, `deposit→success`, `stock→warn`, `menu→neutral`), title (heavier if unread), body, timestamp, unread orange dot.

### Admin — `app/screens-admin.jsx`

All admin pages: topbar carries title + subtitle + the primary action button(s). Body is content only.

#### Dashboard (`Dashboard.jsx` admin mode)
- **KPI row** (4-up): Active members · Purchases · Deposits · Guests today.
- **Today's portions table** (1.7fr) + **Meal Rate hero** (1fr).
  - Table: 5 columns (Menu / Users / Guests / Portions / Cut-off) with the Portions cell as an info-tone tabular-num pill.
  - Rate hero: eyebrow + ↑ delta pill, ৳62.40 at 50px, "vs ৳58.20 in April", hairline divider, basis line, cycle progress bar (Day 18 of 31) + Projected ৳63.80.
- **Low Balance** + **Low Stock** (2-up).
- **Pending approvals** + **Chef salary** (2-up).

See `design_handoff_admin_dashboard/` (existing bundle) for the full token-by-token spec of this screen — that earlier handoff still applies.

#### Set Menu (`SetMenuPage.jsx`)
- Topbar actions: `Pick date` (ghost) + `Save menu` (primary).
- 3-up grid of meal cards (Breakfast / Lunch / Dinner). Each card: title + time + items count badge + chip list (existing items with × delete) + an "add item" input row (`+ Type item and press Enter`).
- Below: small "Recent days" chip row to jump between days.

#### Purchases (`PurchasesPage.jsx`)
- Topbar action: `Record purchase` primary.
- 3-up KPI cards: Month total · Top buyer · Latest item.
- Filter bar: search + buyer filter + month filter (all as ghost buttons).
- Table: Date / Buyer / Item / Quantity / Unit price / Total / × delete. Right-align numerics, tabular-nums.

#### Deposits (`DepositsPage.jsx`)
- Topbar action: `Record deposit` primary.
- 2-column: table on left + sticky quick-record form on right (Member · Amount with ৳ adornment · Note · Record).

#### Billing (`BillingPage.jsx`)
- Topbar actions: `Export PDF` (ghost) + `Submit & lock` (primary).
- **Warn-tone banner** at top: "Preview — not yet submitted. Submitting will lock this month..."
- 4-up KPIs: Meal rate · Other cost/user · Total meals · Active members.
- Per-member table: Member / Room / Meals / Guests / Meal cost / Other share / Total bill.

#### Stock (`StockPage.jsx`)
- Topbar action: `Add item` primary.
- Table: Item / Quantity / Threshold / Status badge / Updated / chevron. Rows with `qty < threshold` get a warn-tone background.

#### Members (`UsersPage.jsx`)
- Topbar action: `Invite member` primary.
- Filter chips above the table: All / Active / Pending / Blocked (with counts).
- Table: 32px avatar / Name / Room / Phone / Balance (right, danger-tone if negative) / Status badge / context action (Approve for pending, Manage for active, Unblock for blocked).

### Chef — `app/screens-misc.jsx`

#### Chef Dashboard (`Dashboard.jsx` chef mode)
- "Today serving" card with warn-tone "Lunch closes in 2h 14m" badge and stats: Total portions · Guests.
- Three meal cards. Each shows roman numeral (sage-bg if served), name + time, member + guest counts, big total portions number on the right, and a `Mark served` primary button when pending.
- "Stock you may need" card surfacing the same low-stock items the admin sees.

### Notifications (already covered above)

---

## Atomic primitives — implementation hints

Map the design's primitives to MUI as follows:

| Design primitive   | MUI equivalent              | Notes |
| ------------------ | --------------------------- | ----- |
| `Card`             | `<Card elevation={0}>` with `sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5 }}` | Use the theme's `MuiCard` overrides already in `theme.js`. |
| `Eyebrow`          | `<Typography>` with `sx={{ fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}` | Or create a shared `<Eyebrow>` component. |
| `Badge` (pill)     | `<Chip size="small">` with `sx` from semantic tokens | Map `tone="warn"` to `{ bgcolor: warning.light, color: warning.dark }`, etc. |
| `Toggle`           | `<Switch>` from MUI v6 with a custom `sx` to remove the default ripple and shadow. | Knob must be perfectly vertically centered (container = knob + 4px). |
| `Stepper` (number) | Inline flex of `<IconButton>` minus / `<Typography>` value / `<IconButton>` plus, with a single border around the group, `borderRadius: 1`. |
| `Avatar`           | `<Avatar>` with `sx={{ bgcolor: '#7F9E6E', color: '#FAF8F3' }}` by default. Profile hero passes a warmer accent. |
| `PrimaryBtn`       | `<Button variant="contained">` (uses theme `primary.main`). |
| `GhostBtn`         | `<Button variant="outlined">` with `sx` adjusted for warm tokens. |
| Icon set           | Re-use MUI icons (`@mui/icons-material`) — the design's inline-SVG icon set is just a sketch; use the closest MUI equivalent and stick to one consistent stroke style. |

---

## i18n

The redesign keeps every existing translation key. New strings to add (extend `client/src/i18n/en.json` and `bn.json`):

```jsonc
{
  "dashboard": {
    "goodEvening": "Good evening",
    "planTomorrow": "Plan tomorrow",
    "cutoffClosesIn": "Cutoff for tomorrow closes in",
    "yourTomorrow": "Your tomorrow",
    "autoSaved": "auto-saved",
    "headsUp": "Heads up",
    "guestsToday": "Guests today",
    "guestsAcrossMeals": "across 3 meals",
    "rateRunning": "Predicted meal rate · running",
    "ratePerMeal": "per meal",
    "rateVsLast": "vs. {{rate}} in {{month}}",
    "rateBasis": "{{spent}} spent / {{meals}} meals served",
    "rateCycle": "Day {{day}} of {{total}} · closes {{date}}",
    "rateProjected": "Projected final"
  },
  "meal": {
    "cutoffLeft": "{{time}} left",
    "cutoffsDiffer": "cutoffs differ per meal"
  },
  "billing": {
    "previewBanner": "Preview — not yet submitted. Submitting will lock this month. Purchases and other costs can no longer be modified."
  }
}
```

Bengali equivalents: use Hind Siliguri-friendly translations; reference `data.jsx` in this bundle for the Bengali strings already drafted.

---

## Server-side additions (admin dashboard)

The Meal Rate hero needs the following fields on `GET /api/v1/dashboard/admin`:

- `predictedMealRate` (existing)
- `previousMonthRate` — last submitted `BillingCycle.mealRate`
- `totalMealsThisMonth` — sum of `MealToggle.totalPortions`
- `cycleDay`, `cycleTotal` — current day-of-month / days-in-month
- `projectedFinalRate` — add a method to `utils/billingEngine.js` that assumes remaining days average the running rate

Define `lowBalance.warn = balance < ৳100` server-side; do not compute on the client.

---

## Brand assets

Drop the contents of `brand/` into `client/public/`:

```
client/public/favicon.svg            ← brand/app-icon.svg
client/public/apple-touch-icon.png   ← brand/png/app-icon-180.png
client/public/icon-192.png           ← brand/png/app-icon-192.png
client/public/icon-512.png           ← brand/png/app-icon-512.png
client/public/mark.svg               ← brand/mark.svg
```

Update `client/public/manifest.json` (`theme_color: '#7F9E6E'`, `background_color: '#FAF8F3'`) and `client/index.html` head — see `brand/README.md` for the snippets.

In `AppLayout.jsx`, replace the current "M" placeholder with an inline 30×30 SVG of the mark — code snippet in `brand/README.md`.

---

## Acceptance criteria

- [ ] `theme.js` palette swapped to warm-neutral. Light bg `#FAF8F3`. Dark bg `#1F1E1D` (not the current cool slate).
- [ ] Every page's title + actions live in the topbar; no inline `<Typography variant="h1">` in page bodies.
- [ ] All cards use `1px solid divider` borders, `12px` radius, no shadows.
- [ ] All money uses tabular figures.
- [ ] Default `<Avatar>` is brand sage `#7F9E6E` with cream initials. The Profile-hero avatar uses the warm accent.
- [ ] Toggle knob is perfectly vertically centered; no extra border / shadow.
- [ ] Dark mode reads as a real mode (warm-neutral, Claude-style) with clear value step from page to cards.
- [ ] Sidebar logo replaced with inline-SVG Plate mark (no "M" placeholder).
- [ ] Bengali strings render correctly in Hind Siliguri (verify by switching language).
- [ ] No JS console errors on any route.

---

## Order of operations recommended

1. Update `theme.js` tokens → smoke-test that nothing crashes.
2. Replace `AppLayout.jsx` shell (sidebar + topbar) with role-aware nav, drop legacy MUI Drawer, add the inline SVG logo.
3. Migrate `Dashboard.jsx` (admin first, then user) using the new tokens.
4. Migrate `MealTogglePage.jsx` to the single-sheet pattern.
5. Migrate remaining admin pages one at a time (Set Menu → Purchases → Deposits → Billing → Stock → Members → Audit Logs).
6. Migrate the rest of the member pages (Menu, My Report, Profile, Notifications).
7. Add the server-side fields for the Meal Rate hero. Confirm the hero renders with live data.
8. Drop in `brand/` assets. Update `manifest.json` and `index.html`.
9. Smoke-test light/dark, EN/বাংলা, and all three roles end-to-end.
