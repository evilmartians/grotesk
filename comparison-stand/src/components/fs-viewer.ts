import { define } from "nanotags";
import { slidersCtx } from "../state/context";
import {
  $fontSource,
  $staticWidthIdx,
  $staticWeightIdx,
  $visibleCps,
  $fsCpIdx,
  $fsWeight,
  $fsWidth,
  $fsGlyphSize,
  $fsOpen,
  $fsMode,
  $fsOpacity,
  $fsBBox,
  $charset,
} from "../state/atoms";
import { getAddedCps } from "../services/charset";
import { attachToggle, updateBBoxEl } from "../helpers/dom";
import { getBlock } from "../helpers/unicode";

define("fs-viewer")
  .withRefs((r) => ({
    overlay: r.one("div"),
    title: r.one("div"),
    closeBtn: r.one("button"),
    modeToggle: r.one("div"),
    opacityGroup: r.one("div"),
    opacity: r.one("input"),
    opacityVal: r.one("span"),
    prevBtn: r.one("button"),
    nextBtn: r.one("button"),
    blockIndex: r.one("span"),
    body: r.one("div"),
    baselineSide: r.one("div"),
    glyphBaseline: r.one("div"),
    glyphCurrent: r.one("div"),
    charBaseline: r.one("span"),
    charCurrent: r.one("span"),
    bboxBaseline: r.one("div"),
    bboxCurrent: r.one("div"),
    bboxToggle: r.one("div"),
    legend: r.one("div"),
  }))
  .setup((ctx) => {
    const { refs } = ctx;

    slidersCtx.provide(ctx, {
      $weight: $fsWeight,
      $width: $fsWidth,
      $glyphSize: $fsGlyphSize,
    });

    function renderGlyph() {
      const cps = $visibleCps.get();
      const idx = $fsCpIdx.get();
      const cp = cps[idx];
      if (cp === undefined) return;

      const ADDED_CPS = getAddedCps();
      const isAdded = ADDED_CPS.has(cp);
      const char = String.fromCodePoint(cp);
      const hex = "U+" + cp.toString(16).toUpperCase().padStart(4, "0");
      const block = getBlock(cp);

      let titleHtml =
        `${char} <span class="cp">${hex}</span><span class="block-name">${block}</span>`;
      if (isAdded) titleHtml += `<span class="added-badge">ADDED</span>`;
      refs.title.innerHTML = titleHtml;
      refs.blockIndex.textContent = `${idx + 1} / ${cps.length}`;

      const w = $fsWeight.get();
      const wd = $fsWidth.get();
      const vs = `"wght" ${w}, "wdth" ${wd}`;
      const size = $fsGlyphSize.get() + "px";

      refs.glyphBaseline.style.fontSize = size;
      refs.glyphBaseline.style.fontVariationSettings = vs;
      refs.glyphCurrent.style.fontSize = size;
      refs.glyphCurrent.style.fontVariationSettings = vs;

      if (isAdded) {
        refs.baselineSide.classList.add("unavailable");
        refs.charBaseline.textContent = "";
        refs.bboxBaseline.style.display = "none";
      } else {
        refs.baselineSide.classList.remove("unavailable");
        refs.charBaseline.textContent = char;
        updateBBoxEl(refs.bboxBaseline, refs.charBaseline);
      }
      refs.charCurrent.textContent = char;
      updateBBoxEl(refs.bboxCurrent, refs.charCurrent);
    }

    function navigate(dir: number) {
      const cps = $visibleCps.get();
      $fsCpIdx.set(($fsCpIdx.get() + dir + cps.length) % cps.length);
    }

    ctx.on(refs.closeBtn, "click", () => $fsOpen.set(false));
    ctx.on(refs.prevBtn, "click", () => navigate(-1));
    ctx.on(refs.nextBtn, "click", () => navigate(1));

    ctx.on(document, "keydown", (e) => {
      if (!$fsOpen.get()) return;
      if (e.key === "Escape") $fsOpen.set(false);
      if (e.key === "ArrowLeft") { navigate(-1); e.preventDefault(); }
      if (e.key === "ArrowRight") { navigate(1); e.preventDefault(); }
    });

    attachToggle(ctx, refs.modeToggle, $fsMode, "mode");
    attachToggle(ctx, refs.bboxToggle, $fsBBox, "bbox");

    ctx.bind($fsOpacity, refs.opacity);

    ctx.effect($fsOpen, (open) => {
      refs.overlay.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
      if (open) renderGlyph();
    });

    ctx.effect([$fsCpIdx, $fsWeight, $fsWidth, $fsGlyphSize], () => {
      if ($fsOpen.get()) renderGlyph();
    });

    ctx.effect($charset, () => {
      if ($fsOpen.get()) renderGlyph();
    });

    ctx.effect([$fontSource, $staticWidthIdx, $staticWeightIdx], () => {
      if (!$fsOpen.get()) return;
      document.fonts.ready.then(() => {
        if ($fsOpen.get()) renderGlyph();
      });
    });

    ctx.effect($fsBBox, (val) => {
      refs.body.classList.toggle("show-bbox", val === "on");
      if ($fsOpen.get()) renderGlyph();
    });

    ctx.effect($fsMode, (mode) => {
      if (mode === "overlay") {
        refs.body.classList.add("overlay-mode");
        refs.legend.classList.add("visible");
        refs.opacityGroup.style.display = "";
      } else {
        refs.body.classList.remove("overlay-mode");
        refs.legend.classList.remove("visible");
        refs.opacityGroup.style.display = "none";
        refs.baselineSide.style.opacity = "";
      }
    });

    ctx.effect($fsOpacity, (v) => {
      refs.opacityVal.textContent = v + "%";
      refs.baselineSide.style.opacity = String(v / 100);
    });
  });
