import type { LiveblocksPresence } from "@/lib/types/pixel-art-editor/liveblocks-presence";
import type { LiveblocksStorage } from "@/lib/types/pixel-art-editor/liveblocks-storage";
import { LiveblocksUserMeta } from "@/lib/types/pixel-art-editor/liveblocks-user-meta";
declare global {
  interface Liveblocks {
    Presence: LiveblocksPresence,
    Storage: LiveblocksStorage;
    UserMeta: LiveblocksUserMeta
  }
}