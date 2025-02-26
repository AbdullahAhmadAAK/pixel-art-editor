import { BrushData } from '@/lib/types/pixel-art-editor/brush-data';
import { Tool } from '@/lib/types/pixel-art-editor/tool';
import { useMyPresence, useUpdateMyPresence } from "@liveblocks/react";
import { useEffect, useState } from "react";
import { DEFAULT_BRUSH_DATA } from '@/app/pixel-art-together/lib/utils/defaults';
import { Swatch } from '@/app/pixel-art-together/lib/utils/swatch';

import { hsvaToReadable } from '../lib/utils/hsva-to-readable';
import { RgbaColorPicker } from "react-colorful";
import { Colord, colord, RgbaColor } from "colord";
import { hexToRgba } from '../utils/hex-to-rgb';
import { RGBA } from '@/lib/types/pixel-art-editor/rgba';
import { RGB } from '@/lib/types/pixel-art-editor/rgb';

interface MobileColorPickerProps {
  handleBrushChange: ({ detail }: { detail: BrushData }) => void,
  updateColor: (hex: string) => void; // this will allow the color value to be set from within the component, as well as outside of it
  swatch: Swatch,
  colorValue: string;
  setColorValue: (colorValue: string) => void;
}

export function MobileColorPicker({
  handleBrushChange,
  updateColor,
  swatch,
  colorValue,
  setColorValue
}: MobileColorPickerProps) {

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
      rgb: rgbColorObject
    })

  }, [colorRgbaObject, updateColor])

  const possibleFormats = ["hex", "rgba", "hsl", "hsv"] as const;
  const [format, setFormat] = useState<(typeof possibleFormats)[number]>("hex");

  const toggleFormat = () => {
    setFormat((prev) => {
      const currentIndex = possibleFormats.indexOf(prev);
      return possibleFormats[(currentIndex + 1) % possibleFormats.length];
    });
  };

  const [showColorPicker, setShowColorPicker] = useState<boolean>(false)

  return (
    <div className='relative'>
      <button
        className='rounded-full w-12 h-12'
        style={{ backgroundColor: colorValue }}
        onClick={() => setShowColorPicker(!showColorPicker)}
      />

      {showColorPicker && (
        <div className='p-4 absolute top-[-520px] left-[-200px] w-60 h-[500px] bg-gray-300 border border-black'>

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
      )}

    </div>
  );
}