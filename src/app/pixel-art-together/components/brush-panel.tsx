'use client'

// React & Hooks
import { JSX, useEffect, useState } from "react";
import { useMyPresence } from "@liveblocks/react";

// Third-Party Libraries
import { Colord, colord, RgbaColor } from "colord";
import { RgbaColorPicker } from "react-colorful";

// Utilities & Helpers
import { hsvaToReadable } from "../utils/hsva-to-readable";
import { pickEyedropperColor } from "../utils/pick-eyedropper-color";

// Types
import { BrushData } from "@/lib/types/pixel-art-editor/brush-data";
import { Tool } from "@/lib/types/pixel-art-editor/tool";
import { Swatch } from "../../../lib/types/pixel-art-editor/swatch";
import { RGBA } from "@/lib/types/pixel-art-editor/rgba";
import { RGB } from "@/lib/types/pixel-art-editor/rgb";

// Defaults & Configurations
import { DEFAULT_BRUSH_DATA } from "@/app/pixel-art-together/utils/defaults";
import { possibleFormats } from "../utils/possible-formats";

interface BrushPanelProps {
  handleBrushChange: ({ detail }: { detail: BrushData }) => void;
  updateColor: (hex: string) => void;
  colorValue: string;
  swatch: Swatch
}

/**
 * BrushPanel Component
 *
 * This component provides a UI panel for selecting a brush color. It allows users to choose a color 
 * from a predefined swatch or input a custom color. The selected color is managed both internally 
 * and externally through props.
 *
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {function} props.handleBrushChange - Callback function triggered when the brush changes. 
 *        It receives an event with `detail` containing `BrushData`.
 * @param {function} props.updateColor - Function to update the selected color externally.
 * @param {string} [props.colorValue=""] - The current color value (controlled externally).
 * @param {Swatch} [props.swatch=[]] - Array of predefined color swatches.
 *
 * @returns {JSX.Element} The BrushPanel UI component.
 */
export function BrushPanel({
  handleBrushChange,
  updateColor,
  colorValue = "",
  swatch = []
}: BrushPanelProps): JSX.Element {
  // -----------------------------------
  // State
  // -----------------------------------

  // useMyPresence causes a re-render whenever the presence state changes, which is fine as we do want the component to be dependent on myPresence
  const [myPresence, updateMyPresence] = useMyPresence();
  const [brush, setBrush] = useState<BrushData>(DEFAULT_BRUSH_DATA)
  const [colorRgbaObject, setColorRgbaObject] = useState<RGBA>({ r: 255, g: 0, b: 0, a: 1 });
  const [colorColordInstance, setColorColordInstance] = useState<Colord | null>(null)
  const [format, setFormat] = useState<(typeof possibleFormats)[number]>("hex");

  // -----------------------------------
  // useEffect blocks
  // -----------------------------------

  /** This will change the brush state across the app when we change it from our brush panel component */
  useEffect(() => {
    handleBrushChange({ detail: brush })
  }, [brush, handleBrushChange])

  /**
 * Synchronizes state whenever `colorRgbaObject` changes.
 *
 * This effect is triggered whenever `colorRgbaObject` is updated.
 * It performs the following side effects:
 *
 * 1. Creates a new `colord` instance from `colorRgbaObject` and stores it in state.
 * 2. Converts the color to a hex format and updates the parent component via `updateColor`.
 * 3. Extracts the RGBA values from `colord`, ensuring the alpha (`a`) value is defined.
 * 4. Constructs an RGB object without the alpha value.
 * 5. Updates the brush state with:
 *    - The hex color
 *    - The opacity value (`a`)
 *    - The RGB representation of the color
 *
 * Dependencies: This effect runs when `colorRgbaObject` or `updateColor` change.
 */
  useEffect(() => {
    const newColordInstance = colord(`rgba(${colorRgbaObject.r}, ${colorRgbaObject.g}, ${colorRgbaObject.b}, ${colorRgbaObject.a})`);
    setColorColordInstance(newColordInstance);

    updateColor(newColordInstance.toHex());

    const newRgbaColorObject: Partial<RgbaColor> = newColordInstance.toRgb(); // Partial makes 'a' optional

    if (newRgbaColorObject.a === undefined) {
      newRgbaColorObject.a = 1; // Ensure 'a' is defined, as we need it for setting opacity of brush
    }

    const chosenOpacity = newRgbaColorObject.a;
    const rgbColorObject: RGB = {
      r: newRgbaColorObject.r! as number,
      g: newRgbaColorObject.g! as number,
      b: newRgbaColorObject.b! as number
    };

    setBrush({
      color: newColordInstance.toHex(),
      opacity: chosenOpacity,
      rgb: rgbColorObject
    });
  }, [colorRgbaObject, updateColor]);

  // -----------------------------------
  // Functions
  // -----------------------------------

  /**
 * Handles the click event for the color picker button.
 * 
 * This function serves as a wrapper around `pickEyedropperColor`, ensuring 
 * that the function is called with the correct argument (`setColorRgbaObject`) 
 * without causing TypeScript type mismatches.
 * 
 * @param {React.MouseEvent<HTMLButtonElement>} event - The click event from the button.
 * @returns {Promise<void>} A promise that resolves after picking the color.
 */
  const handlePickColor = async (event: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    event.preventDefault(); // Prevents any default button behavior
    await pickEyedropperColor(setColorRgbaObject);
  };

  /**
 * Updates the color state and switches the tool from "eraser" to "brush" if necessary.
 *
 * This function updates the `setColorRgbaObject` state, which will automatically trigger
 * a `useEffect` block to handle the side-effects.
 *
 * If the current tool is an "eraser", it updates the presence state to switch back to the "brush".
 *
 * @param {RGBA} colorValueObject - The new RGBA color value to be set.
 */
  function colorChange(colorValueObject: RGBA): void {
    setColorRgbaObject(colorValueObject); // This will automatically trigger useEffect for further updates

    if (myPresence.tool === Tool.Eraser) {
      updateMyPresence({ tool: Tool.Brush });
    }
  }

  /**
 * Cycles through the available formats in `possibleFormats` and updates the state.
 *
 * This function finds the current format in the `possibleFormats` array and updates 
 * it to the next format in the sequence. If the last format is reached, it loops 
 * back to the first format.
 *
 * @returns {void}
 */
  const toggleFormat = (): void => {
    setFormat((prev) => {
      const currentIndex = possibleFormats.indexOf(prev);
      return possibleFormats[(currentIndex + 1) % possibleFormats.length];
    });
  };

  // -----------------------------------
  // TSX
  // -----------------------------------

  return (
    <div className="p-5 pb-2 md:block hidden">
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
            onClick={handlePickColor}
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