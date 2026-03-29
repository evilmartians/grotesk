import { define } from "nanotags";
import { $fontMode, $weight, $width, $wghtAxis, $wdthAxis } from "../state/atoms";
import type { AxisRange } from "../state/atoms";
import {
  setFontFaces,
  trackBlobUrl,
  revokeAllBlobUrls,
  updateFontFaces,
} from "../services/font-faces";
import { refreshCharsets, refreshCharsetsFromBuffers } from "../services/charset";
import { parseFontMeta, type FontAxisInfo } from "../services/font-loader";

type SlotState = {
  url: string;
  buffer: ArrayBuffer | null;
  fileName: string;
  axes: FontAxisInfo[];
  isVariable: boolean;
};

const PRESET_OLD = "/fonts/MartianGrotesk-old.ttf";
const PRESET_NEW = "/fonts/MartianGrotesk-new.ttf";

const PRESET_WGHT: AxisRange = { min: 100, max: 1000, default: 400 };
const PRESET_WDTH: AxisRange = { min: 75, max: 200, default: 100 };

function makePresetSlot(url: string, fileName: string): SlotState {
  return { url, buffer: null, fileName, axes: [], isVariable: true };
}

function mergeAxis(tag: string, slots: SlotState[]): AxisRange | null {
  const matched = slots.flatMap((s) => s.axes).filter((a) => a.tag === tag);
  if (matched.length === 0) return null;
  return {
    min: Math.min(...matched.map((a) => a.min)),
    max: Math.max(...matched.map((a) => a.max)),
    default: matched[0]!.default,
  };
}

define("font-picker")
  .withRefs((r) => ({
    oldBtn: r.one("button"),
    newBtn: r.one("button"),
    oldInput: r.one("input"),
    newInput: r.one("input"),
    oldName: r.one("span"),
    newName: r.one("span"),
    resetBtn: r.one("button"),
  }))
  .setup((ctx) => {
    const { refs } = ctx;

    let oldSlot = makePresetSlot(PRESET_OLD, "MartianGrotesk-old.ttf");
    let newSlot = makePresetSlot(PRESET_NEW, "MartianGrotesk-new.ttf");

    function updateAxes(): void {
      const wght = mergeAxis("wght", [oldSlot, newSlot]);
      const wdth = mergeAxis("wdth", [oldSlot, newSlot]);
      $wghtAxis.set(wght);
      $wdthAxis.set(wdth);
      if (wght) $weight.set(Math.max(wght.min, Math.min(wght.max, wght.default)));
      if (wdth) $width.set(Math.max(wdth.min, Math.min(wdth.max, wdth.default)));
    }

    async function handleFile(slot: "old" | "new", file: File): Promise<void> {
      const buffer = await file.arrayBuffer();
      const blobUrl = URL.createObjectURL(file);
      const meta = parseFontMeta(buffer);

      trackBlobUrl(slot, blobUrl);

      const slotState: SlotState = {
        url: blobUrl,
        buffer,
        fileName: file.name,
        axes: meta.axes,
        isVariable: meta.isVariable,
      };

      if (slot === "old") {
        oldSlot = slotState;
        refs.oldName.textContent = file.name;
      } else {
        newSlot = slotState;
        refs.newName.textContent = file.name;
      }

      $fontMode.set("custom");
      setFontFaces(oldSlot.url, newSlot.url);
      updateAxes();

      if (oldSlot.buffer && newSlot.buffer) {
        refreshCharsetsFromBuffers(oldSlot.buffer, newSlot.buffer);
      } else {
        await refreshCharsets(oldSlot.url, newSlot.url);
      }
    }

    function resetToPreset(): void {
      revokeAllBlobUrls();
      oldSlot = makePresetSlot(PRESET_OLD, "MartianGrotesk-old.ttf");
      newSlot = makePresetSlot(PRESET_NEW, "MartianGrotesk-new.ttf");
      refs.oldName.textContent = oldSlot.fileName;
      refs.newName.textContent = newSlot.fileName;
      refs.oldInput.value = "";
      refs.newInput.value = "";
      $fontMode.set("preset");
      $wghtAxis.set(PRESET_WGHT);
      $wdthAxis.set(PRESET_WDTH);
      updateFontFaces();
    }

    ctx.on(refs.oldBtn, "click", () => refs.oldInput.click());
    ctx.on(refs.newBtn, "click", () => refs.newInput.click());

    ctx.on(refs.oldInput, "change", () => {
      const file = refs.oldInput.files?.[0];
      if (file) handleFile("old", file);
    });
    ctx.on(refs.newInput, "change", () => {
      const file = refs.newInput.files?.[0];
      if (file) handleFile("new", file);
    });

    ctx.on(refs.resetBtn, "click", resetToPreset);

    ctx.effect($fontMode, (mode) => {
      refs.resetBtn.classList.toggle("hidden", mode === "preset");
    });
  });
