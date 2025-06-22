import { PixelColor } from "@/lib/types/pixel-art-editor/pixel-color";
import { PixelKey } from "@/lib/types/pixel-art-editor/pixel-key";
import { PixelObject } from "@/lib/types/pixel-art-editor/pixel-object";
import { Direction } from "@/lib/types/pixel-art-editor/direction";
import { DEFAULT_PIXEL_COLOR_NAME } from '@/app/utils/defaults';

/**
 * Moves pixels in a selected layer based on the specified direction.
 * 
 * This function shifts all pixels in the given `pixelStorage` within a layer
 * either up, down, left, or right while preserving the pixel structure.
 * 
 * If pixels are moved, new pixels with the default color are inserted
 * at the edge where pixels were removed.
 * 
 * @param {Object} params - The function parameters.
 * @param {Object} params.detail - Contains the direction in which pixels should be moved.
 * @param {Direction} params.detail.direction - The direction to move pixels.
 * @param {number} params.selected - The currently selected layer to modify.
 * @param {(key: PixelKey) => PixelObject} params.keyToPixel - A function mapping pixel keys to pixel objects.
 * @param {Record<PixelKey, PixelColor>} params.pixelStorage - A record storing pixel colors, indexed by pixel keys.
 * 
 * @returns {PixelObject[]} - An array representing the new state of the moved pixels.
 */
export function getMovePixels({
  detail,
  selected,
  keyToPixel,
  pixelStorage
}: {
  detail: { direction: Direction };
  selected: number;
  keyToPixel: (key: PixelKey) => PixelObject;
  pixelStorage: Record<PixelKey, PixelColor>;
}) {
  const direction: Direction = detail.direction;
  const newLayer: PixelObject[] = [];

  // Extract pixel objects for the selected layer
  const pixelKeys = Object.keys(pixelStorage)
    .map((pixelKey) => ({
      ...keyToPixel(pixelKey),
      value: pixelStorage[pixelKey],
    }))
    .filter(({ layer }) => layer === selected);

  // Determine the maximum column and row indexes for boundary calculations
  let maxCol = 0;
  let maxRow = 0;
  pixelKeys.forEach((pixel) => {
    if (pixel.col > maxCol) {
      maxCol = pixel.col;
    }
    if (pixel.row > maxRow) {
      maxRow = pixel.row;
    }
  });

  if (direction === Direction.Up || direction === Direction.Down) {
    const up = direction === Direction.Up;

    // Move each pixel up or down
    pixelKeys.forEach((pixel) => {
      const newRowIndex = up ? pixel.row - 1 : pixel.row + 1;

      // Only move if within valid boundaries
      if (newRowIndex >= 0 && newRowIndex <= maxRow) {
        newLayer.push({
          ...pixel,
          row: newRowIndex,
          layer: selected
        });
      }
    });

    // Insert new row at the bottom or top with default color
    const newRow = Array.from({ length: maxCol + 1 });
    newRow
      .map((_, index) => ({
        col: index,
        row: up ? maxRow : 0, // Add a new row at the opposite end
        value: DEFAULT_PIXEL_COLOR_NAME,
        layer: selected
      }))
      .forEach((pixel) => newLayer.push(pixel));
  } else {
    const left = direction === Direction.Left;

    // Move each pixel left or right
    pixelKeys.forEach((pixel) => {
      const newColIndex = left ? pixel.col - 1 : pixel.col + 1;

      // Only move if within valid boundaries
      if (newColIndex >= 0 && newColIndex <= maxCol) {
        newLayer.push({
          ...pixel,
          col: newColIndex,
        });
      }
    });

    // Insert new column at the right or left with default color
    const newCol = Array.from({ length: maxCol + 1 });
    newCol
      .map((_, index) => ({
        col: left ? maxRow : 0, // Add a new column at the opposite end
        row: index,
        value: DEFAULT_PIXEL_COLOR_NAME,
        layer: selected
      }))
      .forEach((pixel) => newLayer.push(pixel));
  }

  return newLayer;
}