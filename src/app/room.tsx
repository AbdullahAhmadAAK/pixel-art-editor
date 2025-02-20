"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { Layer, Tool } from "@/lib/types";
import { LiveObject } from '@liveblocks/client';
import { PixelColor, PixelKey } from "./pixel-art-together/page";
// import { IntroDialog } from "@/components/live-blocks/intro-dialog";

export function Room({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY}>
      <RoomProvider
        id="your-room-id"
        initialPresence={{
          name: "",
          selectedLayer: 0,
          cursor: null,
          tool: Tool.Brush,
          mouseDown: false,
        }}

        initialStorage={{
          pixelStorage: new LiveObject<Record<PixelKey, PixelColor>>({}),
          layerStorage: new LiveObject<Record<number, Layer>>({})
        }}

      >
        <ClientSideSuspense
          fallback={IntroDialogFallback()}
        >
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

// TODO: maybe this is taking time to be rendered on client, so why not have this from server?
export function IntroDialogFallback() {
  return (
    // <div className="absolute inset-0 z-50 flex items-center justify-center">
    //   <IntroDialog
    //     // maxPixels={maxPixels}
    //     maxPixels={0}
    //     loading={true}
    //     shouldCreateCanvas={false}
    //     // on:createCanvas={createCanvas}
    //     // on:setName={setName}
    //     createCanvas={() => { }}
    //     setName={() => { }}
    //   />
    // </div>

    // TODO: this is static content
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg min-w-[300px] max-w-[300px] ">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">My Modal</h2>
          <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div>
          <p>This is a simple modal.</p>
        </div>

        {/* Modal Footer */}
        <div className="mt-4 flex justify-end">
          <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md">
            Close
          </button>
        </div>
      </div>
    </div>

  );
}