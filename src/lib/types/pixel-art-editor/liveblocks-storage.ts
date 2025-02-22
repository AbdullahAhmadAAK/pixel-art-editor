import { LiveObject } from "@liveblocks/client";
import { PixelKey } from "./pixel-key";
import { PixelColor } from "./pixel-color";
import { Layer } from "./layer";

export type LiveblocksStorage = {
  pixelStorage: LiveObject<Record<PixelKey, PixelColor>>;
  layerStorage: LiveObject<Record<number, Layer>>;
};