import { PixelColor } from "./pixel-color";
import { PixelKey } from "./pixel-key";

/**
 * A storage structure for pixels, where the key follows the format `{layer}_{row}_{col}`
 * and the value is a pixel color in hexadecimal format.
 */
export type PixelStorage = {
  /**
   * The key is a string formatted as `{layer}_{row}_{col}`, where:
   * - `layer` represents the pixel's layer in a multi-layered system.
   * - `row` is the row index of the pixel.
   * - `col` is the column index of the pixel.
   *
   * The value is a hex color code representing the pixel's color (e.g., `#FF5733`).
   */
  [key: PixelKey]: PixelColor;
};