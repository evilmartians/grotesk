import { FONT_WIDTHS, FONT_WEIGHTS } from "../data/font-variants";
import { $fontMode, $fontSource, $staticWidthIdx, $staticWeightIdx } from "../state/atoms";
import { refreshCharsets } from "./charset";
import { detectFontFormat } from "./font-loader";

type FontUrls = { old: string; new: string };

let _fontUrls: FontUrls = {
  old: "/fonts/MartianGrotesk-old.ttf",
  new: "/fonts/MartianGrotesk-new.ttf",
};

let _styleEl: HTMLStyleElement | null = null;
let _oldBlobUrl: string | null = null;
let _newBlobUrl: string | null = null;

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
  const oldFmt = detectFontFormat(oldUrl);
  const newFmt = detectFontFormat(newUrl);
  _styleEl.textContent =
    `@font-face { font-family: "BaseFont"; src: url("${oldUrl}") format("${oldFmt}"); font-display: swap; }
     @font-face { font-family: "CompareFont"; src: url("${newUrl}") format("${newFmt}"); font-display: swap; }`;
}

export function trackBlobUrl(slot: "old" | "new", url: string): void {
  if (slot === "old") {
    if (_oldBlobUrl) URL.revokeObjectURL(_oldBlobUrl);
    _oldBlobUrl = url;
  } else {
    if (_newBlobUrl) URL.revokeObjectURL(_newBlobUrl);
    _newBlobUrl = url;
  }
}

export function revokeAllBlobUrls(): void {
  if (_oldBlobUrl) { URL.revokeObjectURL(_oldBlobUrl); _oldBlobUrl = null; }
  if (_newBlobUrl) { URL.revokeObjectURL(_newBlobUrl); _newBlobUrl = null; }
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
  if ($fontMode.get() === "custom") return;

  if ($fontSource.get() === "static") {
    const { old: oldFile, new: newFile } = getStaticFontPaths(
      $staticWidthIdx.get(),
      $staticWeightIdx.get(),
    );
    setFontFaces("/fonts/" + oldFile, "/fonts/" + newFile);
  } else {
    setFontFaces("/fonts/MartianGrotesk-old.ttf", "/fonts/MartianGrotesk-new.ttf");
  }
  refreshCharsets(_fontUrls.old, _fontUrls.new);
}
