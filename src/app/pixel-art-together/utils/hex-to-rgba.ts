import { RGBA } from "@/lib/types/pixel-art-editor/rgba";

export function hexToRgba(hex: string): RGBA | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);

  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: result[4] ? parseInt(result[4], 16) / 255 : 1, // Convert alpha from 0-255 to 0-1
    }
    : null;
}