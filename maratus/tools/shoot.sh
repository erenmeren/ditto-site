#!/usr/bin/env bash
# Screenshot one page under the three browser conditions that matter and the
# three widths we support. The reduced-motion and no-JS profiles are real:
# they were proven with a colour probe before this script was written.
#
#   ./shoot.sh a /tmp/shots        -> shoots maratus/a/index.html
#   ./shoot.sh . /tmp/shots        -> shoots maratus/index.html
set -euo pipefail

TARGET="${1:?usage: shoot.sh <path-under-maratus> <outdir>}"
OUT="${2:?usage: shoot.sh <path-under-maratus> <outdir>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-8940}"
PROFS="$(mktemp -d)"

mkdir -p "$OUT"

# One profile per condition. user.js is read at profile start.
mkdir -p "$PROFS/plain" "$PROFS/rm" "$PROFS/nojs"
echo 'user_pref("ui.prefersReducedMotion", 1);' > "$PROFS/rm/user.js"
echo 'user_pref("javascript.enabled", false);'  > "$PROFS/nojs/user.js"

python3 -m http.server "$PORT" --directory "$ROOT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true; rm -rf "$PROFS"' EXIT
sleep 2

URL="http://localhost:$PORT/${TARGET#./}/index.html"
URL="${URL//\/\/index.html/\/index.html}"

shoot() { # profile  width  height  name
  timeout 120 firefox --headless --profile "$PROFS/$1" \
    --window-size="$2,$3" --screenshot "$OUT/$4.png" "$URL" >/dev/null 2>&1 || true
  if [ ! -s "$OUT/$4.png" ]; then echo "FAIL: no screenshot for $4" >&2; exit 1; fi
}

shoot plain 1440 2600 plain-1440
shoot plain  768 2600 plain-768
shoot plain  390 2600 plain-390
shoot rm    1440 2600 rm-1440
shoot nojs  1440 2600 nojs-1440

echo "shot $URL"
magick identify "$OUT"/*.png | sed 's/^/  /'
