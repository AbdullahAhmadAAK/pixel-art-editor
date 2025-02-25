// Note: we used these two lines, due to an error within the shoelace library
// alpha, saturation, brightness, and hue are all accessible values, but the TS error states that they are private and can't be accessed outside of the class.
// Since there was no way to resolve them, I disabled typescript checking for this file.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// This is for the styles from shoelace library
import '@shoelace-style/shoelace/dist/components/color-picker/color-picker.styles.js'

import { useMyPresence, useUpdateMyPresence } from "@liveblocks/react";
import { hexToRgb } from "@/app/pixel-art-together/lib/utils/hex-to-rgb";
import { BrushData } from '@/lib/types/pixel-art-editor/brush-data';
import { Tool } from '@/lib/types/pixel-art-editor/tool';

import { useCallback, useEffect, useRef, useState } from "react";

import { RgbaColorPicker } from "react-colorful";
import { ChromePicker } from 'react-color'
// import { rgbaToHex, rgbaToRgb, rgbaToHsl, rgbaToHsv } from "@uiw/color-convert";
import { colord } from "colord";


import SlColorPicker, { SlChangeEvent } from '@shoelace-style/shoelace/dist/react/color-picker/index.js';
import type SlColorPickerType from "@shoelace-style/shoelace/dist/components/color-picker/color-picker.component.d.ts";
import { DEFAULT_BRUSH_DATA } from '@/app/pixel-art-together/lib/utils/defaults';
import { Swatch } from '@/app/pixel-art-together/lib/utils/swatch';

export function BrushPanel({
  handleBrushChange,
  updateColor,
  colorValue = "",
  setColorValue,
  swatch = []
}: {
  handleBrushChange: ({ detail }: { detail: BrushData }) => void;
  updateColor: (hex: string) => void; // this will allow the color value to be set from within the component, as well as outside of it
  colorValue: string;
  setColorValue: (colorValue: string) => void;
  swatch: Swatch
}) {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [myPresence, _] = useMyPresence();
  const updateMyPresence = useUpdateMyPresence();

  const colorPickerRef = useRef<SlColorPickerType | null>(null)
  const [brush, setBrush] = useState<BrushData>(DEFAULT_BRUSH_DATA)

  useEffect(() => {
    handleBrushChange({ detail: brush })
  }, [brush, handleBrushChange])


  // Workaround for custom elements
  // const applyCustomStyles = useCallback((host: SlColorPickerType) => {
  //   const style = document.createElement("style");
  //   style.innerHTML = `
  //     .color-picker__controls, .color-picker__user-input, .color-picker__swatches { padding-left: 0 !important; padding-right: 0 !important; }
  //     .color-picker__grid { border-radius: 4px !important; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2); }
  //     div.color-picker__swatches { border-top: 0; padding-top: 2px; margin-left: -2px; margin-right: -2px; }
  //   `;
  //   if (host.shadowRoot) {
  //     host.shadowRoot.appendChild(style);
  //   }
  //   host.swatches = swatch;
  // }, [swatch])

  useEffect(() => {
    if (setColorValue) {
      const applyPostmountLogic = async () => {
        setColorValue("#fa3030")
        // applyCustomStyles(colorPickerRef.current!);
      }

      applyPostmountLogic()
    }

  }, [setColorValue,
    //  applyCustomStyles
  ])

  console.log('swatch being passed is this: ', swatch)

  useEffect(() => {
    // if (colorPickerRef.current) {
    //   colorPickerRef.current.swatches = swatch
    // }

    console.log('Swatch changed!: ', swatch)
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
      lightness: parseInt(target.brightness),
      rgb
    })

    updateColor(chosenColorValue)

    if (myPresence.tool === "eraser") {
      updateMyPresence({ tool: Tool.Brush })
    }
  }

  const [colorTest, setColorTest] = useState(null); // Default RGBA

  function colorChangeTest(colorValueObject) {
    setColorColorful(colorValueObject)

    // const chosenColorValue = colorValueObject.hex
    // const rgb = colorValueObject.rgb


    // updateColor(rgb)

    // // const chosenOpacity = rgb.a * 100
    // const chosenOpacity = Math.round(rgb.a * 255); // Convert opacity to 0-255 range
    // delete rgb.a

    // const rgbaHexValue = `${chosenColorValue}${chosenOpacity.toString(16).padStart(2, '0')}`;

    // console.log('rgbaHex is this: ', rgbaHexValue)

    // updateColor(rgb)

    // setBrush({
    //   color: rgbaHexValue,
    //   opacity: chosenOpacity,
    //   hue: 1,
    //   saturation: 1,
    //   lightness: 1,
    //   rgb
    // })



    if (myPresence.tool === "eraser") {
      updateMyPresence({ tool: Tool.Brush })
    }
  }

  const [colorColorful, setColorColorful] = useState({ r: 255, g: 0, b: 0, a: 1 });
  const [colorObjColorful, setColorObjColorful] = useState(null)

  useEffect(() => {
    const colorObjData2 = colord(`rgba(${colorColorful.r}, ${colorColorful.g}, ${colorColorful.b}, ${colorColorful.a})`)
    setColorObjColorful(colorObjData2)

    updateColor(colorObjData2.toHex())

    const chosenOpacity = colorObjData2.toHex().a
    const rgb = colorObjData2.toRgb()
    delete rgb.a

    setBrush({
      color: colorObjData2.toHex(),
      opacity: chosenOpacity,
      hue: 1,
      saturation: 1,
      lightness: 1,
      rgb
    })

  }, [colorColorful])

  // this isn't provided by colord, so we made our own
  function hsvaToReadable(hsva) {
    const { h, s, v, a } = hsva;
    return `hsva(${h}, ${s}%, ${v}%, ${a.toFixed(2)})`;
  }

  const possibleFormats = ["hex", "rgba", "hsl", "hsv"] as const;
  const [format, setFormat] = useState<(typeof possibleFormats)[number]>("hex");

  const toggleFormat = () => {
    setFormat((prev) => {
      const currentIndex = possibleFormats.indexOf(prev);
      return possibleFormats[(currentIndex + 1) % possibleFormats.length];
    });
  };

  return (
    <div className="p-5 pb-2">
      <div className="pb-3 text-sm font-semibold text-gray-500">Colour</div>
      <div>
        <SlColorPicker
          ref={colorPickerRef}
          inline
          onSlChange={colorChange}
          opacity
          value={colorValue}
        />

        {/* <ChromePicker
          value={colorValue}
          onChange={colorChangeTest}
        /> */}

        <RgbaColorPicker
          color={colorColorful}
          onChange={(newVal) => colorChangeTest(newVal)}
        />


        {colorObjColorful && (
          <div className="text-sm text-center mt-2">
            {format === "hex" && <p><strong>HEX:</strong> {colorObjColorful.toHex()}</p>}
            {format === "rgba" && <p><strong>RGB:</strong> {colorObjColorful.toRgbString()}</p>}
            {format === "hsl" && <p><strong>HSL:</strong> {colorObjColorful.toHslString()}</p>}
            {format === "hsv" && <p><strong>HSV:</strong> {hsvaToReadable(colorObjColorful.toHsv())}</p>}
          </div>
        )}

        <button
          onClick={toggleFormat}
          className='border-gray-200 border-2'
        >
          {format}
        </button>
        

        <div className="grid grid-cols-8 gap-2 p-4">
          {swatch.map((color, index) => (
            <div
              key={index}
              className="w-6 h-6 rounded shadow"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

      </div>
    </div>

  );
}