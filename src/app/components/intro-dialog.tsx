"use client";

// React & Hooks
import { JSX, useEffect, useState } from "react";
import Image from "next/image";

// Internal components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

/**
 * Props for the IntroDialog component.
 * @interface IntroDialogProps
 */
interface IntroDialogProps {
  /**
   * Indicates whether the dialog is in a loading state.
   * @type {boolean}
   */
  loading: boolean;

  /**
   * Determines whether a new canvas should be created.
   * @type {boolean}
   */
  shouldCreateCanvas: boolean;

  /**
   * The maximum number of pixels allowed.
   * @type {number}
   */
  maxPixels: number;

  /**
   * Function to create a canvas with specified dimensions.
   * @param {Object} param - The event detail object.
   * @param {Object} param.detail - The detail containing canvas specifications.
   * @param {string} param.detail.name - The name of the canvas.
   * @param {number} param.detail.width - The width of the canvas.
   * @param {number} param.detail.height - The height of the canvas.
   */
  createCanvas: ({ detail }: { detail: { name: string; width: number; height: number } }) => void;

  /**
   * Function to set the canvas name.
   * @param {Object} param - The event detail object.
   * @param {Object} param.detail - The detail containing the name.
   * @param {string} param.detail.name - The name to be set.
   */
  setName: ({ detail }: { detail: { name: string } }) => void;
}

/**
 * A dialog component for creating a pixel canvas or setting a user name.
 *
 * @component
 * @param {IntroDialogProps} props - Component props
 * @returns {JSX.Element} The IntroDialog component.
 */
export function IntroDialog({
  loading = true,
  shouldCreateCanvas = false,
  maxPixels = 2600,
  createCanvas,
  setName
}: IntroDialogProps): JSX.Element {
  // Min and max width/height for canvas
  const pixelSizeMin: number = 2;
  const pixelSizeMax: number = 48;

  // Local name is what gets shown on the dialog. The user can change it as he likes until he is sure about it.
  // Once it's confirmed, the setName function can then mark the UI outside the dialog with the finalized name
  const [name, setLocalName] = useState<string>("");
  const [width, setWidth] = useState<number>(16);
  const [height, setHeight] = useState<number>(16);
  const [open, setOpen] = useState<boolean>(true);
  const [maxLayerCount, setMaxLayerCount] = useState<number>(Math.floor(maxPixels / (width * height)));

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalName(localStorage.getItem("name") || "");
    }
  }, []);

  useEffect(() => {
    const newMaxLayerCount = Math.floor(maxPixels / (width * height));
    setMaxLayerCount(newMaxLayerCount);
  }, [maxPixels, width, height]);

  /**
   * Handles submission of the dialog.
   * Determines whether to create a canvas or just set the user name.
   */
  function submitDialog() {
    if (shouldCreateCanvas) {
      const detail = { name, width, height };
      createCanvas({ detail });
    } else {
      const detail = { name };
      setName({ detail });
    }

    setOpen(false);
    localStorage?.setItem("name", name); // Store name for fallback UI
  }

  /**
   * Handles keydown event in the input field.
   * Submits dialog if the Enter key is pressed.
   *
   * @param {Object} event - Keyboard event object.
   * @param {string} event.code - Key code of the pressed key.
   */

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const { code } = event;
    if (code === "Enter") {
      setTimeout(() => submitDialog(), 20);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Create a Pixel Canvas</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center">
          <Image
            alt="Pixel art together"
            className="block max-w-full"
            src="/liveblocks/logo.svg"
            width={100}
            height={100}
          />
          <div className="w-full mt-4">
            <label className="text-sm font-semibold text-gray-500">Name</label>
            <Input
              className="mt-1"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => { setLocalName(e.target.value) }}
              onKeyDown={handleInputKeyDown}
            />
          </div>

          {shouldCreateCanvas && !loading && (
            <>
              <div className="w-full mt-4">
                <label className="text-sm font-semibold text-gray-500">Height</label>
                <Slider
                  min={pixelSizeMin}
                  max={pixelSizeMax}
                  value={[height]}
                  onValueChange={(value) => setHeight(value[0])}
                />
                <div className="text-right text-lg font-medium text-gray-600">{height}</div>
              </div>

              <div className="w-full mt-4">
                <label className="text-sm font-semibold text-gray-500">Width</label>
                <Slider
                  min={pixelSizeMin}
                  max={pixelSizeMax}
                  value={[width]}
                  onValueChange={(value) => setWidth(value[0])}
                />
                <div className="text-right text-lg font-medium text-gray-600">{width}</div>
              </div>

              <div className="pt-3 text-sm font-semibold text-gray-500">
                Maximum layers are <span className="text-gray-600 font-bold">{maxLayerCount}</span>
              </div>
            </>
          )}
          <Button className="mt-5 w-full" onClick={submitDialog} disabled={loading}>
            {loading ? "Loading..." : shouldCreateCanvas ? "Create Canvas" : "Set Name"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}