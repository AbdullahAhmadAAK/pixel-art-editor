import { PixelColor } from "./pixel-color";
import { RGB } from "./rgb";

/**
 * Represents the brush tool data in the pixel editor.
 */
export type BrushData = {
  /** Hex color of the brush (e.g., "#ffaa12") */
  color: PixelColor;
  /** Opacity of the brush (0 to 1) */
  opacity: number;
  /** RGB color breakdown of the brush */
  rgb: RGB;
};
