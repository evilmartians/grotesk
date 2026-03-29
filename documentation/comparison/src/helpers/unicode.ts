import { BLOCKS } from "../data/blocks";
import { getOnlyNew } from "../services/charset";

export function getBlock(cp: number): string {
  for (const [lo, hi, name] of BLOCKS) {
    if (cp >= lo && cp <= hi) return name;
  }
  return "Other";
}

export type BlockGroup = {
  name: string;
  cps: number[];
};

export function groupByBlock(cps: readonly number[]): BlockGroup[] {
  const grouped = new Map<string, number[]>();
  for (const cp of cps) {
    const block = getBlock(cp);
    if (!grouped.has(block)) grouped.set(block, []);
    grouped.get(block)!.push(cp);
  }
  return Array.from(grouped, ([name, cps]) => ({ name, cps }));
}

export function updateCell(el: Element, cp: number): void {
  const onlyNew = getOnlyNew();
  const isNew = onlyNew.has(cp);
  const char = String.fromCodePoint(cp);
  const hex = "U+" + cp.toString(16).toUpperCase().padStart(4, "0");

  (el as HTMLElement).className = isNew ? "glyph-cell new-only" : "glyph-cell";
  (el as HTMLElement).dataset.cp = String(cp);
  el.querySelector(".glyph-cp")!.textContent = hex;

  const oldR = el.querySelector(".glyph-render.old")!;
  const newR = el.querySelector(".glyph-render.new")!;

  oldR.textContent = isNew ? "" : char;
  newR.textContent = char;
}
