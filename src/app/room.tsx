"use client";

// React & Hooks
import { JSX, ReactNode, useEffect, useState } from "react";

// Third-Party Libraries
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react";

// Utilities & Helpers
import { createRoomId } from "./pixel-art-together/utils/create-room-id";

// Defaults
import { INITIAL_LIVEBLOCKS_PRESENCE, INITIAL_LIVEBLOCKS_STORAGE } from "./pixel-art-together/utils/defaults";

/**
 * Room Component
 *
 * This component initializes and provides a Liveblocks collaborative room
 * using LiveblocksProvider and RoomProvider. It generates a unique room ID
 * on mount and ensures the room is loaded before rendering.
 *
 * @param {Object} props - Component properties.
 * @param {ReactNode} props.children - The child components wrapped by the room.
 *
 * @returns {JSX.Element | undefined} The Liveblocks room provider wrapping children.
 * Returns `undefined` if the component is still loading.
 *
 * @example
 * <Room>
 *   <Canvas />
 * </Room>
 */
export function Room({ children }: { children: ReactNode }): JSX.Element | undefined {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    const generatedRoomId = createRoomId();
    setRoomId(generatedRoomId);
    setLoaded(true);
  }, []);

  // This is to prevent rendering of any element before the page is mounted
  if (!loaded) return;

  return (
    <LiveblocksProvider authEndpoint={'/api/auth'}>
      <RoomProvider
        id={makeFullRoomName(roomId)}
        initialPresence={INITIAL_LIVEBLOCKS_PRESENCE}
        initialStorage={INITIAL_LIVEBLOCKS_STORAGE}
      >
        <ClientSideSuspense fallback={IntroDialogFallback()}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

/**
 * Fallback UI component for when Liveblocks functions have not loaded yet.
 * It renders an empty fragment to prevent UI distortion during the initial render.
 *
 * @returns {JSX.Element} An empty React fragment.
 */
export function IntroDialogFallback(): JSX.Element {
  return <></>;
}

/**
 * Generates a full room name using the provided room ID.
 *
 * @param {string | null} roomId - The unique room ID.
 * @returns {string} The formatted full room name.
 *
 * @example
 * makeFullRoomName("abc123"); // "sveltekit-pixel-art-abc123"
 */
function makeFullRoomName(roomId: string | null): string {
  return `sveltekit-pixel-art-${roomId}`;
}
