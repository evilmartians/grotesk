import type { WritableAtom } from "nanostores";
import { createContext } from "nanotags/context";

export type SlidersContext = {
  $weight: WritableAtom<number>;
  $width: WritableAtom<number>;
  $glyphSize: WritableAtom<number>;
};

export const slidersCtx = createContext<SlidersContext>("sliders");
