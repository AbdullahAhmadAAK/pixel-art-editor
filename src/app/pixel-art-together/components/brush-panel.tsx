// Note: we used these two lines, due to an error within the shoelace library
// alpha, saturation, brightness, and hue are all accessible values, but the TS error states that they are private and can't be accessed outside of the class.
// Since there was no way to resolve them, I disabled typescript checking for this file.
// aaaa eslint-disable-next-line @typescript-eslint/ban-ts-comment
// aaaa @ts-n ocheck

// This is for the styles from shoelace library
import '@shoelace-style/shoelace/dist/components/color-picker/color-picker.styles.js'

import { useMyPresence, useUpdateMyPresence } from "@liveblocks/react";
import { BrushData } from '@/lib/types/pixel-art-editor/brush-data';
import { Tool } from '@/lib/types/pixel-art-editor/tool';

import { useEffect, useState } from "react";

import { RgbaColorPicker } from "react-colorful";
import { Colord, colord, HsvaColor, RgbaColor } from "colord";

import { DEFAULT_BRUSH_DATA } from '@/app/pixel-art-together/lib/utils/defaults';
import { Swatch } from '@/app/pixel-art-together/lib/utils/swatch';
import { hexToRgba } from '../utils/hex-to-rgb';
import { RGBA } from '@/lib/types/pixel-art-editor/rgba';
import { RGB } from '@/lib/types/pixel-art-editor/rgb';

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

  const [brush, setBrush] = useState<BrushData>(DEFAULT_BRUSH_DATA)

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

  const pickColor = async () => {
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

  function colorChange(colorValueObject: RGBA) {
    setColorRgbaObject(colorValueObject) // This will automatically set off a useEffect block to make the rest of the changes
    if (myPresence.tool === "eraser") {
      updateMyPresence({ tool: Tool.Brush })
    }
  }

  const [colorRgbaObject, setColorRgbaObject] = useState<RGBA>({ r: 255, g: 0, b: 0, a: 1 });
  const [colorColordInstance, setColorColordInstance] = useState<Colord | null>(null)

  useEffect(() => {
    const newColordInstance = colord(`rgba(${colorRgbaObject.r}, ${colorRgbaObject.g}, ${colorRgbaObject.b}, ${colorRgbaObject.a})`)
    setColorColordInstance(newColordInstance)

    updateColor(newColordInstance.toHex())

    const newRgbaColorObject: Partial<RgbaColor> = newColordInstance.toRgb(); // Partial makes 'a' optional

    if (newRgbaColorObject.a === undefined) { // Ensure 'a' is defined
      newRgbaColorObject.a = 1;
    }

    const chosenOpacity = newRgbaColorObject.a;
    const rgbColorObject: RGB = {
      r: newRgbaColorObject.r! as number,
      g: newRgbaColorObject.g! as number,
      b: newRgbaColorObject.b! as number
    }

    setBrush({
      color: newColordInstance.toHex(),
      opacity: chosenOpacity,
      hue: 1,
      saturation: 1,
      lightness: 1,
      rgb: rgbColorObject
    })

  }, [colorRgbaObject])

  /**
   * This function converts HsvaColor objects of the Colord package, to a readable human-friendly format.
   * Example input: { h: 1, s: 1, v: 1, a: 0.3 }
   * Example output: hsva(1, 1, 1, 0.3)
   * This isn't provided by the Colord package, so we made our own.
   * @param hsva 
   * @returns 
   */
  function hsvaToReadable(hsva: HsvaColor) {
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
        <RgbaColorPicker
          color={colorRgbaObject}
          onChange={colorChange}
        />

        {colorColordInstance && (
          <div className="text-sm text-center mt-2">
            {format === "hex" && <p><strong>HEX:</strong> {colorColordInstance.toHex()}</p>}
            {format === "rgba" && <p><strong>RGB:</strong> {colorColordInstance.toRgbString()}</p>}
            {format === "hsl" && <p><strong>HSL:</strong> {colorColordInstance.toHslString()}</p>}
            {format === "hsv" && <p><strong>HSV:</strong> {hsvaToReadable(colorColordInstance.toHsv())}</p>}
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

        {/* EyeDropper */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={pickColor}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Pick Color
          </button>

          {colorValue && (
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 border"
                style={{ backgroundColor: colorValue }}
              ></div>
              <p>{colorValue}</p>
            </div>
          )}
        </div>
      </div>
    </div>

  );
}