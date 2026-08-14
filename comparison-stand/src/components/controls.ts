import { define } from "nanotags";
import { slidersCtx } from "../state/context";
import {
  $fontSource,
  $staticWidthIdx,
  $staticWeightIdx,
  $filter,
  $view,
  $showDiff,
  $diffThreshold,
} from "../state/atoms";
import { attachToggle, populateSelect } from "../helpers/dom";
import { $manifest } from "../services/manifest";
import { FONT_WIDTHS, FONT_WEIGHTS } from "../data/font-variants";

define("source-toggle")
  .withRefs((r) => ({
    toggle: r.one("div"),
  }))
  .setup((ctx) => {
    attachToggle(ctx, ctx.refs.toggle, $fontSource, "src");

    // A pull request preview ships the variable font only.
    ctx.effect($manifest, (manifest) => {
      const button = ctx.refs.toggle.querySelector<HTMLElement>(
        "[data-src='static']",
      );
      if (!button) return;

      const hasStatics = manifest?.hasStatics ?? false;
      button.hidden = !hasStatics;
      if (!hasStatics) $fontSource.set("variable");
    });
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

define("diff-toggle")
  .withRefs((r) => ({
    btn: r.one("button"),
    threshold: r.one("input"),
    pctLabel: r.one("span"),
  }))
  .setup((ctx) => {
    ctx.on(ctx.refs.btn, "click", () => $showDiff.set(!$showDiff.get()));
    ctx.on(ctx.refs.threshold, "change", () => {
      $diffThreshold.set(parseFloat(ctx.refs.threshold.value) || 0);
      if ($showDiff.get()) {
        $showDiff.set(false);
        $showDiff.set(true);
      }
    });
    ctx.effect($showDiff, (on) => {
      ctx.refs.btn.classList.toggle("active", on);
      ctx.refs.threshold.style.display = on ? "" : "none";
      ctx.refs.pctLabel.style.display = on ? "" : "none";
    });
  });
