import { BrushData } from "@/lib/types/pixel-art-editor/brush-data";
import { Layer } from "@/lib/types/pixel-art-editor/layer";
import { PixelColor } from "@/lib/types/pixel-art-editor/pixel-color";
import { PixelKey } from "@/lib/types/pixel-art-editor/pixel-key";
import { Tool } from "@/lib/types/pixel-art-editor/tool";
import { LiveObject } from "@liveblocks/client";

/**
 * Default name for transparent pixel color.
 */
export const DEFAULT_PIXEL_COLOR_NAME: string = "transparent";

/**
 * Default brush settings used in the pixel art editor.
 *
 * @constant
 * @type {BrushData}
 * @property {number} opacity - The opacity level of the brush (0-100).
 * @property {string} color - The default hex color of the brush.
 * @property {{r: number, g: number, b: number}} rgb - The RGB representation of the brush color.
 */
export const DEFAULT_BRUSH_DATA: BrushData = {
  opacity: 100,
  color: "#fa3030",
  rgb: { r: 255, g: 255, b: 255 },
};

/**
 * Initial Liveblocks presence state for a user in the collaborative pixel art editor.
 *
 * @constant
 * @type {Object}
 * @property {string} name - The name of the user.
 * @property {number} selectedLayer - The currently selected layer ID.
 * @property {null | { x: number, y: number }} cursor - The user's cursor position, or null if not present.
 * @property {Tool} tool - The currently selected tool (e.g., Brush, Eraser).
 * @property {boolean} mouseDown - Whether the mouse is currently being pressed.
 */
export const INITIAL_LIVEBLOCKS_PRESENCE = {
  name: "",
  selectedLayer: 0,
  cursor: null,
  tool: Tool.Brush,
  mouseDown: false,
};

/**
 * Initial Liveblocks storage setup for collaborative editing.
 * 
 * This storage contains both pixel data and layer data, allowing multiple users
 * to work on the same pixel art project in real-time.
 *
 * @constant
 * @type {Object}
 * @property {LiveObject<Record<PixelKey, PixelColor>>} pixelStorage - Stores pixel colors mapped by their unique pixel keys.
 * @property {LiveObject<Record<number, Layer>>} layerStorage - Stores layers mapped by their layer IDs.
 */
export const INITIAL_LIVEBLOCKS_STORAGE = {
  pixelStorage: new LiveObject<Record<PixelKey, PixelColor>>({}),
  layerStorage: new LiveObject<Record<number, Layer>>({}),
};

/**
 * Default color used in the swatch.
 * Represents a fully opaque white color in RGBA hex format.
 * @constant {string}
 */
export const DEFAULT_SWATCH_COLOR = "#ffffffff";