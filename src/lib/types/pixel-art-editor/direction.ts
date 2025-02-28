/**
 * Represents the possible directions for moving a layer.
 * Used when a move layer button is clicked (e.g. from handleLayerMove function)
 */
export enum Direction {
  /** Move layer up */
  Up = "up",
  /** Move layer to the right */
  Right = "right",
  /** Move layer down */
  Down = "down",
  /** Move layer to the left */
  Left = "left",
}
