import { RGB } from "@/lib/types/pixel-art-editor/rgb";

/**
 * Determines whether a text color should be light or dark based on the perceived luminance of a given RGB color.
 * 
 * This function calculates the luminance of a color and returns `true` if a light-colored text should be used 
 * (for dark backgrounds) or `false` if a dark-colored text should be used (for light backgrounds).
 * 
 * @param {RGB} color - The RGB object containing the red, green, and blue color values.
 * @param {number} color.r - The red component (0-255).
 * @param {number} color.g - The green component (0-255).
 * @param {number} color.b - The blue component (0-255).
 * @returns {boolean} `true` if light text is recommended (dark background), `false` if dark text is recommended (light background).
 */
export function contrastingTextColour({ r, g, b }: RGB): boolean {
  if (r && g && b) {
    const perceivedLuminance = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return perceivedLuminance < 0.5;
  }
  return false;
}