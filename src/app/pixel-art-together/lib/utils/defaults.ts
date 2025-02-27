import { BrushData } from "@/lib/types/pixel-art-editor/brush-data"
import { Layer } from "@/lib/types/pixel-art-editor/layer"
import { PixelColor } from "@/lib/types/pixel-art-editor/pixel-color"
import { PixelKey } from "@/lib/types/pixel-art-editor/pixel-key"
import { Tool } from "@/lib/types/pixel-art-editor/tool"
import { LiveObject } from "@liveblocks/client"

export const DEFAULT_PIXEL_COLOR_NAME: string = 'transparent'

export const DEFAULT_BRUSH_DATA: BrushData = {
  opacity: 100,
  color: "#fa3030",
  rgb: { r: 255, g: 255, b: 255 },
}

export const INITIAL_LIVEBLOCKS_PRESENCE = {
  name: "",
  selectedLayer: 0,
  cursor: null,
  tool: Tool.Brush,
  mouseDown: false,
}

export const INITIAL_LIVEBLOCKS_STORAGE = {
  pixelStorage: new LiveObject<Record<PixelKey, PixelColor>>({}),
  layerStorage: new LiveObject<Record<number, Layer>>({})
}