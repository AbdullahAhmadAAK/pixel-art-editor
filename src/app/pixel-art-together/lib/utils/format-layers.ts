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

import { PixelObject, PixelStorage } from "../../page";

// Define Layer type with required properties
export interface Layer {
  id: number;
  opacity: number;
  blendMode: string;
  grid: Array<Array<{ color: string }>>;
}

// Define the shape of the function argument types
interface FormatLayersArgs {
  pixelStorage: PixelStorage;
  layerStorage: object; // Record<string, Layer>;
  keyToPixel: (key: string) => PixelObject;
  getPixel: (pixelProps: PixelObject) => { color: string };
}

export function formatLayers({
  pixelStorage,
  layerStorage,
  keyToPixel,
  getPixel,
}: FormatLayersArgs) {
  let layers: Layer[] = [];

  if (pixelStorage && layerStorage) {
    // Map the pixelStorage keys to PixelObject
    const currentPixels = Object.keys(pixelStorage).map((key) => ({
      key,
      ...keyToPixel(key),
    }));

    layers = Object.values(layerStorage).map((layer) => {
      const grid: Array<Array<{ color: string }>> = [];

      // Iterate over each pixel
      currentPixels.forEach((pixel) => {
        // Check if pixel layer matches the current layer id
        if (layer.id !== pixel.layer) return;

        // Ensure the grid is properly structured for rows and columns
        if (!grid[pixel.row]) grid[pixel.row] = [];

        // TODO: i dont think this is what was mentioned below
        // if (!grid[pixel.row][pixel.col]) grid[pixel.row][pixel.col] = { color: 'transparent' }; // Default to transparent if not set

        // Get pixel data from the `getPixel` function
        grid[pixel.row][pixel.col] = getPixel(pixel);
      });

      // Return the layer with its grid
      return { ...layer, grid };
    });
  }


  // if (pixelStorage && layerStorage) {
  //   const currentPixels = Object.keys(pixelStorage).map((key) => ({
  //     key,
  //     ...keyToPixel(key),
  //   }));

  //   layers = Object.values(layerStorage).map((layer) => {
  //     const grid: Array<Array<{ color: string }>> = [];
  //     currentPixels.forEach((pixel) => {
  //       // @ts-ignore TODO
  //       if (layer.id !== pixel.layer) return;
  //       if (!grid[pixel.row]) grid[pixel.row] = [];
  //       if (!grid[pixel.row][pixel.col]) grid[pixel.row][pixel.col] = [];

  //       grid[pixel.row][pixel.col] = getPixel(pixel);
  //     });
  //     // @ts-ignore TODO
  //     return { ...layer, grid };
  //   });
  // }
  return layers;
}
