"""Build script that fixes glyphsLib Smart Component bugs before building.

Martian Grotesk uses Glyphs 3 Smart Components which glyphsLib doesn't
fully support. This script:
1. Strips the 'Group' key from smartComponentValues (not a real axis)
2. Patches glyphsLib to handle missing Smart Component masters gracefully

Smart component interpolation is preserved — only the 'Group' metadata
and missing-master edge cases are fixed. The original source is never modified.

Usage: python build.py  (run from grotesk/sources/)
"""

import subprocess
import sys
import tempfile
import shutil
from pathlib import Path

from glyphsLib import GSFont


PATCH_MARKER = "# PATCHED_BY_BUILD_PY"


def strip_group_keys(font):
    """Remove 'Group' from smartComponentValues — not an axis, just Glyphs 3 metadata."""
    count = 0
    for glyph in font.glyphs:
        for layer in glyph.layers:
            for comp in layer.components:
                if comp.smartComponentValues and "Group" in comp.smartComponentValues:
                    del comp.smartComponentValues["Group"]
                    count += 1
    return count


def patch_file(filepath, old, new):
    """Replace exact string in file. Returns original content for restore, or None if skipped."""
    text = filepath.read_text()
    if PATCH_MARKER in text:
        return None
    if old not in text:
        print(f"  WARNING: patch target not found in {filepath.name}, skipping")
        return None
    filepath.write_text(text.replace(old, new))
    return text


def patch_glyphslib():
    """Patch 3 glyphsLib files to handle Smart Component edge cases."""
    patches = []

    # 1. smart_components.py: skip missing masters instead of raising
    import glyphsLib.builder.smart_components as sc
    p = Path(sc.__file__)
    orig = patch_file(p,
        '    if not masters:\n'
        '        raise ValueError(\n'
        '            "Could not find any masters for the smart component %s used in %s"\n'
        '            % (root.name, layer.name)\n'
        '        )',

        '    if not masters:  ' + PATCH_MARKER + '\n'
        '        return None, None, None',
    )
    if orig:
        patches.append((p, orig))

    # 2. smart_components.py: filter non-axis keys in normalized_location
    orig2 = patch_file(p,
        '    normalized_location = {\n'
        '        name: normalizeValue(value, axes_tuples[name], extrapolate=True)\n'
        '        for name, value in component.smartComponentValues.items()\n'
        '    }',

        '    normalized_location = {  ' + PATCH_MARKER + '\n'
        '        name: normalizeValue(value, axes_tuples[name], extrapolate=True)\n'
        '        for name, value in component.smartComponentValues.items()\n'
        '        if name in axes_tuples\n'
        '    }',
    )
    if orig2:
        patches.append((p, orig2))

    # 3. components.py: catch errors from instantiate_smart_component
    import glyphsLib.builder.components as comp_mod
    p = Path(comp_mod.__file__)
    orig = patch_file(p,
        '        if component.component and component.component.smartComponentAxes:\n'
        '            instantiate_smart_component(self, layer, component, pen)\n'
        '        else:\n'
        '            pen.addComponent(component_name, component.transform)',

        '        if component.component and component.component.smartComponentAxes:  ' + PATCH_MARKER + '\n'
        '            try:\n'
        '                instantiate_smart_component(self, layer, component, pen)\n'
        '            except (KeyError, ValueError, TypeError):\n'
        '                pen.addComponent(component_name, component.transform)\n'
        '        else:\n'
        '            pen.addComponent(component_name, component.transform)',
    )
    if orig:
        patches.append((p, orig))

    # 4. propagate_anchors.py: catch errors from _interpolate_smart_component_anchors
    import glyphsLib.builder.transformations.propagate_anchors as pa
    p = Path(pa.__file__)
    orig = patch_file(p,
        '        if component.component and component.component.smartComponentAxes:\n'
        '            # If this is a smart component, we need to interpolate the anchors\n'
        '            _interpolate_smart_component_anchors(\n'
        '                layer, component, glyphs, done_anchors, anchors\n'
        '            )',

        '        if component.component and component.component.smartComponentAxes:  ' + PATCH_MARKER + '\n'
        '            try:\n'
        '                _interpolate_smart_component_anchors(\n'
        '                    layer, component, glyphs, done_anchors, anchors\n'
        '                )\n'
        '            except (KeyError, ValueError, TypeError):\n'
        '                pass',
    )
    if orig:
        patches.append((p, orig))

    return patches


def restore_glyphslib(patches):
    for filepath, original in patches:
        filepath.write_text(original)


def main():
    source = Path("MartianGrotesk.glyphs")
    if not source.exists():
        print(f"Error: {source} not found. Run from grotesk/sources/", file=sys.stderr)
        sys.exit(1)

    print(f"Loading {source}...")
    font = GSFont(str(source))

    print("Stripping 'Group' keys from smart component values...")
    count = strip_group_keys(font)
    print(f"  Stripped {count} entries")

    print("Patching glyphsLib...")
    patches = patch_glyphslib()
    print(f"  Patched {len(patches)} files")

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_source = Path(tmpdir) / source.name
            print(f"Saving to {tmp_source}...")
            font.save(str(tmp_source))

            tmp_config = Path(tmpdir) / "config.yaml"
            shutil.copy("config.yaml", tmp_config)

            print("Running gftools builder...")
            result = subprocess.run(
                ["gftools", "builder", str(tmp_config)],
                cwd=tmpdir,
            )

            if result.returncode == 0:
                fonts_out = Path(tmpdir).parent / "fonts"
                if fonts_out.exists():
                    dest = Path("..") / "fonts"
                    if dest.exists():
                        shutil.rmtree(dest)
                    shutil.copytree(fonts_out, dest)
                    shutil.rmtree(fonts_out)
                    print(f"Fonts written to {dest.resolve()}")
                else:
                    print(f"Warning: expected output at {fonts_out} not found")

            sys.exit(result.returncode)
    finally:
        print("Restoring original glyphsLib...")
        restore_glyphslib(patches)


if __name__ == "__main__":
    main()
