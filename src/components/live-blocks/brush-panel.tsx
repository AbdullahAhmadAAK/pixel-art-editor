// Note: we used these two lines, due to an error within the shoelace library
// alpha, saturation, brightness, and hue are all accessible values, but the TS error states that they are private and can't be accessed outside of the class.
// Since there was no way to resolve them, I disabled typescript checking for this file.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// This is for the styles from shoelace library
import '@shoelace-style/shoelace/dist/components/color-picker/color-picker.styles.js'

import { useMyPresence, useUpdateMyPresence } from "@liveblocks/react";
import { hexToRgb } from "@/app/pixel-art-together/lib/utils/hex-to-rgb";
import { Brush, Tool } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";

import SlColorPicker, { SlChangeEvent } from '@shoelace-style/shoelace/dist/react/color-picker/index.js';
import type SlColorPickerType from "@shoelace-style/shoelace/dist/components/color-picker/color-picker.component.d.ts";

export function BrushPanel({
  handleBrushChange,
  updateColor,
  colorValue = "",
  setColorValue,
  swatch = []
}: {
  handleBrushChange: ({ detail }: { detail: Brush }) => void;
  updateColor: (hex: string) => void; // this will allow the color value to be set from within the component, as well as outside of it
  colorValue: string;
  setColorValue: (colorValue: string) => void;
  swatch: string[]
}) {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [myPresence, _] = useMyPresence();
  const updateMyPresence = useUpdateMyPresence();

  // let colorPicker: { getFormattedValue; swatches };
  const colorPickerRef = useRef<SlColorPickerType | null>(null)

  const [brush, setBrush] = useState<Brush>({ // Default brush
    opacity: 100,
    hue: 0,
    saturation: 0,
    color: "#fa3030",
    lightness: 0,
    rgb: { r: 255, g: 255, b: 255 },
  })

  // $: dispatch("brushChange", brush);
  useEffect(() => {
    handleBrushChange({ detail: brush })
  }, [brush, handleBrushChange])


  // Workaround for custom elements
  const applyCustomStyles = useCallback((host: SlColorPickerType) => {
    const style = document.createElement("style");
    style.innerHTML = `
      .color-picker__controls, .color-picker__user-input, .color-picker__swatches { padding-left: 0 !important; padding-right: 0 !important; }
      .color-picker__grid { border-radius: 4px !important; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2); }
      div.color-picker__swatches { border-top: 0; padding-top: 2px; margin-left: -2px; margin-right: -2px; }
    `;
    if (host.shadowRoot) {
      host.shadowRoot.appendChild(style);
    }
    host.swatches = swatch;
  }, [swatch])

  // onMount(async () => {
  //   dispatch("brushChange", brush);
  //   await import(
  //     "@shoelace-style/shoelace/dist/components/color-picker/color-picker.js"
  //   );
  //   colorValue = '#fa3030';
  //   applyCustomStyles(colorPicker);
  // });
  useEffect(() => {
    if (setColorValue) {
      const applyPostmountLogic = async () => {
        // await import("@shoelace-style/shoelace/dist/components/color-picker/color-picker.js");
        // colorValue = '#fa3030';
        setColorValue("#fa3030")
        applyCustomStyles(colorPickerRef.current!); // TODO: ts am i sure about this though
      }

      applyPostmountLogic()
    }

  }, [setColorValue, applyCustomStyles])

  // $: if (colorPicker) {
  //   colorPicker.swatches = swatch;
  // }
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

    updateColor(chosenColorValue)

    if (myPresence.tool === "eraser") {
      // myPresence.update({ tool: "brush" });
      updateMyPresence({ tool: Tool.Brush })
    }
  }

  return (
    <div className="p-5 pb-2">
      <div className="pb-3 text-sm font-semibold text-gray-500">Colour</div>
      <div>
        <SlColorPicker
          // bind:this={colorPicker}
          ref={colorPickerRef}
          inline
          onSlChange={colorChange}
          opacity
          value={colorValue}
        />
      </div>
    </div>

  );
}