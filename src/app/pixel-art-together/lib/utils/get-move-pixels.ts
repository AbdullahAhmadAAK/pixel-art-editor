import { Direction } from "@/lib/types";
import { PixelColor, PixelKey, PixelObject } from "../../page";

export function getMovePixels({
  detail,
  selected,
  keyToPixel,
  pixelStorage
}: {
  detail: { direction: Direction },
  selected: number,
  keyToPixel: (key: PixelKey) => PixelObject,
  pixelStorage: Record<PixelKey, PixelColor>
}) {
  const direction: Direction = detail.direction;

  const newLayer: PixelObject[] = [];

  const pixelKeys = Object.keys(pixelStorage)
    .map((pixelKey) => ({
      ...keyToPixel(pixelKey),
      // value: { color: pixelStorage[pixelKey] }, // note: old developer made a TS error here. We need this to be a string, and not an object
      value: pixelStorage[pixelKey],
    }))
    .filter(({ layer }) => layer === selected);

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
    pixelKeys.forEach((pixel) => {
      const newRowIndex = up ? pixel.row - 1 : pixel.row + 1;
      if (newRowIndex >= 0 && newRowIndex <= maxRow) {
        newLayer.push({
          ...pixel,
          row: newRowIndex,
          layer: selected // I added this, so that the pixel stays in the same layer it was
        });
      }
    });

    const newRow = Array.from({ length: maxCol + 1 });
    newRow
      .map((_, index) => ({
        col: index,
        row: up ? maxRow : 0,
        // value: { color: "transparent" }, changed from object to string, to follow a consistent TS structure in PixelObject
        value: "transparent",
        layer: selected // I added this, so that the pixel stays in the same layer it was
      }))
      .forEach((pixel) => newLayer.push(pixel));
  } else {
    const left = direction === Direction.Left;
    pixelKeys.forEach((pixel) => {
      const newColIndex = left ? pixel.col - 1 : pixel.col + 1;
      if (newColIndex >= 0 && newColIndex <= maxCol) {
        newLayer.push({
          ...pixel,
          col: newColIndex,
        });
      }
    });

    const newCol = Array.from({ length: maxCol + 1 });
    newCol
      .map((_, index) => ({
        col: left ? maxRow : 0,
        row: index,
        // value: { color: "transparent" },
        value: "transparent", 
        layer: selected // I added this, so that the pixel stays in the same layer it was
      }))
      .forEach((pixel) => newLayer.push(pixel));
  }

  return newLayer;
}
