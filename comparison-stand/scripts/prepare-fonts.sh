#!/bin/bash
# Fill public/fonts/ with the two font sets the stand compares:
#
#   baseline  fonts committed on the reference branch (default: origin/main)
#   current   fonts built from the sources in this working tree
#
# Usage:
#   prepare-fonts.sh [--baseline REF] [--current build|full|tree]
#                    [--current-dir DIR] [--no-fetch]
#
#   --current build     build the variable font only (default, a few minutes)
#   --current full      build the whole family, statics included (slow)
#   --current tree      copy from fonts/ in this working tree, build nothing
#   --current-dir DIR   take fonts already built in DIR (DIR/variable/...),
#                       which is how CI reuses a cached build
#
# Files are renamed to fixed names (baseline.ttf, current.ttf) because the
# built name MartianGrotesk[wdth,wght].ttf has brackets, which some hosts
# and caches mangle in URLs.

set -euo pipefail

STAND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$STAND_DIR/.." && pwd)"
DEST="$STAND_DIR/public/fonts"
VF_NAME="MartianGrotesk[wdth,wght].ttf"

BASELINE_REF="origin/main"
CURRENT_MODE="build"
CURRENT_DIR=""
FETCH=1

while [ $# -gt 0 ]; do
  case "$1" in
    --baseline) BASELINE_REF="$2"; shift 2 ;;
    --current) CURRENT_MODE="$2"; shift 2 ;;
    --current-dir) CURRENT_MODE="dir"; CURRENT_DIR="$2"; shift 2 ;;
    --no-fetch) FETCH=0; shift ;;
    -h|--help) sed -n '2,22p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

case "$CURRENT_MODE" in
  build|full|tree|dir) ;;
  *) echo "--current must be build, full or tree" >&2; exit 1 ;;
esac

WITH_STATICS=0
case "$CURRENT_MODE" in
  full) WITH_STATICS=1 ;;
  tree) [ -d "$REPO_ROOT/fonts/ttf" ] && WITH_STATICS=1 ;;
  dir) [ -d "$CURRENT_DIR/ttf" ] && WITH_STATICS=1 ;;
esac

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# --- baseline: read the committed fonts out of the reference branch ---------

if [ "$FETCH" = "1" ] && [ "$BASELINE_REF" = "origin/main" ]; then
  echo "Fetching origin/main..."
  git -C "$REPO_ROOT" fetch --quiet --depth=1 origin main
  BASELINE_REF="FETCH_HEAD"
fi

BASELINE_SHA="$(git -C "$REPO_ROOT" rev-parse "$BASELINE_REF")"
BASELINE_SUBJECT="$(git -C "$REPO_ROOT" log -1 --format=%s "$BASELINE_SHA")"
BASELINE_DATE="$(git -C "$REPO_ROOT" log -1 --format=%cI "$BASELINE_SHA")"

echo "Baseline: ${BASELINE_SHA:0:7} $BASELINE_SUBJECT"

BASELINE_PATHS="fonts/variable"
if [ "$WITH_STATICS" = "1" ]; then
  BASELINE_PATHS="$BASELINE_PATHS fonts/ttf"
fi
# shellcheck disable=SC2086
git -C "$REPO_ROOT" archive "$BASELINE_SHA" $BASELINE_PATHS | tar -x -C "$TMP"

# --- current: build from the sources in this working tree ------------------

CURRENT_FONTS="$TMP/current"
[ "$CURRENT_MODE" = "dir" ] && CURRENT_FONTS="$CURRENT_DIR"

case "$CURRENT_MODE" in
  dir)
    echo "Using the fonts already built in $CURRENT_DIR"
    ;;
  build)
    echo "Building the variable font from sources (this takes a while)..."
    "$REPO_ROOT/sources/build.sh" --variable-only --out "$CURRENT_FONTS"
    ;;
  full)
    echo "Building the whole family from sources (this takes a long while)..."
    "$REPO_ROOT/sources/build.sh" --out "$CURRENT_FONTS"
    ;;
  tree)
    echo "Using the fonts already built in $REPO_ROOT/fonts"
    mkdir -p "$CURRENT_FONTS"
    cp -R "$REPO_ROOT/fonts/variable" "$CURRENT_FONTS/"
    if [ "$WITH_STATICS" = "1" ]; then
      cp -R "$REPO_ROOT/fonts/ttf" "$CURRENT_FONTS/"
    fi
    ;;
esac

if [ ! -f "$CURRENT_FONTS/variable/$VF_NAME" ]; then
  echo "Error: no variable font at $CURRENT_FONTS/variable/$VF_NAME" >&2
  exit 1
fi

# --- copy into place -------------------------------------------------------

rm -rf "$DEST"
mkdir -p "$DEST"

cp "$TMP/fonts/variable/$VF_NAME" "$DEST/baseline.ttf"
cp "$CURRENT_FONTS/variable/$VF_NAME" "$DEST/current.ttf"

if [ "$WITH_STATICS" = "1" ]; then
  mkdir -p "$DEST/baseline-ttf" "$DEST/current-ttf"
  cp "$TMP/fonts/ttf/"*.ttf "$DEST/baseline-ttf/"
  cp "$CURRENT_FONTS/ttf/"*.ttf "$DEST/current-ttf/"
fi

# --- manifest --------------------------------------------------------------

# In CI the checkout is a merge commit, so the pull request values come from
# the workflow instead of from git.
CURRENT_SHA="${PR_SHA:-$(git -C "$REPO_ROOT" rev-parse HEAD)}"
CURRENT_REF="${PR_BRANCH:-$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)}"
CURRENT_SUBJECT="${PR_SUBJECT:-$(git -C "$REPO_ROOT" log -1 --format=%s HEAD)}"
DIRTY=false
if [ -n "$(git -C "$REPO_ROOT" status --porcelain -- sources)" ]; then
  DIRTY=true
fi

cat > "$DEST/manifest.json" <<JSON
{
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "hasStatics": $([ "$WITH_STATICS" = "1" ] && echo true || echo false),
  "prNumber": ${PR_NUMBER:-null},
  "baseline": {
    "ref": "main",
    "sha": "$BASELINE_SHA",
    "subject": $(printf '%s' "$BASELINE_SUBJECT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'),
    "date": "$BASELINE_DATE"
  },
  "current": {
    "ref": "$CURRENT_REF",
    "sha": "$CURRENT_SHA",
    "subject": $(printf '%s' "$CURRENT_SUBJECT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'),
    "builtFromSources": $([ "$CURRENT_MODE" = "tree" ] && echo false || echo true),
    "sourcesDirty": $DIRTY
  }
}
JSON

echo "Ready: $DEST"
