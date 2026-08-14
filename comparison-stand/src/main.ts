import "./styles/base.css";
import "./styles/controls.css";
import "./styles/grid.css";
import "./styles/fullscreen.css";

import { loadManifest, $manifest } from "./services/manifest";
import { updateFontFaces } from "./services/font-faces";

import "./components/comparison-app";
import "./components/stand-header";
import "./components/fs-viewer";
import "./components/controls";
import "./components/text-preview";
import "./components/glyph-grid";

try {
  $manifest.set(await loadManifest());
} catch (error) {
  document.body.textContent =
    "No fonts to compare. Run `pnpm fonts` in comparison-stand/ first.";
  throw error;
}

await updateFontFaces();
