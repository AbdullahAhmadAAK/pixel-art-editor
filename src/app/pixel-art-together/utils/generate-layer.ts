import { PixelStorage } from "@/lib/types/pixel-art-editor/pixel-storage";

// Returns a list of pixel keys mapped to color values
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