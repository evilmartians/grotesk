import { define } from "nanotags";
import { renderList } from "nanotags/render";
import {
  $visibleCps,
  $fsCpIdx,
  $fsWeight,
  $fsWidth,
  $fsOpen,
  $weight,
  $width,
  $glyphSize,
  $showDiff,
  $diffVersion,
  $charset,
} from "../state/atoms";
import { getAddedCps } from "../services/charset";
import { computeDiffs, clearDiffs, getDiffCps } from "../services/diff-detector";
import { groupByBlock, updateCell } from "../helpers/unicode";

define("glyph-grid")
  .withRefs((r) => ({
    blockTpl: r.one("template"),
    cellTpl: r.one("template"),
    content: r.one("div"),
  }))
  .setup((ctx) => {
    const { refs } = ctx;

    ctx.on(refs.content, "click", (e) => {
      const cell = (e.target as HTMLElement).closest(".glyph-cell");
      if (!cell) return;
      const cp = Number((cell as HTMLElement).dataset.cp);
      const idx = $visibleCps.get().indexOf(cp);
      $fsCpIdx.set(idx >= 0 ? idx : 0);
      $fsWeight.set($weight.get());
      $fsWidth.set($width.get());
      $fsOpen.set(true);
    });

    ctx.effect($visibleCps, (cps) => {
      const addedCps = getAddedCps();
      const blocks = groupByBlock(cps);
      renderList(refs.content, refs.blockTpl, {
        data: blocks,
        key: (b) => b.name,
        update: (el, block) => {
          const addedCount = block.cps.filter((c) => addedCps.has(c)).length;
          const addedLabel =
            addedCount > 0
              ? ` <span style="color:#6e6">(+${addedCount} added)</span>`
              : "";
          el.querySelector(".block-title")!.innerHTML =
            `${block.name} <span class="count">${block.cps.length} glyphs${addedLabel}</span>`;

          renderList(el.querySelector(".glyph-grid")!, refs.cellTpl, {
            data: block.cps,
            key: (cp) => cp,
            update: (cellEl, cp) => updateCell(cellEl, cp),
          });
        },
      });
    });

    // When diff results arrive, update cell classes directly (no full re-render)
    ctx.effect($diffVersion, () => {
      const showDiff = $showDiff.get();
      const diffCps = getDiffCps();
      const addedCps = getAddedCps();
      refs.content.querySelectorAll<HTMLElement>(".glyph-cell").forEach((cell) => {
        const cp = Number(cell.dataset.cp);
        const isAdded = addedCps.has(cp);
        const isDiff = !isAdded && showDiff && diffCps.has(cp);
        cell.classList.toggle("diff", isDiff);
      });
    });

    ctx.effect([$showDiff, $charset], () => {
      if (!$showDiff.get()) { clearDiffs(); return; }
      const cps = $visibleCps.get();
      const addedCps = getAddedCps();
      const shared = new Set(cps.filter((cp: number) => !addedCps.has(cp)));
      computeDiffs(shared);
    });

    ctx.effect([$weight, $width], (w: unknown, wd: unknown) => {
      ctx.host.style.setProperty("--vs", `"wght" ${w}, "wdth" ${wd}`);
    });

    ctx.effect($glyphSize, (v) => {
      ctx.host.style.setProperty("--glyph-size", v + "px");
    });
  });
