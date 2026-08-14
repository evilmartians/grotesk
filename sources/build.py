"""Build script that works around toolchain issues before running gftools.

Martian Grotesk uses Glyphs 3 Smart Components which glyphsLib doesn't
fully support, and dollar/cent bracket layers whose 2-piece alt geometry
overlap-removes badly in static instances.
This script:
1. Strips the 'Group' key from smartComponentValues (not a real axis)
2. Patches glyphsLib to handle missing Smart Component masters gracefully
3. Patches ufo2ft to skip bracket-layer glyph swaps in static instances
   (variable feature-variations are unaffected — they go through a
   different code path in fontTools.varLib)

Smart component interpolation is preserved — only the 'Group' metadata
and missing-master edge cases are fixed. The original source is never modified.

Usage: python build.py [--variable-only] [--out DIR]  (run from grotesk/sources/)
"""

import argparse
import subprocess
import sys
import tempfile
import shutil
from pathlib import Path

import yaml
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


def patch_dependencies():
    """Patch glyphsLib (Smart Component edge cases) and ufo2ft (bracket swap dedup)."""
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

    # 5. ufo2ft/instantiator.py: skip bracket-layer glyph swaps for static
    # instances so they match the OLD rlig + `#ifdef VARIABLE` behaviour
    # (bracket variants only fire in the variable font, never in statics).
    #
    # Why we have to: the dollar/cent bracket layers use a 2-piece "alt"
    # currency-stroke geometry. In the variable font the renderer doesn't run
    # overlap-removal on the substituted glyph, so the two short pieces stay
    # visible and the dollar reads as "S with stems poking through". In static
    # builds gftools applies overlap-removal on the swapped-in alt geometry,
    # which unions the small pieces into the S body and collapses everything
    # to one contour — a solid blob with no visible stroke. Keeping the
    # default `_part.currency-stroke` (single full rectangle) for statics
    # gives the 3-contour outline (S body + 2 inner counters) that matches
    # the OLD font files exactly.
    #
    # Variable feature-variations are unaffected: they go through
    # fontTools.varLib._add_GSUB_feature_variations, not process_rules_swaps.
    import ufo2ft.instantiator as ufo2ft_inst
    p = Path(ufo2ft_inst.__file__)
    orig = patch_file(p,
        '                if oldName in glyphNames:\n'
        '                    swaps.append((oldName, newName))',

        '                # ' + PATCH_MARKER + ': skip BRACKET swaps in statics\n'
        '                if oldName in glyphNames and ".BRACKET." not in newName:\n'
        '                    swaps.append((oldName, newName))',
    )
    if orig:
        patches.append((p, orig))

    return patches


def restore_dependencies(patches):
    for filepath, original in patches:
        filepath.write_text(original)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--variable-only",
        action="store_true",
        help="Build only the variable font (skip static OTF/TTF and webfonts)",
    )
    parser.add_argument(
        "--out",
        default="../fonts",
        metavar="DIR",
        help="Where to write the built fonts (default: ../fonts)",
    )
    args = parser.parse_args()

    source = Path("MartianGrotesk.glyphs")
    if not source.exists():
        print(f"Error: {source} not found. Run from grotesk/sources/", file=sys.stderr)
        sys.exit(1)

    print(f"Loading {source}...")
    font = GSFont(str(source))

    print("Stripping 'Group' keys from smart component values...")
    count = strip_group_keys(font)
    print(f"  Stripped {count} entries")

    print("Patching dependencies...")
    patches = patch_dependencies()
    print(f"  Patched {len(patches)} files")

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            # gftools writes to <config dir>/../fonts, so the copy goes into a
            # "sources" subdir to keep the output inside tmpdir.
            tmp_sources = Path(tmpdir) / "sources"
            tmp_sources.mkdir()

            tmp_source = tmp_sources / source.name
            print(f"Saving to {tmp_source}...")
            font.save(str(tmp_source))

            tmp_config = tmp_sources / "config.yaml"
            if args.variable_only:
                # buildWebfont defaults to buildStatic, so disabling statics
                # also skips OTF/TTF and webfonts — only the VF is built.
                config = yaml.safe_load(Path("config.yaml").read_text())
                config["buildStatic"] = False
                tmp_config.write_text(yaml.safe_dump(config, sort_keys=False))
                print("Variable-only build: static OTF/TTF and webfonts skipped")
            else:
                shutil.copy("config.yaml", tmp_config)

            print("Running gftools builder...")
            result = subprocess.run(
                ["gftools", "builder", str(tmp_config)],
                cwd=tmp_sources,
            )

            if result.returncode == 0:
                fonts_out = Path(tmpdir) / "fonts"
                if fonts_out.exists():
                    dest = Path(args.out)
                    if args.variable_only:
                        # Replace only the subdirs gftools produced (variable/),
                        # leaving any statics already in dest untouched.
                        dest.mkdir(parents=True, exist_ok=True)
                        for sub in fonts_out.iterdir():
                            target = dest / sub.name
                            if target.exists():
                                shutil.rmtree(target)
                            shutil.move(str(sub), str(target))
                    else:
                        if dest.exists():
                            shutil.rmtree(dest)
                        shutil.copytree(fonts_out, dest)
                    shutil.rmtree(fonts_out, ignore_errors=True)
                    print(f"Fonts written to {dest.resolve()}")
                else:
                    print(f"Warning: expected output at {fonts_out} not found")

            sys.exit(result.returncode)
    finally:
        print("Restoring original dependencies...")
        restore_dependencies(patches)


if __name__ == "__main__":
    main()
