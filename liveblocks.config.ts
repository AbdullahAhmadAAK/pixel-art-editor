import { PixelColor, PixelKey } from "@/app/pixel-art-together/page";
import { Layer, Tool } from "@/lib/types";
import { LiveObject } from "@liveblocks/client";

export type PanelName = 'multiplayerPanel' | 'mainPanel' | 'toolsPanel'
export type BrushData = {
  color: string,
  hue: number,
  lightness: number,
  opacity: number,
  rgb: {
    r: number,
    g: number,
    b: number
  },
  saturation: number
}

declare global {
  interface Liveblocks {
    Presence: {
      name: string,
      brush?: BrushData | null,
      selectedLayer: number,
      cursor: { x: number, y: number, area: PanelName } | null,
      tool: Tool,
      mouseDown: boolean,
    },
    Storage: {
      pixelStorage: LiveObject<Record<PixelKey, PixelColor>>;
      layerStorage: LiveObject<Record<number, Layer>>;
    };
  }
}

