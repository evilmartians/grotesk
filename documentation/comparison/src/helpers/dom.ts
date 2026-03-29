import type { WritableAtom } from "nanostores";

type CtxLike = {
  on(target: EventTarget, event: string, handler: (e: Event) => void): void;
  effect<T>(atom: { get(): T; subscribe(cb: (v: T) => void): () => void }, cb: (v: T) => void): void;
};

export function updateBBoxEl(bboxEl: HTMLElement, charSpan: HTMLElement): void {
  const parentRect = bboxEl.parentElement!.getBoundingClientRect();
  const charRect = charSpan.getBoundingClientRect();
  bboxEl.style.left = (charRect.left - parentRect.left) + "px";
  bboxEl.style.top = (charRect.top - parentRect.top) + "px";
  bboxEl.style.width = charRect.width + "px";
  bboxEl.style.height = charRect.height + "px";
}

export function populateSelect(
  el: HTMLSelectElement,
  items: readonly { label: string }[],
  selectedIdx: number,
): void {
  el.innerHTML = items
    .map(
      (item, i) =>
        `<option value="${i}"${i === selectedIdx ? " selected" : ""}>${item.label}</option>`,
    )
    .join("");
}

export function attachToggle(
  ctx: CtxLike,
  container: HTMLElement,
  $store: WritableAtom<string>,
  dataAttr: string,
): void {
  ctx.on(container, "click", (e: Event) => {
    const btn = (e.target as HTMLElement).closest("button");
    const val = btn?.dataset[dataAttr];
    if (val) $store.set(val);
  });
  ctx.effect($store, (val: string) => {
    container.querySelectorAll("button").forEach((b) =>
      b.classList.toggle("active", b.dataset[dataAttr] === val),
    );
  });
}
