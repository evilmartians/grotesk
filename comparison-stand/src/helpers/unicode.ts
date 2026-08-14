import { BLOCKS } from "../data/blocks";
import { getAddedCps } from "../services/charset";
import { getDiffCps } from "../services/diff-detector";
import { $showDiff } from "../state/atoms";

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
  const addedCps = getAddedCps();
  const isAdded = addedCps.has(cp);
  const char = String.fromCodePoint(cp);
  const hex = "U+" + cp.toString(16).toUpperCase().padStart(4, "0");

  const isDiff = !isAdded && $showDiff.get() && getDiffCps().has(cp);
  let cls = "glyph-cell";
  if (isAdded) cls += " added";
  else if (isDiff) cls += " diff";
  (el as HTMLElement).className = cls;
  (el as HTMLElement).dataset.cp = String(cp);
  el.querySelector(".glyph-cp")!.textContent = hex;

  const baselineR = el.querySelector(".glyph-render.baseline")!;
  const currentR = el.querySelector(".glyph-render.current")!;

  baselineR.textContent = isAdded ? "" : char;
  currentR.textContent = char;
}
