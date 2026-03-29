import { atom, computed } from "nanostores";
import { getAllCodepoints, getOnlyNew } from "../services/charset";

export const $fontSource = atom<"variable" | "static">("variable");
export const $staticWidthIdx = atom(2);
export const $staticWeightIdx = atom(3);
export const $weight = atom(400);
export const $width = atom(100);
export const $glyphSize = atom(32);
export const $filter = atom<"all" | "both" | "new">("all");
export const $view = atom<"grid" | "text">("grid");
export const $previewText = atom("");
export const $fsOpen = atom(false);
export const $fsCpIdx = atom(0);
export const $fsWeight = atom(400);
export const $fsWidth = atom(100);
export const $fsGlyphSize = atom(500);
export const $fsMode = atom<"side" | "overlay">("overlay");
export const $fsOpacity = atom(50);
export const $fsBBox = atom<"off" | "on">("off");
export const $charset = atom(0);

export const $visibleCps = computed([$filter, $charset], (filter) => {
  const all = getAllCodepoints();
  const onlyNew = getOnlyNew();
  return all.filter((cp) => {
    const isNew = onlyNew.has(cp);
    if (filter === "both" && isNew) return false;
    if (filter === "new" && !isNew) return false;
    return true;
  });
});
