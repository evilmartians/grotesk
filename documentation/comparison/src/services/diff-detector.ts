import { $diffVersion, $diffThreshold } from "../state/atoms";

let _diffCps = new Set<number>();
let _runId = 0;

// Phase 1: measureText at huge size to catch metric differences
const MEASURE_SIZE = 10000;
const measureCtx = document.createElement("canvas").getContext("2d")!;

// Phase 2: canvas pixel comparison for outline shape differences
const RENDER_SIZE = 256;
const FONT_PX = Math.round(RENDER_SIZE * 0.65);
const renderCanvas = document.createElement("canvas");
renderCanvas.width = RENDER_SIZE;
renderCanvas.height = RENDER_SIZE;
const renderCtx = renderCanvas.getContext("2d", { willReadFrequently: true })!;

export function getDiffCps(): ReadonlySet<number> {
  return _diffCps;
}

function hasMetricDiff(ch: string, oldFont: string, newFont: string): boolean {
  measureCtx.font = oldFont;
  const om = measureCtx.measureText(ch);
  measureCtx.font = newFont;
  const nm = measureCtx.measureText(ch);

  return (
    Math.abs(om.width - nm.width) > 1 ||
    Math.abs(om.actualBoundingBoxLeft - nm.actualBoundingBoxLeft) > 1 ||
    Math.abs(om.actualBoundingBoxRight - nm.actualBoundingBoxRight) > 1 ||
    Math.abs(om.actualBoundingBoxAscent - nm.actualBoundingBoxAscent) > 1 ||
    Math.abs(om.actualBoundingBoxDescent - nm.actualBoundingBoxDescent) > 1
  );
}

function getAlpha(font: string, ch: string): Uint8ClampedArray {
  renderCtx.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE);
  renderCtx.font = font;
  renderCtx.fillText(ch, RENDER_SIZE * 0.15, RENDER_SIZE * 0.75);
  return renderCtx.getImageData(0, 0, RENDER_SIZE, RENDER_SIZE).data;
}

function pixelDiffPct(
  oldFont: string,
  newFont: string,
  ch: string,
): number {
  const a = getAlpha(oldFont, ch);
  const b = getAlpha(newFont, ch);
  const totalPixels = RENDER_SIZE * RENDER_SIZE;
  let diffCount = 0;
  for (let j = 3; j < a.length; j += 4) {
    if (Math.abs(a[j]! - b[j]!) > 8) diffCount++;
  }
  return (diffCount / totalPixels) * 100;
}

export async function computeDiffs(
  sharedCps: ReadonlySet<number>,
): Promise<void> {
  const id = ++_runId;
  const diffs = new Set<number>();
  const threshold = $diffThreshold.get();

  const oldMeasure = `${MEASURE_SIZE}px "MartianOld"`;
  const newMeasure = `${MEASURE_SIZE}px "MartianNew"`;
  const oldRender = `${FONT_PX}px "MartianOld"`;
  const newRender = `${FONT_PX}px "MartianNew"`;

  await document.fonts.ready;
  if (id !== _runId) return;

  const cps = [...sharedCps];
  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i]!;
    const ch = String.fromCodePoint(cp);

    // Phase 1: fast metric check (catches bbox/spacing diffs like ŀ)
    if (hasMetricDiff(ch, oldMeasure, newMeasure)) {
      diffs.add(cp);
    } else if (threshold < 100) {
      // Phase 2: pixel comparison for outline shape diffs
      const pct = pixelDiffPct(oldRender, newRender, ch);
      if (pct > threshold) diffs.add(cp);
    }

    if (i % 50 === 49) {
      await new Promise((r) => setTimeout(r, 0));
      if (id !== _runId) return;
    }
  }

  if (id !== _runId) return;
  _diffCps = diffs;
  console.log(`[diff] ${diffs.size} diffs out of ${cps.length} shared (threshold: ${threshold}%)`);
  $diffVersion.set($diffVersion.get() + 1);
}

export function clearDiffs(): void {
  ++_runId;
  _diffCps = new Set();
  $diffVersion.set($diffVersion.get() + 1);
}
