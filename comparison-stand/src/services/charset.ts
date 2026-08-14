import { $charset } from "../state/atoms";
import type { FontUrls } from "./font-faces";
import { loadFontBuffer, getCharsetFromBuffer } from "./font-loader";

let _allCodepoints: number[] = [];
let _addedCps = new Set<number>();
let _refreshVer = 0;

export function getAllCodepoints(): readonly number[] {
  return _allCodepoints;
}

export function getAddedCps(): ReadonlySet<number> {
  return _addedCps;
}

function setText(selector: string, text: string): void {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

export async function refreshCharsets(urls: FontUrls): Promise<void> {
  const ver = ++_refreshVer;

  const [baselineBuf, currentBuf] = await Promise.all([
    loadFontBuffer(urls.baseline),
    loadFontBuffer(urls.current),
  ]);
  if (ver !== _refreshVer) return;

  const baselineCps = getCharsetFromBuffer(baselineBuf);
  const currentCps = getCharsetFromBuffer(currentBuf);

  _allCodepoints = [...new Set([...baselineCps, ...currentCps])].sort(
    (a, b) => a - b,
  );
  _addedCps = new Set(_allCodepoints.filter((cp) => !baselineCps.has(cp)));
  const shared = _allCodepoints.length - _addedCps.size;

  setText("[data-filter='all']", `All (${_allCodepoints.length})`);
  setText("[data-filter='shared']", `Shared (${shared})`);
  setText("[data-filter='added']", `Added (${_addedCps.size})`);
  setText(".stats .baseline-count", `main: ${baselineCps.size} glyphs`);
  setText(
    ".stats .current-count",
    `this branch: ${currentCps.size} glyphs (+${_addedCps.size})`,
  );

  $charset.set($charset.get() + 1);
}
