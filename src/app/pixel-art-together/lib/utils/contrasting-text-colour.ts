import { RGB } from "@/lib/types/pixel-art-editor/rgb";

export function contrastingTextColour({ r, g, b }: RGB) {
  if (r && g && b) {
    const perceivedLuminance = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return perceivedLuminance < 0.5;
  }
  return false;
}