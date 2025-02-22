'use client'

import { useEffect, useRef, useState } from "react";
import type SlDialogType from '@shoelace-style/shoelace/dist/components/dialog/dialog.component.d.ts'
import SlDialog, { SlRequestCloseEvent } from '@shoelace-style/shoelace/dist/react/dialog/index.js';
import type SlInputType from '@shoelace-style/shoelace/dist/components/input/input.component.d.ts'
import SlInput, { SlChangeEvent } from '@shoelace-style/shoelace/dist/react/input/index.js';
import SlButton from '@shoelace-style/shoelace/dist/react/button/index.js';
import type SlRangeType from '@shoelace-style/shoelace/dist/components/range/range.component.d.ts'
import SlRange from '@shoelace-style/shoelace/dist/react/range/index.js';
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

  const dialogRef = useRef<SlDialogType | null>(null)

  // Min and max width/height for canvas
  const pixelSizeMin: number = 2;
  const pixelSizeMax: number = 48;

  const [name, setLocalName] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalName(localStorage.getItem("name") || "");
    }
  }, []);

  const [width, setWidth] = useState<number>(16)
  const [height, setHeight] = useState<number>(16)

  const [maxLayerCount, setMaxLayerCount] = useState<number>(Math.floor(maxPixels / (width * height)))

  useEffect(() => {
    const newMaxLayerCount = Math.floor(maxPixels / (width * height))
    setMaxLayerCount(newMaxLayerCount)
  }, [maxPixels, width, height])

  // Prevent dialog closing
  function cancelClose(event: SlRequestCloseEvent) {
    event.preventDefault();
  }

  // Submit dialog events
  function submitDialog() {
    if (shouldCreateCanvas) {
      const detail = { name, width, height }
      createCanvas({ detail })
    } else {
      const detail = { name }
      setName({ detail })
    }
    localStorage?.setItem("name", name); // this is done because same component is used in fallback UI (static content)
  }

  // Submit dialog when return key pressed in input
  function handleInputKeyDown({ code }: { code: KeyboardEvent["code"] }) {
    if (code === "Enter") {
      setTimeout(() => submitDialog(), 20);
    }
  }

  useEffect(() => {
    const dialogElement = dialogRef.current

    // Load components and prevent closing
    const loadComponents = async () => {
      if (dialogElement) {
        dialogElement.addEventListener('sl-request-close', cancelClose);
        dialogElement.show()
      }
    };

    loadComponents();

    // Cleanup on component unmount
    return () => {
      if (dialogElement) {
        dialogElement.removeEventListener('sl-request-close', cancelClose);
      }
    };
  }, [])

  return (
    <SlDialog
      ref={dialogRef}
      label="Create a pixel canvas"
      no-header
      style={{
        '--width': '300px',
        '--height': 'auto',
        '--max-height': '600px',
        '--min-height': '600px'
      } as object}
    >
      <div className="flex flex-col">
        <h1 className="mt-2.5 text-2xl">
          <Image
            alt="Pixel art together"
            className="mx-auto block max-w-full"
            src={'/liveblocks/logo.svg'}
            width={100}
            height={100}
          />
        </h1>

        <SlInput
          className="mt-5"
          onKeyDown={handleInputKeyDown}
          onSlInput={(e) => {
            const target = e.target as SlInputType
            if (target) {
              setLocalName(target.value)
            }
          }}
          placeholder="Enter your name"
          value={name}
        >
          <div className="pb-1.5 text-sm font-semibold text-gray-500" slot="label">
            Name
          </div>
        </SlInput>


        {shouldCreateCanvas && !loading && (
          <>
            <div className="mt-5 flex items-end gap-4">
              <div className="flex-shrink flex-grow">
                <SlRange
                  min={pixelSizeMin}
                  max={pixelSizeMax}
                  value={height}
                  onSlChange={(e: SlChangeEvent) => {
                    const target = e.target as SlRangeType
                    if (target) {
                      setHeight(target.value)
                    }
                  }}
                >
                  <div slot="label" className="pb-1 text-sm font-semibold text-gray-500">
                    Height
                  </div>
                </SlRange>
              </div>
              <div className="w-6 text-right text-lg font-medium text-gray-600">
                {height}
              </div>
            </div>

            <div className="mb-2 mt-5 flex items-end gap-4">
              <div className="flex-shrink flex-grow">
                <SlRange
                  min={pixelSizeMin}
                  max={pixelSizeMax}
                  value={width}
                  onSlChange={(e: SlChangeEvent) => {
                    const target = e.target as SlRangeType
                    if (target) {
                      setWidth(target.value)
                    }
                  }}
                >
                  <div slot="label" className="pb-1 text-sm font-semibold text-gray-500">
                    Width
                  </div>
                </SlRange>
              </div>
              <div className="w-6 text-right text-lg font-medium text-gray-600">
                {width}
              </div>
            </div>

            <div className="pt-3 text-sm font-semibold text-gray-500">
              Maximum layers are <span className="text-gray-600 font-bold">{maxLayerCount}</span>
            </div>
          </>
        )}

        <SlButton className="mt-5" loading={loading} onClick={submitDialog} variant="primary">
          {shouldCreateCanvas ? "Create canvas" : "Set name"}
        </SlButton>
      </div>
    </SlDialog >
  );
}