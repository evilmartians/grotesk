import { define } from "nanotags";
import { slidersCtx } from "../state/context";
import { $previewText } from "../state/atoms";
import { getOnlyNew } from "../services/charset";
import { SAMPLE_TEXTS } from "../data/sample-texts";

define("text-preview")
  .withContexts({ sliders: slidersCtx })
  .withRefs((r) => ({
    samples: r.one("select"),
    input: r.one("textarea"),
    oldPanel: r.one("div"),
    newPanel: r.one("div"),
  }))
  .setup((ctx) => {
    const { $weight, $width, $glyphSize } = ctx.contexts.sliders;
    const { refs } = ctx;

    ctx.bind($previewText, refs.input);

    ctx.on(refs.samples, "change", () => {
      const key = refs.samples.value;
      if (key && SAMPLE_TEXTS[key]) $previewText.set(SAMPLE_TEXTS[key]!);
    });

    function renderText(text: string) {
      const onlyNew = getOnlyNew();
      refs.oldPanel.textContent = text;
      const html = Array.from(text).map((ch) => {
        const cp = ch.codePointAt(0)!;
        return onlyNew.has(cp) ? `<span class="new-char">${ch}</span>` : ch;
      }).join("");
      refs.newPanel.innerHTML = html || "";
    }

    ctx.effect($previewText, renderText);

    ctx.effect([$weight, $width], (w, wd) => {
      ctx.host.style.setProperty("--vs", `"wght" ${w}, "wdth" ${wd}`);
    });

    ctx.effect($glyphSize, (v) => {
      ctx.host.style.setProperty("--glyph-size", v + "px");
    });
  });
