declare module "opentype.js" {
  type Font = {
    charToGlyphIndex(char: string): number;
    glyphs: {
      length: number;
      get(index: number): Glyph;
    };
    tables: Record<string, unknown>;
  };

  type Glyph = {
    name: string;
    unicode: number;
    unicodes: number[];
    path: {
      commands: unknown[];
    };
  };

  function parse(buffer: ArrayBuffer): Font;

  const opentype: { parse: typeof parse };
  export default opentype;
}
