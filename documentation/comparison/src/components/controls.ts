import { define } from "nanotags";
import { slidersCtx } from "../state/context";
import {
  $fontSource,
  $staticWidthIdx,
  $staticWeightIdx,
  $filter,
  $view,
} from "../state/atoms";
import { attachToggle, populateSelect } from "../helpers/dom";
import { FONT_WIDTHS, FONT_WEIGHTS } from "../data/font-variants";

define("source-toggle")
  .withRefs((r) => ({
    toggle: r.one("div"),
  }))
  .setup((ctx) => {
    attachToggle(ctx, ctx.refs.toggle, $fontSource, "src");
  });

define("var-controls")
  .withContexts({ sliders: slidersCtx })
  .withRefs((r) => ({
    wghtVal: r.one("span"),
    wght: r.one("input"),
    wdthVal: r.one("span"),
    wdth: r.one("input"),
  }))
  .setup((ctx) => {
    const { $weight, $width } = ctx.contexts.sliders;
    const { refs } = ctx;

    ctx.bind($weight, refs.wght);
    ctx.bind($width, refs.wdth);

    ctx.effect($weight, (v) => { refs.wghtVal.textContent = String(v); });
    ctx.effect($width, (v) => { refs.wdthVal.textContent = String(v); });

    ctx.effect($fontSource, (src) => {
      ctx.host.classList.toggle("hidden", src === "static");
    });
  });

define("static-controls")
  .withRefs((r) => ({
    width: r.one("select"),
    weight: r.one("select"),
  }))
  .setup((ctx) => {
    const { refs } = ctx;

    populateSelect(refs.width, FONT_WIDTHS, 2);
    populateSelect(refs.weight, FONT_WEIGHTS, 3);

    ctx.bind($staticWidthIdx, refs.width);
    ctx.bind($staticWeightIdx, refs.weight);

    ctx.effect($fontSource, (src) => {
      ctx.host.classList.toggle("hidden", src !== "static");
    });
  });

define("size-control")
  .withProps((p) => ({
    min: p.number(16),
    max: p.number(72),
    step: p.number(4),
  }))
  .withContexts({ sliders: slidersCtx })
  .withRefs((r) => ({
    down: r.one("button"),
    up: r.one("button"),
    val: r.one("span"),
  }))
  .setup((ctx) => {
    const { $glyphSize } = ctx.contexts.sliders;
    const min = ctx.props.$min.get();
    const max = ctx.props.$max.get();
    const step = ctx.props.$step.get();

    ctx.on(ctx.refs.down, "click", () =>
      $glyphSize.set(Math.max(min, $glyphSize.get() - step)),
    );
    ctx.on(ctx.refs.up, "click", () =>
      $glyphSize.set(Math.min(max, $glyphSize.get() + step)),
    );

    ctx.effect($glyphSize, (v) => { ctx.refs.val.textContent = String(v); });
  });

define("filter-control")
  .withRefs((r) => ({
    buttons: r.one("div"),
  }))
  .setup((ctx) => {
    attachToggle(ctx, ctx.refs.buttons, $filter, "filter");
  });

define("view-tabs")
  .withRefs((r) => ({
    tabs: r.one("div"),
  }))
  .setup((ctx) => {
    attachToggle(ctx, ctx.refs.tabs, $view, "view");
  });
