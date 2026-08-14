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

function metricDiffPct(ch: string, baselineFont: string, currentFont: string): number {
  measureCtx.font = baselineFont;
  const om = measureCtx.measureText(ch);
  measureCtx.font = currentFont;
  const nm = measureCtx.measureText(ch);

  const maxDelta = Math.max(
    Math.abs(om.width - nm.width),
    Math.abs(om.actualBoundingBoxLeft - nm.actualBoundingBoxLeft),
    Math.abs(om.actualBoundingBoxRight - nm.actualBoundingBoxRight),
    Math.abs(om.actualBoundingBoxAscent - nm.actualBoundingBoxAscent),
    Math.abs(om.actualBoundingBoxDescent - nm.actualBoundingBoxDescent),
  );
  return (maxDelta / MEASURE_SIZE) * 100;
}

function getAlpha(font: string, ch: string): Uint8ClampedArray {
  renderCtx.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE);
  renderCtx.font = font;
  renderCtx.fillText(ch, RENDER_SIZE * 0.15, RENDER_SIZE * 0.75);
  return renderCtx.getImageData(0, 0, RENDER_SIZE, RENDER_SIZE).data;
}

function pixelDiffPct(
  baselineFont: string,
  currentFont: string,
  ch: string,
): number {
  const a = getAlpha(baselineFont, ch);
  const b = getAlpha(currentFont, ch);
  let diffCount = 0;
  let unionCount = 0;
  for (let j = 3; j < a.length; j += 4) {
    const ao = a[j]!;
    const bo = b[j]!;
    if (ao > 16 || bo > 16) unionCount++;
    if (Math.abs(ao - bo) > 8) diffCount++;
  }
  if (unionCount === 0) return 0;
  return (diffCount / unionCount) * 100;
}

export async function computeDiffs(
  sharedCps: ReadonlySet<number>,
): Promise<void> {
  const id = ++_runId;
  const diffs = new Set<number>();
  const threshold = $diffThreshold.get();

  const baselineMeasure = `${MEASURE_SIZE}px "MartianBaseline"`;
  const currentMeasure = `${MEASURE_SIZE}px "MartianCurrent"`;
  const baselineRender = `${FONT_PX}px "MartianBaseline"`;
  const currentRender = `${FONT_PX}px "MartianCurrent"`;

  await document.fonts.ready;
  if (id !== _runId) return;

  // Metric tolerance is one order of magnitude tighter than pixel threshold:
  // metric is % of em (small numbers), pixel is % of glyph area (larger numbers).
  const metricThreshold = threshold / 10;

  const cps = [...sharedCps];
  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i]!;
    const ch = String.fromCodePoint(cp);

    const mPct = metricDiffPct(ch, baselineMeasure, currentMeasure);
    if (mPct > metricThreshold) {
      diffs.add(cp);
    } else if (threshold < 100) {
      const pPct = pixelDiffPct(baselineRender, currentRender, ch);
      if (pPct > threshold) diffs.add(cp);
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
