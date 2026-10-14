#!/bin/bash
# Pulse — macOS installer (no Apple Developer account needed).
#
# Downloading with curl avoids the browser "quarantine" flag that triggers
# Gatekeeper, and an ad-hoc signature lets the unsigned app run on Apple
# Silicon. Not a substitute for notarization, but fine for internal rollout.
#
# Run:  curl -fsSL https://addpulseapp.vercel.app/install-mac.sh | bash
set -euo pipefail

URL="https://github.com/gabbygab18/pulse-app/releases/latest/download/Pulse-mac.dmg"
DMG="$(mktemp -d)/Pulse.dmg"
MNT="$(mktemp -d)"

echo "→ Downloading Pulse…"
curl -fL "$URL" -o "$DMG"

echo "→ Mounting…"
hdiutil attach "$DMG" -nobrowse -noautoopen -mountpoint "$MNT" >/dev/null

APP="$(/bin/ls -d "$MNT"/*.app | head -1)"
echo "→ Installing to /Applications…"
rm -rf "/Applications/Pulse.app"
cp -R "$APP" /Applications/
hdiutil detach "$MNT" >/dev/null

echo "→ Clearing quarantine + ad-hoc signing…"
xattr -dr com.apple.quarantine "/Applications/Pulse.app" 2>/dev/null || true
codesign --force --deep --sign - "/Applications/Pulse.app"

echo "→ Launching Pulse…"
open "/Applications/Pulse.app"
echo "✓ Done."
