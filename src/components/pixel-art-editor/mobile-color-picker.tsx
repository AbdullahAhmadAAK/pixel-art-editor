// Note: we used these two lines, due to an error within the shoelace library
// alpha, saturation, brightness, and hue are all accessible values, but the TS error states that they are private and can't be accessed outside of the class.
// Since there was no way to resolve them, I disabled typescript checking for this file.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import './mobile-color-picker.css'
import { Brush, Tool } from "@/lib/types";
import { useMyPresence, useUpdateMyPresence } from "@liveblocks/react";
import { hexToRgb } from "@/app/pixel-art-together/lib/utils/hex-to-rgb";
import type SlColorPickerType from '@shoelace-style/shoelace/dist/components/color-picker/color-picker.component.d.ts';
import { useEffect, useRef, useState } from "react";
import SlColorPicker, { SlChangeEvent } from '@shoelace-style/shoelace/dist/react/color-picker/index.js';

interface MobileColorPickerProps {
  handleBrushChange: ({ detail }: { detail: Brush }) => void,
  swatch: string[]
}

export function MobileColorPicker({
  handleBrushChange,
  swatch
}: MobileColorPickerProps) {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [myPresence, _] = useMyPresence();
  const updateMyPresence = useUpdateMyPresence();

  const colorPickerRef = useRef<SlColorPickerType | null>(null)
  const [colorValue, setColorValue] = useState<string>("")

  const [brush, setBrush] = useState<Brush>({ // Default brush
    opacity: 100,
    hue: 0,
    saturation: 0,
    color: "#fa3030",
    lightness: 0,
    rgb: { r: 255, g: 255, b: 255 },
  })

  useEffect(() => {
    handleBrushChange({ detail: brush })
  }, [brush, handleBrushChange])

  useEffect(() => {
    if (setColorValue) {
      const applyPostmountLogic = async () => {
        setColorValue("#fa3030")
      }

      applyPostmountLogic()
    }

  }, [setColorValue])

  useEffect(() => {
    if (colorPickerRef.current) {
      colorPickerRef.current.swatches = swatch
    }
  }, [swatch])

  // When color changes, update presence


  function colorChange(e: SlChangeEvent) {
    const target = e.target as SlColorPickerType

    if (!colorPickerRef.current || !target) {
      return;
    }

    let chosenColorValue = target.value; // can be in any format
    if (chosenColorValue[0] !== "#") { // if it is not in hex format, change it
      // note: I changed from hex to hexa, so that opacity changes in other formats could be detected and shown on the UI. Not sure why this was not an issue on the old repo.
      chosenColorValue = colorPickerRef.current.getFormattedValue("hexa"); // format the chosen color's value (can be "rgba(147, 72, 72, 1.00)" as well as "#5d1111ff")
    }

    // checks whether it's valid (at this moment, value is now in hex)
    const rgb = hexToRgb(chosenColorValue.slice(0, 7))
    if (!rgb) return;

    // Note: we can ignore the errors "Property 'alpha' is private and only accessible within class 'SlColorPicker'.ts(2341)" and those for saturation and lightness, as the values are accessible
    setBrush({
      color: chosenColorValue,
      opacity: parseInt(target.alpha),
      hue: parseInt(target.hue),
      saturation: parseInt(target.saturation),
      // old developer mistakenly used target.lightness instead of target.brightness. Doesn't seem to be changable within color picker component though. It isn't mentioned in the docs, but is present in the color-picker.component.d.ts file.
      lightness: parseInt(target.brightness),
      rgb
    })

    setColorValue(chosenColorValue)

    if (myPresence.tool === "eraser") {
      // myPresence.update({ tool: "brush" });
      updateMyPresence({ tool: Tool.Brush })
    }
  }

  return (
    <SlColorPicker
      ref={colorPickerRef}
      className="mobile-color-picker"
      onSlChange={colorChange}
      opacity
      value={colorValue}
    >
    </SlColorPicker>
  );
}