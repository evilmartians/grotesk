<img src="./documentation/icon.png" width="208" height="208">

# Martian Grotesk

Martian Grotesk is a sans-serif variable typeface family with a distinctive personality. It includes 63 static styles and is variable along two axes: weight (from Thin to Ultra Black) and width (from Condensed to Ultra Expanded). Its subtly brutalist character makes it stand out visually, while styles from regular to bold are finely tuned for use in body text.

It’s especially optimized for on-screen use. Vertical metrics ensure that text labels appear vertically centered within UI elements. Character heights are aligned to the pixel grid for extra clarity and sharpness, and both PostScript and TrueType hinting are applied automatically.

<img src="./documentation/at-a-glance.png" width="830">

Also, check out Grotesk’s monospaced sibling—[Martian Mono](https://github.com/evilmartians/mono).

---

<img src="https://cdn.evilmartians.com/badges/logo-no-label.svg" alt="Evil Martians logo" width="22" height="16" /> <b>Martian Grotesk</b> is built by <b><a href="https://evilmartians.com/">Evil Martians</a></b>, an American design and engineering consultancy for <b>developer tools, AI, and cybersecurity startups</b>.

---

## Styles and weights

Martian Grotesk includes 63 static styles: [Thin—Ultra Black] × [Condensed—Ultra Expanded].

<img src="./documentation/styles-matrix.png" width="830">

Style names follow the Google Fonts naming spec.

### Weight
| Name        | `font-weight` |
|-------------|---------------|
| Thin        | 100           |
| ExtraLight  | 200           |
| Light       | 300           |
| Regular     | 400           |
| Medium      | 500           |
| Bold        | 700           |
| ExtraBold   | 800           |
| Black       | 900           |
| UltraBlack  | 1000          |

### Width
| Name           | `font-stretch` |
|----------------|----------------|
| Condensed      | 75%            |
| SemiCondensed  | 87.5%          |
| Normal         | 100%           |
| SemiExpanded   | 112.5%         |
| Expanded       | 125%           |
| ExtraExpanded  | 150%           |
| UltraExpanded  | 200%           |

## Design

### Personality

Martian Grotesk is designed for body text, but its distinct details take it a few steps beyond a neutral typeface. Features like overhanging terminals in characters such as `a`, `e`, and `s`, and monospaced-style hooks in `f`, `j`, and `t` give the text a recognizable “flavor.” This makes Martian Grotesk a strong foundation for any brand looking to stand out and be instantly recognizable.

<img src="./documentation/personality.png" width="830">

### Pixel grid optimization

The proportions of uppercase and lowercase letterforms are optimized relative to the EM box to align with the pixel grid at sizes like 10, 15, 20 pixels, and so on.

<img src="./documentation/pixel-grid.png" width="830">

### Vertical metrics for UI design

The vertical metrics across the entire family are carefully balanced to ensure text appears vertically centered within UI elements and aligns well with icons.

<img src="./documentation/vertical-metrics.png" width="830">

Check out [this X thread](https://x.com/romanshamin_en/status/1562801657691672576) on how vertical metrics can make fonts work better in design systems.

### Constant stem widths

Stem widths are specifically designed to stay consistent within each weight. For example, all Regular styles share the same stem width. This allows for shrinking or stretching letters within words without breaking visual harmony.

<img src="./documentation/constant-stems.png" width="830">

### OpenType features

<img src="./documentation/opentype-features.png" width="830">

## Web use

Variable font (recommended — covers all 63 styles in a single file):

```css
@font-face {
  font-family: "Martian Grotesk";
  font-display: swap;
  src: url("fonts/webfonts/MartianGrotesk[wdth,wght].woff2") format("woff2-variations");
  font-weight: 100 1000;
  font-stretch: 75% 200%;
}
```

Static styles ship under `fonts/ttf/`, `fonts/otf/`, and `fonts/webfonts/` (woff2) with GF-compatible filenames, e.g. `MartianGrotesk-Regular.woff2`, `MartianGroteskCondensed-Bold.woff2`, `MartianGroteskUltraExpanded-UltraBlack.woff2`.

## Build

Binaries under `fonts/` are produced by the pipeline in `sources/`:

```bash
sources/build.sh
```

The script sets up a venv with pinned `gftools` / `glyphsLib` / `fontmake` (see `sources/requirements.txt`), then runs `build.py`, which wraps `gftools builder` (`sources/config.yaml`) with two upstream workarounds — Glyphs 3 Smart Components and the static-instance bracket-layer swap for cent/dollar. The source `.glyphs` file is never mutated; the pipeline works on a temp copy. See `sources/Instructions.txt` for details.

## Language support

The typeface supports 308 languages: 297 based on the Latin script and 11 using the Cyrillic script.

<img src="./documentation/charset.png" width="830">
