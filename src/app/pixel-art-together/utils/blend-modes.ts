import { BlendMode } from "@/lib/types/pixel-art-editor/blend-mode";

/**
 * An array of blend mode options for the pixel art editor.
 * Each blend mode includes a `name` (CSS blend mode) and a `label` (user-friendly name).
 *
 * @constant {BlendMode[]} blendModes
 */
export const blendModes: BlendMode[] = [
  {
    name: "normal",
    label: "Normal",
  },
  {
    name: "multiply",
    label: "Multiply",
  },
  {
    name: "darken",
    label: "Darken",
  },
  {
    name: "color-burn",
    label: "Color burn",
  },
  {
    name: "screen",
    label: "Screen",
  },
  {
    name: "lighten",
    label: "Lighten",
  },
  {
    name: "color-dodge",
    label: "Color dodge",
  },
  {
    name: "overlay",
    label: "Overlay",
  },
  {
    name: "soft-light",
    label: "Soft light",
  },
  {
    name: "hard-light",
    label: "Hard light",
  },
  {
    name: "difference",
    label: "Difference",
  },
  {
    name: "exclusion",
    label: "Exclusion",
  },
  {
    name: "hue",
    label: "Hue",
  },
  {
    name: "saturation",
    label: "Saturation",
  },
  {
    name: "color",
    label: "Color",
  },
  {
    name: "luminosity",
    label: "Luminosity",
  },
];
