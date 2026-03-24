#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="$(cd "$(dirname "$0")" && pwd)"

cp "$REPO_ROOT/fonts/variable/MartianGrotesk[wdth,wght].ttf" "$DEST/MartianGrotesk-new.ttf"
cp "$REPO_ROOT/fonts/ttf/"*.ttf "$DEST/new-ttf/"
