import { define } from "nanotags";
import { slidersCtx } from "../state/context";
import {
  $fontSource,
  $staticWidthIdx,
  $staticWeightIdx,
  $weight,
  $width,
  $glyphSize,
  $view,
} from "../state/atoms";
import { updateFontFaces } from "../services/font-faces";

define("comparison-app")
  .withRefs((r) => ({
    legend: r.one("div"),
  }))
  .setup((ctx) => {
    slidersCtx.provide(ctx, { $weight, $width, $glyphSize });

    ctx.effect($fontSource, () => updateFontFaces());
    ctx.effect([$staticWidthIdx, $staticWeightIdx], () => {
      if ($fontSource.get() === "static") updateFontFaces();
    });

    const grid = ctx.host.querySelector("glyph-grid")!;
    const preview = ctx.host.querySelector("text-preview")!;

    ctx.effect($view, (view) => {
      const isGrid = view === "grid";
      ctx.refs.legend.classList.toggle("hidden", !isGrid);
      grid.classList.toggle("hidden", !isGrid);
      preview.classList.toggle("hidden", isGrid);
    });
  });
