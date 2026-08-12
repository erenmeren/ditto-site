#!/usr/bin/env bash
# Grep gate. Fails a direction that prints a duration, uses banned jargon,
# uses a banned easing keyword, or reaches into a sibling direction.
set -uo pipefail

DIR="${1:?usage: check.sh <direction-dir>}"
FAIL=0

hit() { echo "FAIL [$1] $2"; FAIL=1; }

FILES=$(find "$DIR" -maxdepth 2 -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' \))
[ -z "$FILES" ] && { echo "FAIL no files under $DIR"; exit 1; }

# Durations, in digits or words. There is no sixty-second rule to print.
# The leading (^|[^0-9.]) guard keeps legitimate CSS timings out of this —
# a bare \b matches the "60s" inside "0.60s" and would fail every stylesheet.
if grep -nEi '(^|[^0-9.])(60|sixty|30|thirty|90|ninety) ?(s\b|sec|second)' $FILES; then
  hit duration "a display duration is printed"
fi

# Jargon the site never uses.
for w in '\back\b' '\backs\b' 'acknowledg' '\bTTL\b' '\bplatform\b' '\bprogrammable\b' '\bstateless\b'; do
  if grep -nEi "$w" $FILES | grep -viE 'feedback|tracking'; then hit jargon "$w"; fi
done

# Unshipped hardware.
if grep -nEi '\b(NFC|scanner|camera)\b' $FILES; then hit hardware "unshipped hardware named"; fi

# Lazy easing. Custom cubic-beziers only.
# The (^|[^-a-zA-Z]) guard matters: a bare \b treats the "ease" inside
# var(--ease-soft) as a boundary match, which would fail every transition in
# direction B, whose token is named --ease-soft. Longest alternative first so
# ease-in-out is not reported as a bare "ease".
if grep -nE '(transition|animation)[^;]*(^|[^-a-zA-Z])(ease-in-out|ease-in|ease-out|ease|linear)([^-a-zA-Z]|$)' $FILES; then
  hit easing "a default easing keyword is used"
fi

# Cross-direction references.
SELF=$(basename "$DIR")
for other in a b c; do
  [ "$other" = "$SELF" ] && continue
  if grep -nE "\.\./$other/" $FILES; then hit isolation "references ../$other/"; fi
done

# noindex is required on every page.
for f in $(find "$DIR" -maxdepth 2 -name '*.html'); do
  grep -q 'name="robots" content="noindex"' "$f" || hit noindex "$f lacks the noindex meta"
done

[ "$FAIL" -eq 0 ] && echo "OK $DIR"
exit "$FAIL"
