import { PixelObject } from "@/lib/types/pixel-art-editor/pixel-object";
import { Layer } from "@/lib/types/pixel-art-editor/layer";
import { PixelGrid } from "@/lib/types/pixel-art-editor/pixel-grid";
import { CSSProperties } from "react";
import { DEFAULT_PIXEL_COLOR_NAME } from '@/app/pixel-art-together/lib/utils/defaults';

interface FormatLayersArgs {
  pixelStorage: {
    readonly [x: string]: string;
  }
  layerStorage: {
    readonly [x: number]: {
      readonly id: number;
      readonly grid: PixelGrid;
      readonly opacity: number;
      readonly blendMode: CSSProperties["mixBlendMode"];
      readonly hidden: boolean;
    };
  };
  keyToPixel: (key: string) => PixelObject;
  getPixel: (pixelProps: PixelObject) => { color: string };
}

/**
 * Returns an object containing all layers and pixel grids, for general use
 *
 * Example of 3*3 grid with 2 layers:
 * const formattedLayers = [
 *   {
 *     id: 1,
 *     opacity: 0.8,
 *     blendMode: 'color-dodge',
 *     grid: [
 *       [{ color: '#ff0000' }, { color: '#ffffff' }, { color: '#0000ff' }],
 *       [{ color: '#ff0000' }, { color: '#ffffff' }, { color: '#0000ff' }],
 *       [{ color: '#ff0000' }, { color: '#ffffff' }, { color: '#0000ff' }],
 *     ]
 *   },
 *   {
 *     id: 0,
 *     opacity: 1,
 *     blendMode: 'normal',
 *     grid: [
 *       [{ color: 'transparent' }, { color: 'transparent' }, { color: 'transparent' }],
 *       [{ color: 'transparent' }, { color: 'transparent' }, { color: 'transparent' }],
 *       [{ color: 'transparent' }, { color: 'transparent' }, { color: 'transparent' }],
 *     ]
 *   }
 * ]
 */
export function formatLayers({
  pixelStorage,
  layerStorage,
  keyToPixel,
  getPixel,
}: FormatLayersArgs) {
  let layers: Layer[] = [];

  if (pixelStorage && layerStorage) {
    // Map the pixelStorage keys to PixelObject
    const currentPixels: PixelObject[] = Object.keys(pixelStorage).map((key) => ({
      key,
      ...keyToPixel(key),
    }));

    layers = Object.values(layerStorage).map((layer) => {
      const grid: PixelGrid = [];

      // Iterate over each pixel
      currentPixels.forEach((pixel) => {
        // Check if pixel layer matches the current layer id
        if (layer.id !== pixel.layer) return;

        // Ensure the grid is properly structured for rows and columns
        if (!grid[pixel.row]) grid[pixel.row] = [];

        // Default to transparent if not set
        if (!grid[pixel.row][pixel.col]) grid[pixel.row][pixel.col] = { color: DEFAULT_PIXEL_COLOR_NAME };

        // Get pixel data from the `getPixel` function
        grid[pixel.row][pixel.col] = getPixel(pixel);
      });

      // Return the layer with its grid
      return { ...layer, grid };
    });
  }

  return layers;
}
