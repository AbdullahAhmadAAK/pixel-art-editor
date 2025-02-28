import { HsvaColor } from "colord";

/**
  * This function converts HsvaColor objects of the Colord package, to a readable human-friendly format.
  * Example input: { h: 1, s: 1, v: 1, a: 0.3 }
  * Example output: hsva(1, 1, 1, 0.3)
  * This isn't provided by the Colord package, so we made our own.
  * @param hsva 
  * @returns 
  */
export function hsvaToReadable(hsva: HsvaColor) {
  const { h, s, v, a } = hsva;
  return `hsva(${h}, ${s}%, ${v}%, ${a.toFixed(2)})`;
}