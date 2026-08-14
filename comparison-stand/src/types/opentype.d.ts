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
    advanceWidth: number;
    draw(ctx: CanvasRenderingContext2D, x: number, y: number, fontSize: number): void;
    path: {
      commands: unknown[];
      getBoundingBox(): { x1: number; y1: number; x2: number; y2: number };
    };
  };

  function parse(buffer: ArrayBuffer): Font;
  export { Font, Glyph };

  const opentype: { parse: typeof parse };
  export default opentype;
}
