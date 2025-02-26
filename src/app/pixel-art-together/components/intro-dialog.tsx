'use client'

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";

export function IntroDialog({
  loading = true,
  shouldCreateCanvas = false,
  maxPixels = 2600,
  createCanvas,
  setName
}: {
  loading: boolean,
  shouldCreateCanvas: boolean,
  maxPixels: number,
  createCanvas: ({ detail }: { detail: { name: string; width: number; height: number; } }) => void,
  setName: ({ detail }: { detail: { name: string } }) => void
}) {
  // Min and max width/height for canvas
  const pixelSizeMin: number = 2;
  const pixelSizeMax: number = 48;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalName(localStorage.getItem("name") || "");
    }
  }, []);

  const [name, setLocalName] = useState<string>("");
  const [width, setWidth] = useState<number>(16)
  const [height, setHeight] = useState<number>(16)
  const [open, setOpen] = useState<boolean>(true)
  const [maxLayerCount, setMaxLayerCount] = useState<number>(Math.floor(maxPixels / (width * height)))

  useEffect(() => {
    const newMaxLayerCount = Math.floor(maxPixels / (width * height))
    setMaxLayerCount(newMaxLayerCount)
  }, [maxPixels, width, height])

  // Submit dialog events
  function submitDialog() {
    if (shouldCreateCanvas) {
      const detail = { name, width, height }
      createCanvas({ detail })
    } else {
      const detail = { name }
      setName({ detail })
    }

    setOpen(false)
    localStorage?.setItem("name", name); // this is done because same component is used in fallback UI (static content)
  }

  // Submit dialog when return key pressed in input
  function handleInputKeyDown({ code }: { code: KeyboardEvent["code"] }) {
    if (code === "Enter") {
      setTimeout(() => submitDialog(), 20);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          asasas
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
              onChange={(e) => setName({ detail: { name: e.target.value } })}
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