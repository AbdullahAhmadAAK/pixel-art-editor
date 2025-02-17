import { useEffect, useRef, useState } from "react";
import logo from "/public/liveblocks/logo.svg";
import '@shoelace-style/shoelace/dist/shoelace.css'; // Import Shoelace styles
// import dialog from "@shoelace-style/shoelace/dist/components/dialog/dialog.js";

import SlDialog, { SlRequestCloseEvent } from '@shoelace-style/shoelace/dist/react/dialog/index.js';
import SlInput, { SlChangeEvent } from '@shoelace-style/shoelace/dist/react/input/index.js';
import SlButton from '@shoelace-style/shoelace/dist/react/button/index.js';
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
  createCanvas: ({ detail }: {
    detail: {
      name: string;
      width: number;
      height: number;
    };
  }) => void,
  setName: ({ detail }: {
    detail: {
      name: string
    }
  }) => void
}) {
  // let dialog;
  // TODO: can't find the TS for SLDialog
  const dialogRef = useRef<HTMLElement | null>(null)

  // Min and max width/height for canvas
  const pixelSizeMin: number = 2;
  const pixelSizeMax: number = 48;

  // Default name and sizes
  // let name: string = localStorage.getItem("name") || "";
  const [name, setLocalName] = useState<string>(localStorage.getItem("name") || "") // setName is an external function passed as prop, so name of setter is a bit different here

  // let width: number = 16;
  const [width, setWidth] = useState<number>(16)

  // let height: number = 16;
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
      // dispatch("createCanvas", { name, width, height });
      const detail = { name, width, height }
      createCanvas({ detail })
    } else {
      // dispatch("setName", { name });
      const detail = { name }
      setName({ detail })
    }
    localStorage.setItem("name", name);
  }

  // Submit dialog when return key pressed in input
  // TODO: could improve from string to more precise one
  function handleInputKeyDown({ code }: { code: string }) {
    if (code === "Enter") {
      setTimeout(() => submitDialog(), 20);
    }
  }

  // Equivalent of onmount and ondestroy
  useEffect(() => {
    const dialogElement = dialogRef.current

    // Load components and prevent closing
    const loadComponents = async () => {
      await import('@shoelace-style/shoelace/dist/components/dialog/dialog.js');

      if (dialogElement) {
        dialogElement.addEventListener('sl-request-close', cancelClose);
      }

      await import('@shoelace-style/shoelace/dist/components/range/range.js');
    };

    loadComponents();

    // Cleanup on component unmount
    return () => {
      if (dialogElement) {
        dialogElement.removeEventListener('sl-request-close', cancelClose);
      }
    };
  })

  return (
    <SlDialog
      ref={dialogRef} // TOOD: fix ts
      label="Create a pixel canvas"
      no-header
      open
      style={{ width: '300px' }} // TODO: is this the same as below
    // style="--width: 300px;"
    >
      <div className="flex flex-col">
        <h1 className="mt-2.5 text-2xl">
          <Image
            alt="Pixel art together"
            className="mx-auto block max-w-full"
            src={logo}
          />
        </h1>

        <SlInput
          className="mt-5"
          onKeyDown={handleInputKeyDown}
          onSlInput={(e) => {
            // TODO: check this out later, fix TS
            if (e?.target?.value)
              setLocalName(e?.target?.value)
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
                    if (e?.target?.value) {
                      setHeight(e?.target?.value)
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
                    if (e?.target?.value) {
                      setWidth(e?.target?.value)
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