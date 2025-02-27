import { LiveObject } from "@liveblocks/client";
import { PixelKey } from "./pixel-key";
import { PixelColor } from "./pixel-color";
import { Layer } from "./layer";

/**
 * Represents the Liveblocks storage structure.
 * - `pixelStorage` stores pixel data.
 * - `layerStorage` stores layer data.
 */
export type LiveblocksStorage = {
  /** Stores pixel data mapped by `PixelKey` (e.g., "0_1_2") to a `PixelColor`. */
  pixelStorage: LiveObject<Record<PixelKey, PixelColor>>;
  /** Stores layer data, mapped by layer index to a `Layer` object. */
  layerStorage: LiveObject<Record<number, Layer>>;
};