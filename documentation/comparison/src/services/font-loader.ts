import opentype from "opentype.js";

export async function loadFontBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return res.arrayBuffer();
}

export function getCharsetFromBuffer(buffer: ArrayBuffer): Set<number> {
  const font = opentype.parse(buffer);
  const cps = new Set<number>();
  for (let cp = 0x0020; cp <= 0xfffd; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    if (font.charToGlyphIndex(String.fromCodePoint(cp)) > 0) cps.add(cp);
  }
  return cps;
}

export type FontAxisInfo = {
  tag: string;
  min: number;
  max: number;
  default: number;
};

export type ParsedFontMeta = {
  isVariable: boolean;
  axes: FontAxisInfo[];
};

type FvarAxis = {
  tag: string;
  minValue: number;
  maxValue: number;
  defaultValue: number;
};

export function parseFontMeta(buffer: ArrayBuffer): ParsedFontMeta {
  const font = opentype.parse(buffer);
  const fvar = font.tables["fvar"] as { axes?: FvarAxis[] } | undefined;
  if (fvar?.axes) {
    return {
      isVariable: true,
      axes: fvar.axes.map((a) => ({
        tag: a.tag,
        min: a.minValue,
        max: a.maxValue,
        default: a.defaultValue,
      })),
    };
  }
  return { isVariable: false, axes: [] };
}

const FORMAT_MAP: Record<string, string> = {
  ".ttf": "truetype",
  ".otf": "opentype",
  ".woff": "woff",
  ".woff2": "woff2",
};

export function detectFontFormat(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return FORMAT_MAP[ext] ?? "truetype";
}
