import { PixelColor } from "./pixel-color";

/**
 * Represents a pixel in a grid-based system with a specific layer, row, and column.
 */
export type PixelObject = {
  /** The layer the pixel belongs to, useful for multi-layered drawings. */
  layer: number;

  /** The row position of the pixel in the grid. */
  row: number;

  /** The column position of the pixel in the grid. */
  col: number;

  /** 
   * The optional value associated with the pixel, usually a hex color code (e.g., `#FFFFFF`).
   * Why is this optional? Please see thee handlePixelChange function, where we initialize a new PixelObject but don't immediately set its new value.
   */
  value?: PixelColor;
};
