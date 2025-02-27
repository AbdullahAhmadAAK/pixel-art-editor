import type { PanelName } from '@/lib/types/pixel-art-editor/panel-name';
import type { Tool } from '@/lib/types/pixel-art-editor/tool';
import { BrushData } from '@/lib/types/pixel-art-editor/brush-data';

/**
 * Represents the real-time presence of a user in Liveblocks.
 */
export type LiveblocksPresence = {
  /** User's display name */
  name: string;
  /** Data for the user's active brush tool, if applicable */
  brush?: BrushData | null;
  /** The currently selected layer index */
  selectedLayer: number;
  /** Cursor position and the panel it is in, or `null` if not present */
  cursor: { x: number; y: number; area: PanelName } | null;
  /** The currently selected tool */
  tool: Tool;
  /** Whether the mouse is currently pressed down */
  mouseDown: boolean;
};
