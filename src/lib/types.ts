import { CSSProperties } from "react";

export type Pixel = {
  color: string;
};

export type PixelGrid = Pixel[][];

export type Layer = {
  id: number;
  grid?: PixelGrid;
  opacity: number;
  // blendMode: string; MixBlendMode TODO: changed this, see if any ripple effect
  blendMode: CSSProperties["mixBlendMode"];
  hidden: boolean;
};


export type RGB = {
  r: number;
  g: number;
  b: number;
};

export type Brush = {
  opacity: number;
  hue: number;
  saturation: number;
  color: string;
  lightness: number;
  rgb: RGB;
};

export enum Tool {
  Brush = "brush",
  Eraser = "eraser",
  Fill = "fill",
}

export enum Direction {
  Up = "up",
  Right = "right",
  Down = "down",
  Left = "left",
}
