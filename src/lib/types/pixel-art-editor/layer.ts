import { CSSProperties } from "react";
import { PixelGrid } from "./pixel-grid";

export type Layer = {
  id: number;
  grid: PixelGrid;
  opacity: number;
  blendMode: CSSProperties["mixBlendMode"];
  hidden: boolean;
};