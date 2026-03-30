import opentype from "opentype.js";

const FONTS_BASE = "/fonts/";

export async function loadFontBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(FONTS_BASE + url);
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
