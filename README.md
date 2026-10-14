# Pulse

Desktop time-tracking widget for Isla staff — an always-on-top floating widget
(like Orbit/Hubstaff) that **periodically captures the screen** (and optionally
records short clips) and **uploads them to the Isla Portal** while a staff
member is clocked in. Cross-platform: **Windows, macOS, Linux**. Standalone app
— it talks to the portal only over HTTPS, nothing else to run locally.

## How it works

1. Staff signs in with their **portal email + password**. The app exchanges
   them for a bearer token (`POST /api/agent/login`) and stores it in
   `userData/config.json`.
2. **Clock in** creates a running `Shift` in the portal (shared with the web
   portal timesheet). Capture starts immediately.
3. Every ~10 min (with jitter) the main process grabs a full-screen PNG and
   `POST`s it to `/api/agent/upload`.
4. **Clock out** completes the shift. Per Isla's requirement, **capture keeps
   running after clock-out** — it stops only on sign-out or quit. The widget
   shows a red dot + banner whenever capture is active so staff are always aware.
5. Screenshots are viewable in the portal, scoped by role: **admin** sees all,
   **manager** their staff, **client** their placed staff, **staff** their own
   (`GET /api/agent/screenshots`).

## Run (dev)

```bash
npm install
npm start
```

## Build installers

```bash
npm run dist          # current OS
```

Produces NSIS (Windows), DMG (macOS), AppImage (Linux) in `dist/`.

### macOS permission

macOS gates screen capture behind TCC. On first capture the OS prompts for
**Screen Recording** permission (System Settings → Privacy & Security → Screen
Recording). The app must be allowed there or screenshots come back blank.
For signed/notarized distribution, sign with a Developer ID and the
`com.apple.security.device.screen-capture`-adjacent entitlements.

## UI

The widget renderer is a Vite + React 19 + Tailwind 4 app that reuses **Glint
UI** components and the **avatar engine** vendored from `avatar-app`
(`renderer/src/components/glint`, `renderer/src/avatar`). Each staff member gets
a deterministic animated avatar seeded from their email.

## Reliability

Uploads go through a **persistent on-disk queue** (`userData/queue`): every
capture is written there first, then drained to the portal. If the network or
portal is down the item stays queued and a retry timer (`retryMs`, default 30s)
clears the backlog once reachable — nothing is dropped, and the queue survives
restarts. The widget shows the queued count while offline.

## Portal side (lives in the `isla-react-laravel` repo)

| File | Purpose |
|------|---------|
| `database/migrations/2026_10_14_000001_create_screen_tracking.php` | `users.api_token` + `screenshots` table |
| `app/Models/Screenshot.php` | screenshot/recording record |
| `app/Http/Middleware/AuthenticateAgent.php` | bearer-token auth (widget) |
| `app/Http/Controllers/Api/AgentController.php` | login, clock in/out, upload, list |
| `app/Http/Controllers/ScreenshotViewController.php` | role-scoped browse page |
| `resources/js/components/ScreenshotGallery.jsx` | gallery (filters, lightbox) |
| `resources/js/Pages/{Admin,Manager,Portal,Staff}/Screens.jsx` | per-role pages |
| `routes/api.php` | `/api/agent/*` (widget) |
| `routes/web.php` | `/{admin,manager,portal,staff}/screens` (browse) |
| `app/Models/User.php` | `api_token`, `visibleStaffIds()` scoping |

Deploy: `php artisan migrate && php artisan storage:link`.

The browse pages are reachable at `/admin/screens`, `/manager/screens`,
`/portal/screens`, `/staff/screens`. Add a nav link in each role's layout/nav
component to surface them (one `<Link>` each — not done automatically).

## Code signing (macOS / Windows)

`build/entitlements.mac.plist` + `build/notarize.js` are wired into
electron-builder. Signing/notarization run only when the env vars are set, so
local and Linux/Windows builds still work unsigned:

- **macOS:** `CSC_LINK` + `CSC_KEY_PASSWORD` (Developer ID cert), then
  `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` to notarize.
  `npm i -D @electron/notarize` to enable the notarize step.
- **Windows:** `CSC_LINK` + `CSC_KEY_PASSWORD` (code-signing cert).

## Config

`userData/config.json`:

- `captureIntervalMs` — screenshot cadence (default 10 min).
- `keepCapturingAfterClockOut` — default `true` (Isla requirement).
- `apiUrl` — portal base URL (set on the sign-in screen).
# pulse-app
