import { FONT_WIDTHS, FONT_WEIGHTS } from "../data/font-variants";
import { $fontSource, $staticWidthIdx, $staticWeightIdx } from "../state/atoms";
import { refreshCharsets } from "./charset";

export type FontUrls = { baseline: string; current: string };

const VARIABLE_URLS: FontUrls = {
  baseline: "baseline.ttf",
  current: "current.ttf",
};

let _fontUrls = VARIABLE_URLS;
let _styleEl: HTMLStyleElement | null = null;

export function getFontUrls(): FontUrls {
  return _fontUrls;
}

export function setFontFaces(urls: FontUrls): void {
  _fontUrls = urls;
  if (!_styleEl) {
    _styleEl = document.createElement("style");
    _styleEl.id = "dynamicFonts";
    document.head.appendChild(_styleEl);
  }
  _styleEl.textContent =
    `@font-face { font-family: "MartianBaseline"; src: url("/fonts/${urls.baseline}") format("truetype"); font-display: swap; }
     @font-face { font-family: "MartianCurrent"; src: url("/fonts/${urls.current}") format("truetype"); font-display: swap; }`;
}

export function getStaticFontPaths(
  widthIdx: number,
  weightIdx: number,
): FontUrls {
  const width = FONT_WIDTHS[widthIdx];
  const weight = FONT_WEIGHTS[weightIdx];
  if (!width || !weight) {
    throw new Error(`No style at width ${widthIdx}, weight ${weightIdx}`);
  }

  // The build names this single style ExtraBlack; every other width uses
  // UltraBlack for the same weight.
  const weightName =
    width.name === "SemiExpanded" && weight.name === "UltraBlack"
      ? "ExtraBlack"
      : weight.name;
  const file = `MartianGrotesk${width.name}-${weightName}.ttf`;

  return { baseline: `baseline-ttf/${file}`, current: `current-ttf/${file}` };
}

export function updateFontFaces(): Promise<void> {
  const urls =
    $fontSource.get() === "static"
      ? getStaticFontPaths($staticWidthIdx.get(), $staticWeightIdx.get())
      : VARIABLE_URLS;

  setFontFaces(urls);
  return refreshCharsets(urls);
}
