export type FontVariant = {
  readonly label: string;
  readonly old: string;
  readonly new: string;
};

export const FONT_WIDTHS: readonly FontVariant[] = [
  { label: "Condensed", old: "Cn", new: "Condensed" },
  { label: "Semi Condensed", old: "Nr", new: "SemiCondensed" },
  { label: "Normal", old: "Std", new: "" },
  { label: "Semi Expanded", old: "sWd", new: "SemiExpanded" },
  { label: "Expanded", old: "Wd", new: "Expanded" },
  { label: "Extra Expanded", old: "xWd", new: "ExtraExpanded" },
  { label: "Ultra Expanded", old: "uWd", new: "UltraExpanded" },
] as const;

export const FONT_WEIGHTS: readonly FontVariant[] = [
  { label: "Thin", old: "Th", new: "Thin" },
  { label: "Extra Light", old: "xLt", new: "ExtraLight" },
  { label: "Light", old: "Lt", new: "Light" },
  { label: "Regular", old: "Rg", new: "Regular" },
  { label: "Medium", old: "Md", new: "Medium" },
  { label: "Bold", old: "Bd", new: "Bold" },
  { label: "Extra Bold", old: "xBd", new: "ExtraBold" },
  { label: "Black", old: "Bl", new: "Black" },
  { label: "Ultra Black", old: "Ult", new: "UltraBlack" },
] as const;
