#!/bin/bash
# Build Martian Grotesk fonts for Google Fonts.
#
# Uses build.py instead of `gftools builder config.yaml` directly
# to work around glyphsLib Smart Component bugs. See Instructions.txt.

set -e

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt
python build.py
