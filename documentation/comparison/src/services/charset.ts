import { $charset } from "../state/atoms";
import { loadFontBuffer, getCharsetFromBuffer } from "./font-loader";

let _allCodepoints: number[] = [];
let _onlyNew = new Set<number>();
let _refreshVer = 0;

export function getAllCodepoints(): readonly number[] {
  return _allCodepoints;
}

export function getOnlyNew(): ReadonlySet<number> {
  return _onlyNew;
}

export async function refreshCharsets(
  oldUrl: string,
  newUrl: string,
): Promise<void> {
  const ver = ++_refreshVer;

  const [oldBuf, newBuf] = await Promise.all([
    loadFontBuffer(oldUrl),
    loadFontBuffer(newUrl),
  ]);
  if (ver !== _refreshVer) return;

  const oldCps = getCharsetFromBuffer(oldBuf);
  const newCps = getCharsetFromBuffer(newBuf);

  _allCodepoints = [...new Set([...oldCps, ...newCps])].sort((a, b) => a - b);
  _onlyNew = new Set(_allCodepoints.filter((cp) => !oldCps.has(cp)));
  const shared = _allCodepoints.length - _onlyNew.size;

  document.querySelector("[data-filter='all']")!.textContent =
    `All (${_allCodepoints.length})`;
  document.querySelector("[data-filter='both']")!.textContent =
    `Shared (${shared})`;
  document.querySelector("[data-filter='new']")!.textContent =
    `New only (${_onlyNew.size})`;
  document.querySelector(".stats .old-count")!.textContent =
    `Old: ${oldCps.size} glyphs`;
  document.querySelector(".stats .new-count")!.textContent =
    `New: ${newCps.size} glyphs (+${_onlyNew.size})`;

  $charset.set($charset.get() + 1);
}
