import { PixelGrid } from "@/lib/types/pixel-art-editor/pixel-grid";
import { PixelObject } from "@/lib/types/pixel-art-editor/pixel-object";

// Find all neighbours, and neighbours of neighbours, with same color
export function getFillPixels(initialPixel: PixelObject, grid: PixelGrid) {
  const layer = initialPixel.layer;
  const pixels: PixelObject[] = [];

  const alreadyCounted = ({ row, col }: { row: number, col: number }) =>
    pixels.some((pixel) => {
      return pixel.row === row && pixel.col === col;
    });

  function findClosest({ row, col }: { row: number, col: number }) {
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
