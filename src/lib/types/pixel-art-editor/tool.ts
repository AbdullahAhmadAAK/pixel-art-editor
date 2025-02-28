/**
 * Represents the available tools in the application.
 */
export enum Tool {
  /** 
   * The Brush tool fills a single pixel with the selected color. 
   */
  Brush = "brush",

  /** 
   * The Eraser tool removes a pixel by setting it to transparent. 
   */
  Eraser = "eraser",

  /** 
   * The Fill tool floods all neighboring pixels of the same color with the selected color. 
   */
  Fill = "fill",
}
