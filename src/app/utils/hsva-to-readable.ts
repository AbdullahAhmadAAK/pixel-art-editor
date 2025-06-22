import { HsvaColor } from "colord";

/**
 * Converts an `HsvaColor` object from the Colord package into a human-readable HSVA string format.
 *
 * @param {HsvaColor} hsva - The HSVA color object with properties:
 *   - `h` (hue): Number representing the hue (0-360).
 *   - `s` (saturation): Number representing the saturation percentage (0-100).
 *   - `v` (value): Number representing the brightness percentage (0-100).
 *   - `a` (alpha): Number representing the opacity (0-1).
 * 
 * @returns {string} The formatted HSVA string (e.g., `"hsva(1, 100%, 100%, 0.30)"`).
 *
 * @example
 * hsvaToReadable({ h: 1, s: 100, v: 100, a: 0.3 });
 * // Returns: "hsva(1, 100%, 100%, 0.30)"
 */
export function hsvaToReadable(hsva: HsvaColor): string {
  const { h, s, v, a } = hsva;
  return `hsva(${h}, ${s}%, ${v}%, ${a.toFixed(2)})`;
}
