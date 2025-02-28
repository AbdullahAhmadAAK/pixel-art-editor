import { PixelGrid } from "@/lib/types/pixel-art-editor/pixel-grid";
import { PixelObject } from "@/lib/types/pixel-art-editor/pixel-object";

/**
 * Finds all connected pixels of the same color in a pixel grid, starting from an initial pixel.
 *
 * @param {PixelObject} initialPixel - The starting pixel.
 * @param {PixelGrid} grid - The 2D array representing the pixel grid.
 * @returns {PixelObject[]} - An array of pixels that are connected and share the same color.
 */
export function getFillPixels(initialPixel: PixelObject, grid: PixelGrid): PixelObject[] {
  const layer = initialPixel.layer;
  const pixels: PixelObject[] = [];

  /**
   * Checks if a pixel at the given row and column is already counted.
   *
   * @param {Object} param - The pixel coordinates.
   * @param {number} param.row - The row index of the pixel.
   * @param {number} param.col - The column index of the pixel.
   * @returns {boolean} - True if the pixel has already been counted, false otherwise.
   */
  const alreadyCounted = ({ row, col }: { row: number; col: number }) =>
    pixels.some((pixel) => pixel.row === row && pixel.col === col);

  /**
   * Recursively finds adjacent pixels with the same color.
   *
   * @param {Object} param - The pixel coordinates.
   * @param {number} param.row - The row index of the pixel.
   * @param {number} param.col - The column index of the pixel.
   */
  function findClosest({ row, col }: { row: number; col: number }) {
    const neighbours = [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 },
    ];

    neighbours.forEach((neighbour) => {
      const pixel = grid?.[neighbour.row]?.[neighbour.col];
      const pixelObj = { row: neighbour.row, col: neighbour.col };

      if (pixel && pixel.color === grid[row][col].color && !alreadyCounted(pixelObj)) {
        pixels.push({ ...pixelObj, layer });
        findClosest(pixelObj);
      }
    });
  }

  findClosest(initialPixel);
  return pixels;
}
