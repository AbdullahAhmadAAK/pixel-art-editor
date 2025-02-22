import type { PanelName } from '@/lib/types/pixel-art-editor/panel-name'
import type { Tool } from '@/lib/types/pixel-art-editor/tool'
import { BrushData } from '@/lib/types/pixel-art-editor/brush-data';

export type LiveblocksPresence = {
  name: string,
  brush?: BrushData | null,
  selectedLayer: number,
  cursor: { x: number, y: number, area: PanelName } | null,
  tool: Tool,
  mouseDown: boolean,
}