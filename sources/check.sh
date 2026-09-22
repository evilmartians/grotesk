#!/bin/bash
# Run fontspector QA checks against the Martian Grotesk variable font.
#
# Uses the Google Fonts profile. fontspector is a standalone binary
# (install: cargo install fontspector), not part of the build venv.
#
# Extra args are forwarded to fontspector, e.g. flags:
#   sources/check.sh -l fail
# or a different target (the default variable font is then skipped):
#   sources/check.sh fonts/ttf/MartianGrotesk-Regular.ttf

set -e

command -v fontspector >/dev/null || {
    echo "fontspector not found on PATH. Install with: cargo install fontspector"
    exit 1
}

# Run from repo root so font paths resolve.
cd "$(dirname "$0")/.."

# Fall back to the variable font unless the caller named a font file themselves.
has_input=false
for arg in "$@"; do
    case "$arg" in
        *.ttf | *.otf | *.woff | *.woff2) has_input=true ;;
    esac
done

if $has_input; then
    fontspector --profile googlefonts "$@"
else
    fontspector --profile googlefonts "$@" "fonts/variable/MartianGrotesk[wdth,wght].ttf"
fi
