"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react";
import { Layer, Tool } from "@/lib/types";
import { LiveObject } from '@liveblocks/client';
import { PixelColor, PixelKey } from "./pixel-art-together/page";
// import { IntroDialog } from "@/components/live-blocks/intro-dialog";

export function Room({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}>
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
    <></>

  );
}