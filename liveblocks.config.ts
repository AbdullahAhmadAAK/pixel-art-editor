import type { LiveblocksPresence } from "@/lib/types/pixel-art-editor/liveblocks-presence";
import type { LiveblocksStorage } from "@/lib/types/pixel-art-editor/liveblocks-storage";
import { LiveblocksUserMeta } from "@/lib/types/pixel-art-editor/liveblocks-user-meta";

declare global {
  /**
    * Definitions for Liveblocks state:
    * 
    * (1) Presence: A per-user, real-time state that updates dynamically as the user interacts with the app.
    *     It resets when the user disconnects.
    * 
    * (2) Storage: A shared persistent state that all users can modify. 
    *     This can include layers, pixels, or any other collaborative data.
    * 
    * (3) UserMeta: Metadata about each connected user, such as their ID, name, or avatar. 
    *     Unlike Presence, this is not ephemeral and does not reset on reconnection.
    */
  interface Liveblocks {
    Presence: LiveblocksPresence,
    Storage: LiveblocksStorage;
    UserMeta: LiveblocksUserMeta
  }
}