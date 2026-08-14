import { atom, computed } from "nanostores";
import { getAllCodepoints, getAddedCps } from "../services/charset";

export const $fontSource = atom<"variable" | "static">("variable");
export const $staticWidthIdx = atom(2);
export const $staticWeightIdx = atom(3);
export const $weight = atom(400);
export const $width = atom(100);
export const $glyphSize = atom(32);
export const $filter = atom<"all" | "shared" | "added">("all");
export const $view = atom<"grid" | "text">("grid");
export const $previewText = atom("");
export const $fsOpen = atom(false);
export const $fsCpIdx = atom(0);
export const $fsWeight = atom(400);
export const $fsWidth = atom(100);
export const $fsGlyphSize = atom(500);
export const $fsMode = atom<"side" | "overlay">("overlay");
export const $fsOpacity = atom(50);
export const $fsBBox = atom<"off" | "on">("on");
export const $charset = atom(0);
export const $showDiff = atom(false);
export const $diffThreshold = atom(10);
export const $diffVersion = atom(0);

export const $visibleCps = computed([$filter, $charset], (filter) => {
  const all = getAllCodepoints();
  const addedCps = getAddedCps();
  return all.filter((cp) => {
    const isAdded = addedCps.has(cp);
    if (filter === "shared" && isAdded) return false;
    if (filter === "added" && !isAdded) return false;
    return true;
  });
});
