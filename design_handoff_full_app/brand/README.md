# Meal Easy · Brand assets

The chosen mark is **Option A · Plate** — a sage plate seen from above with a darker food portion and a small garnish dot. Slightly rounded, friendly, food-evocative at any size.

## Colors

| Token         | Value     | Use                                        |
| ------------- | --------- | ------------------------------------------ |
| Sage          | `#7F9E6E` | Plate (primary brand colour)               |
| Sage Deep     | `#5A7140` | Food portion / wordmark accent on dark     |
| Ink           | `#1F1B17` | Garnish dot, type, mono mark               |
| Cream         | `#FAF8F3` | Background, plate inner rim                |
| Orange (dark) | `#E59669` | Replaces sage on the dark app-icon variant |

## Wordmark

Typeface: **DM Sans**. "Meal" is 600 weight, "Easy" is 500 italic in Sage (`#7F9E6E`). Tight letter-spacing (`-0.025em`).

## SVG sources

| File                    | What it is                                          |
| ----------------------- | --------------------------------------------------- |
| `mark.svg`              | Mark only, transparent background                   |
| `app-icon.svg`          | Mark inside the cream rounded square (primary)      |
| `app-icon-dark.svg`     | Inverted variant for dark contexts                  |
| `mark-mono.svg`         | Single-ink version for print, embossing, fax        |
| `mark-on-dark.svg`      | Cream-on-ink, transparent bg                        |
| `wordmark.svg`          | Type only                                           |
| `lockup.svg`            | Mark + wordmark, horizontal                         |

All SVGs use a 100×100 viewBox so they scale to any size. Inline them in code; do not rasterise.

## PNG exports

In `png/`:

| File                          | Size   | Use                                       |
| ----------------------------- | ------ | ----------------------------------------- |
| `app-icon-1024.png`           | 1024   | App Store / Play Store master             |
| `app-icon-512.png`            | 512    | PWA `manifest.json` (`icon-512`)          |
| `app-icon-256.png`            | 256    | High-DPI                                  |
| `app-icon-192.png`            | 192    | PWA `manifest.json` (`icon-192`)          |
| `app-icon-180.png`            | 180    | iOS `apple-touch-icon`                    |
| `app-icon-128.png`            | 128    | Chrome Web Store, small devices           |
| `app-icon-dark-{1024,512,256}.png` | various | Dark variant for adaptive/dark icons |
| `favicon-{16,32,48}.png`      | 16–48  | Browser tab. Combine into `favicon.ico`.  |
| `mark-{128,256,512}.png`      | 128–512 | Standalone mark on transparent bg         |

## Drop into the codebase

**Client (`client/public/`):**

```
favicon.svg            ← copy of app-icon.svg, renamed
apple-touch-icon.png   ← app-icon-180.png
icon-192.png           ← app-icon-192.png
icon-512.png           ← app-icon-512.png
mark.svg               ← brand/mark.svg
```

Then update `client/public/manifest.json`:

```jsonc
{
  "name": "Meal Easy",
  "short_name": "MealEasy",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "theme_color": "#7F9E6E",
  "background_color": "#FAF8F3"
}
```

And in `client/index.html` `<head>`:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#7F9E6E" />
```

## In-app usage

In the sidebar/header where the placeholder "M" lives today (`client/src/components/layout/AppLayout.jsx`), replace it with an inline SVG sized 30×30:

```jsx
<Box sx={{ width: 30, height: 30, borderRadius: 1.25, bgcolor: 'background.default', display: 'grid', placeItems: 'center' }}>
  <svg width="24" height="24" viewBox="0 0 100 100">
    <circle cx="50" cy="52" r="34" fill="#7F9E6E"/>
    <circle cx="50" cy="52" r="29" fill="#FFFFFF"/>
    <circle cx="55" cy="55" r="17" fill="#5A7140"/>
    <circle cx="38" cy="42" r="3.5" fill="#1F1B17"/>
  </svg>
</Box>
```

In the dark theme, swap the inner `fill="#FFFFFF"` for the surface token so the rim matches the background.

## Push notifications

Use `mark-192.png` (or `app-icon-192.png`) for the push notification icon — VAPID payload's `icon` field.

## PDF reports

In `server/src/utils/reportTemplate.js`, the header should embed the lockup. Inline the `lockup.svg` markup directly in the HTML template — Puppeteer renders SVG fine.
