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
} from "../state/atoms";
import { getOnlyNew } from "../services/charset";
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
      const ONLY_NEW = getOnlyNew();
      const blocks = groupByBlock(cps);
      renderList(refs.content, refs.blockTpl, {
        data: blocks,
        key: (b) => b.name,
        update: (el, block) => {
          const newCount = block.cps.filter((c) => ONLY_NEW.has(c)).length;
          const newLabel =
            newCount > 0
              ? ` <span style="color:#6e6">(+${newCount} new)</span>`
              : "";
          el.querySelector(".block-title")!.innerHTML =
            `${block.name} <span class="count">${block.cps.length} glyphs${newLabel}</span>`;

          renderList(el.querySelector(".glyph-grid")!, refs.cellTpl, {
            data: block.cps,
            key: (cp) => cp,
            update: (cellEl, cp) => updateCell(cellEl, cp),
          });
        },
      });
    });

    ctx.effect([$weight, $width], (w, wd) => {
      ctx.host.style.setProperty("--vs", `"wght" ${w}, "wdth" ${wd}`);
    });

    ctx.effect($glyphSize, (v) => {
      ctx.host.style.setProperty("--glyph-size", v + "px");
    });
  });
