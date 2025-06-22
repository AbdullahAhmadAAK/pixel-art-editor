import { Dispatch, SetStateAction } from "react";
import { hexToRgba } from "./hex-to-rgba";
import { RGBA } from "@/lib/types/pixel-art-editor/rgba";

export const pickEyedropperColor = async (setColorRgbaObject: Dispatch<SetStateAction<RGBA>>) => {
  if (!window.EyeDropper) {
    alert("Your browser does not support the EyeDropper API.");
    return;
  }

  try {
    const eyeDropper = new window.EyeDropper();
    const result = await eyeDropper.open();
    const colorInRgba = hexToRgba(result.sRGBHex)
    if (colorInRgba) {
      setColorRgbaObject(colorInRgba)
    }
  } catch (error) {
    console.error("Eyedropper error:", error);
  }
};
