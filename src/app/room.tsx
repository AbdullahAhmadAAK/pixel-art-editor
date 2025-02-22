"use client";

import { ReactNode, useEffect, useState } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { Layer } from "@/lib/types/pixel-art-editor/layer";
import { Tool } from "@/lib/types/pixel-art-editor/tool";
import { PixelColor } from "@/lib/types/pixel-art-editor/pixel-color";
import { PixelKey } from "@/lib/types/pixel-art-editor/pixel-key";
import { LiveObject } from '@liveblocks/client';
import { createRoomId } from "./pixel-art-together/lib/utils/create-room-id";

export function Room({ children }: { children: ReactNode }) {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState<boolean>(false)

  useEffect(() => {
    const generatedRoomId = createRoomId();
    setRoomId(generatedRoomId)
    setLoaded(true)
  }, [])

  if (!loaded) return;

  return (
    <LiveblocksProvider
      authEndpoint={'/api/auth'}
    >
      <RoomProvider
        id={"sveltekit-pixel-art-" + roomId}
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

export function IntroDialogFallback() {
  return (
    <></>
  );
}