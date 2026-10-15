#!/bin/bash
# «المجلس»: setup script for Claude Code on the web (claude.ai/code).
# Paste this whole file into: environment settings → Setup script. It runs as root on Ubuntu,
# must finish in about 5 minutes, and never fails the session (every step ends in || true).
#
# What it does:
#   1. Arabic fonts for rendering (Noto Naskh/Kufi/Sans Arabic). The designs also load Google Fonts
#      at render time; fonts.googleapis.com / fonts.gstatic.com are on the default "Trusted" network.
#   2. A headless Chromium for the Studio renderer (studio.mjs), tried in this order:
#      apt chromium → Playwright's Chromium → Chrome for Testing via @puppeteer/browsers.
#      Whatever works is linked to /usr/local/bin/majlis-chromium, which studio.mjs checks first.
#      UNVERIFIED in the cloud: the browser download hosts may be blocked on the "Trusted" network.
#      If nothing installs, the Studio still works: every design is kept as an HTML page and the
#      room's «المعرض» shows it live.
#   3. Pillow (optional) so image-connector results shrink to light JPEGs before they are committed.

# each step has its own budget, and the whole script stops starting new steps after ~4.5 minutes
T() { local b=$1; shift; local left=$((270 - SECONDS)); [ "$left" -le 5 ] && { echo "-- skipped (time budget)"; return 0; }; [ "$b" -gt "$left" ] && b=$left; timeout "$b" "$@" || true; }
export DEBIAN_FRONTEND=noninteractive
LINK=/usr/local/bin/majlis-chromium
echo "== majlis setup: $(date -u +%H:%M:%S)"

# ---- 1. fonts
T 45 apt-get update -qq >/dev/null 2>&1
T 50 apt-get install -y -qq --no-install-recommends fonts-noto-core fontconfig >/dev/null 2>&1
T 30 apt-get install -y -qq --no-install-recommends fonts-kacst fonts-arabeyes >/dev/null 2>&1
fc-cache -f >/dev/null 2>&1 || true

found() {
  for p in "$LINK" /usr/bin/chromium /usr/bin/chromium-browser /usr/bin/google-chrome /usr/bin/google-chrome-stable \
           $(ls -d /root/.cache/ms-playwright/chromium-*/chrome-linux*/chrome /root/.cache/ms-playwright/chromium_headless_shell-*/chrome-linux/headless_shell \
                  /root/.cache/puppeteer/chrome*/linux-*/chrome*/chrome* 2>/dev/null | sort -r); do
    if [ -x "$p" ] && "$p" --headless=new --no-sandbox --disable-gpu --dump-dom about:blank >/dev/null 2>&1; then echo "$p"; return 0; fi
  done
  return 1
}

# ---- 2. headless browser
B=$(found)
if [ -z "$B" ]; then
  echo "-- trying apt chromium"
  T 50 apt-get install -y -qq --no-install-recommends chromium >/dev/null 2>&1
  B=$(found)
fi
if [ -z "$B" ] && command -v npx >/dev/null 2>&1; then
  echo "-- trying playwright chromium"
  T 110 npx -y playwright@1.47.2 install --with-deps chromium >/dev/null 2>&1
  B=$(found)
fi
if [ -z "$B" ] && command -v npx >/dev/null 2>&1; then
  echo "-- trying chrome-headless-shell (Chrome for Testing)"
  ( cd /root && T 60 npx -y @puppeteer/browsers@2.4.0 install chrome-headless-shell@stable >/dev/null 2>&1 )
  B=$(found)
  [ -z "$B" ] && B=$(ls -d /root/chrome-headless-shell/linux-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)
fi
if [ -n "$B" ]; then
  ln -sf "$B" "$LINK" 2>/dev/null || true
  echo "studio browser: $B (linked at $LINK)"
else
  echo "studio browser: none. Studio designs will be HTML pages (the room shows them live)."
fi

# ---- 3. Pillow (optional)
T 25 python3 -m pip install -q --break-system-packages pillow >/dev/null 2>&1 || T 15 python3 -m pip install -q pillow >/dev/null 2>&1

echo "node: $(node -v 2>/dev/null) · python: $(python3 -V 2>/dev/null)"
echo "== majlis setup done: $(date -u +%H:%M:%S)"
exit 0
