import { RGB } from "@/lib/types/pixel-art-editor/rgb";

/**
 * Converts a hex color string to an RGB object.
 *
 * @param {string} hex - The hex color string (e.g., "#00ff00").
 * @returns {RGB | null} The RGB representation of the color, or null if the input is invalid.
 *
 * @example
 * hexToRgb("#00ff00"); // Returns { r: 0, g: 255, b: 0 }
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
}
