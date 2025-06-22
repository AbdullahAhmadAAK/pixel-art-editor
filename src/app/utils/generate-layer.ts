import { PixelStorage } from "@/lib/types/pixel-art-editor/pixel-storage";

/**
 * Generates a pixel storage object for a given layer with default color values.
 *
 * @param {Object} params - The parameters for generating the layer.
 * @param {number} params.layer - The layer index.
 * @param {number} params.cols - The number of columns in the layer.
 * @param {number} params.rows - The number of rows in the layer.
 * @param {string} params.defaultValue - The default color value for each pixel.
 * @returns {PixelStorage} - A mapping of pixel keys to color values.
 */
export function generateLayer({
  layer,
  cols,
  rows,
  defaultValue,
}: {
  layer: number;
  cols: number;
  rows: number;
  defaultValue: string;
}): PixelStorage {
  const storage: PixelStorage = {};
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      storage[`${layer}_${row}_${col}`] = defaultValue;
    }
  }
  return storage;
}
