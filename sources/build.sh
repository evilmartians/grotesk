#!/bin/bash
# Build Martian Grotesk fonts for Google Fonts.
#
# Uses build.py instead of `gftools builder config.yaml` directly
# to work around glyphsLib Smart Component bugs. See Instructions.txt.
#
# Pass --variable-only to build just the variable font (skips statics/webfonts).
# Pass --out DIR to write somewhere else than ../fonts. A relative DIR is
# resolved against this directory.
#
# Set PYTHON to pick the interpreter for the venv (default: python3).

set -e

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    "${PYTHON:-python3}" -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt
python build.py "$@"
