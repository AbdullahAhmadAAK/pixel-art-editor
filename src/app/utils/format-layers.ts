import { PixelObject } from "@/lib/types/pixel-art-editor/pixel-object";
import { Layer } from "@/lib/types/pixel-art-editor/layer";
import { PixelGrid } from "@/lib/types/pixel-art-editor/pixel-grid";
import { CSSProperties } from "react";
import { DEFAULT_PIXEL_COLOR_NAME } from '@/app/utils/defaults';

/**
 * Arguments for formatting layers in the pixel art editor.
 */
interface FormatLayersArgs {
  /**
   * A storage object mapping unique pixel keys to their corresponding color values.
   * @readonly
   */
  pixelStorage: {
    readonly [x: string]: string;
  };

  /**
   * A storage object mapping layer indices to their respective layer data.
   * @readonly
   */
  layerStorage: {
    readonly [x: number]: {
      /** The unique ID of the layer. */
      readonly id: number;

      /** The pixel grid representing the layer. */
      readonly grid: PixelGrid;

      /** The opacity level of the layer (0-100). */
      readonly opacity: number;

      /** The blend mode used for rendering the layer. */
      readonly blendMode: CSSProperties["mixBlendMode"];

      /** Whether the layer is hidden. */
      readonly hidden: boolean;
    };
  };

  /**
   * Function that converts a pixel storage key into a `PixelObject`.
   * @param {string} key - The key representing a pixel.
   * @returns {PixelObject} - The pixel object derived from the key.
   */
  keyToPixel: (key: string) => PixelObject;

  /**
   * Function that retrieves pixel data, including color.
   * @param {PixelObject} pixelProps - The pixel properties to fetch color for.
   * @returns {{ color: string }} - The color information of the pixel.
   */
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
