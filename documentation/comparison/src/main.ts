import "./styles/base.css";
import "./styles/controls.css";
import "./styles/grid.css";
import "./styles/fullscreen.css";

import { setFontFaces } from "./services/font-faces";
import { refreshCharsets } from "./services/charset";

import "./components/comparison-app";
import "./components/fs-viewer";
import "./components/controls";
import "./components/text-preview";
import "./components/glyph-grid";

setFontFaces("MartianGrotesk-old.ttf", "MartianGrotesk-new.ttf");
await refreshCharsets("MartianGrotesk-old.ttf", "MartianGrotesk-new.ttf");
