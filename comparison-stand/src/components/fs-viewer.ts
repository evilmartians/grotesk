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
import { getOnlyNew } from "../services/charset";
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
    oldSide: r.one("div"),
    glyphOld: r.one("div"),
    glyphNew: r.one("div"),
    charOld: r.one("span"),
    charNew: r.one("span"),
    bboxOld: r.one("div"),
    bboxNew: r.one("div"),
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

      const ONLY_NEW = getOnlyNew();
      const isNew = ONLY_NEW.has(cp);
      const char = String.fromCodePoint(cp);
      const hex = "U+" + cp.toString(16).toUpperCase().padStart(4, "0");
      const block = getBlock(cp);

      let titleHtml =
        `${char} <span class="cp">${hex}</span><span class="block-name">${block}</span>`;
      if (isNew) titleHtml += `<span class="new-badge">NEW</span>`;
      refs.title.innerHTML = titleHtml;
      refs.blockIndex.textContent = `${idx + 1} / ${cps.length}`;

      const w = $fsWeight.get();
      const wd = $fsWidth.get();
      const vs = `"wght" ${w}, "wdth" ${wd}`;
      const size = $fsGlyphSize.get() + "px";

      refs.glyphOld.style.fontSize = size;
      refs.glyphOld.style.fontVariationSettings = vs;
      refs.glyphNew.style.fontSize = size;
      refs.glyphNew.style.fontVariationSettings = vs;

      if (isNew) {
        refs.oldSide.classList.add("unavailable");
        refs.charOld.textContent = "";
        refs.bboxOld.style.display = "none";
      } else {
        refs.oldSide.classList.remove("unavailable");
        refs.charOld.textContent = char;
        updateBBoxEl(refs.bboxOld, refs.charOld);
      }
      refs.charNew.textContent = char;
      updateBBoxEl(refs.bboxNew, refs.charNew);
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
        refs.oldSide.style.opacity = "";
      }
    });

    ctx.effect($fsOpacity, (v) => {
      refs.opacityVal.textContent = v + "%";
      refs.oldSide.style.opacity = String(v / 100);
    });
  });
