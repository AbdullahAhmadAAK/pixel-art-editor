import { CSSProperties } from "react";
import { PixelGrid } from "./pixel-grid";

/**
 * Represents a single layer in the pixel editor.
 */
export type Layer = {
  /** Unique identifier for the layer */
  id: number;
  /** 2D grid of pixels associated with this layer */
  grid: PixelGrid;
  /** Opacity of the layer (0 to 1) */
  opacity: number;
  /** CSS blend mode applied to the layer */
  blendMode: CSSProperties["mixBlendMode"];
  /** Whether the layer is hidden or visible */
  hidden: boolean;
};
