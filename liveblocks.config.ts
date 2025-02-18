import { PixelColor, PixelKey } from "@/app/pixel-art-together/page";
import { Brush, Layer, Tool } from "@/lib/types";
import { LiveObject } from "@liveblocks/client";

export type PanelName = 'multiplayerPanel' | 'mainPanel' | 'toolsPanel'

// TODO: I think brushdata is something more meaninngful i came up with, but can totally replace brush everywhere. need to check later
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
      brush?: Brush | null,
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

