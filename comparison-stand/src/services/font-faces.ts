import { FONT_WIDTHS, FONT_WEIGHTS } from "../data/font-variants";
import { $fontSource, $staticWidthIdx, $staticWeightIdx } from "../state/atoms";
import { refreshCharsets } from "./charset";

type FontUrls = { old: string; new: string };

let _fontUrls: FontUrls = {
  old: "MartianGrotesk-old.ttf",
  new: "MartianGrotesk-new.ttf",
};

let _styleEl: HTMLStyleElement | null = null;

export function getFontUrls(): FontUrls {
  return _fontUrls;
}

export function setFontFaces(oldUrl: string, newUrl: string): void {
  _fontUrls = { old: oldUrl, new: newUrl };
  if (!_styleEl) {
    _styleEl = document.createElement("style");
    _styleEl.id = "dynamicFonts";
    document.head.appendChild(_styleEl);
  }
  _styleEl.textContent =
    `@font-face { font-family: "MartianOld"; src: url("/fonts/${oldUrl}") format("truetype"); font-display: swap; }
     @font-face { font-family: "MartianNew"; src: url("/fonts/${newUrl}") format("truetype"); font-display: swap; }`;
}

export function getStaticFontPaths(
  widthIdx: number,
  weightIdx: number,
): FontUrls {
  const w = FONT_WIDTHS[widthIdx]!;
  const wt = FONT_WEIGHTS[weightIdx]!;
  const oldFile = `old-ttf/MartianGrotesk-${w.old}${wt.old}.ttf`;
  const newPrefix = w.new ? `MartianGrotesk${w.new}` : "MartianGrotesk";
  const newWeight =
    w.new === "SemiExpanded" && wt.new === "UltraBlack"
      ? "ExtraBlack"
      : wt.new;
  const newFile = `new-ttf/${newPrefix}-${newWeight}.ttf`;
  return { old: oldFile, new: newFile };
}

export function updateFontFaces(): void {
  if ($fontSource.get() === "static") {
    const { old: oldFile, new: newFile } = getStaticFontPaths(
      $staticWidthIdx.get(),
      $staticWeightIdx.get(),
    );
    setFontFaces(oldFile, newFile);
  } else {
    setFontFaces("MartianGrotesk-old.ttf", "MartianGrotesk-new.ttf");
  }
  refreshCharsets(_fontUrls.old, _fontUrls.new);
}
