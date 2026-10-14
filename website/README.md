# Pulse — Website

Standalone **Next.js 15 + React 19** download/install site for the Pulse
desktop app. Independent of the Electron app — deploy anywhere (Vercel, Node
host, static export).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Structure

| Path | What |
|------|------|
| `app/page.tsx` | Landing: hero, features, screenshots, install steps, transparency note |
| `app/layout.tsx`, `app/globals.css` | Dark Orbit-style theme (Tailwind v4 tokens) |
| `components/Download.tsx` | OS-aware download buttons (client) |
| `components/Shots.tsx` | Screenshot gallery + lightbox (client) |
| `components/Logo.tsx` | Inline SVG app mark |
| `public/shots/*.png` | Real captures of the widget (login / on-the-clock / offline) |
| `public/downloads/IslaTracker-win-x64.zip` | Portable Windows build |

## Updating the download

Rebuild the app, then re-zip:

```bash
# from the app repo root
npm run build:renderer
# repackage (needs Developer Mode on Windows for the signed installer),
# or zip the portable build:
powershell -Command "Compress-Archive -Path dist/win-unpacked/* -DestinationPath website/public/downloads/IslaTracker-win-x64.zip -Force"
```

Swap in the macOS `.dmg` under `public/downloads/` and flip the macOS button in
`components/Download.tsx` from disabled to a link once you have a signed build.
