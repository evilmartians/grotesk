import "./styles/base.css";
import "./styles/controls.css";
import "./styles/font-picker.css";
import "./styles/grid.css";
import "./styles/fullscreen.css";

import { setFontFaces } from "./services/font-faces";
import { refreshCharsets } from "./services/charset";

import "./components/comparison-app";
import "./components/font-picker";
import "./components/fs-viewer";
import "./components/controls";
import "./components/text-preview";
import "./components/glyph-grid";

setFontFaces("/fonts/MartianGrotesk-old.ttf", "/fonts/MartianGrotesk-new.ttf");
await refreshCharsets("/fonts/MartianGrotesk-old.ttf", "/fonts/MartianGrotesk-new.ttf");
