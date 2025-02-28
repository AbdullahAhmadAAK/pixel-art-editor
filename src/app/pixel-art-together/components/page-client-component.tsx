'use client'

// React & Hooks
import { useCallback, useState, useEffect, useRef } from 'react';
import Image from 'next/image';

// Third-Party Libraries
import { motion, useSpring } from "framer-motion";
import { useMyPresence, useOthers, useSelf, useUndo, useRedo } from "@liveblocks/react";
import { useStorage, useMutation } from "@liveblocks/react";

// Utilities & Helpers
import { formatLayers } from "../utils/format-layers";
import { generateLayer } from "../utils/generate-layer";
import { getFillPixels } from "../utils/get-fill-pixels";
import { getMovePixels } from "../utils/get-move-pixels";

// Types
import { Direction } from '@/lib/types/pixel-art-editor/direction';
import { Tool } from '@/lib/types/pixel-art-editor/tool';
import { Layer } from '@/lib/types/pixel-art-editor/layer';
import { PanelName } from '@/lib/types/pixel-art-editor/panel-name';
import { PixelStorage } from '@/lib/types/pixel-art-editor/pixel-storage';
import { PixelObject } from '@/lib/types/pixel-art-editor/pixel-object';
import { PixelKey } from '@/lib/types/pixel-art-editor/pixel-key';
import { BrushData } from '@/lib/types/pixel-art-editor/brush-data';
import { Swatch } from "../../../lib/types/pixel-art-editor/swatch";

// Defaults & Configurations
import { DEFAULT_BRUSH_DATA, DEFAULT_PIXEL_COLOR_NAME, DEFAULT_SWATCH_COLOR, INITIAL_LIVEBLOCKS_PRESENCE } from '@/app/pixel-art-together/utils/defaults';

// Internal Components
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Cursor } from "@/app/pixel-art-together/components/cursor";
import { IntroDialog } from "@/app/pixel-art-together/components/intro-dialog";
import { BrushPanel } from "@/app/pixel-art-together/components/brush-panel";
import { LayersPanel } from '@/app/pixel-art-together/components/layers-panel';
import { ExportsPanel } from "@/app/pixel-art-together/components/exports-panel";
import { SharePanel } from "@/app/pixel-art-together/components/share-panel";
import { MobileLinksPanel } from "@/app/pixel-art-together/components/mobile-links-panel";
import { LinksPanel } from "@/app/pixel-art-together/components/links-panel";
import { UserOnline } from '@/app/pixel-art-together/components/user-online';
import { PixelGrid as PixelGridSegment } from '@/app/pixel-art-together/components/pixel-grid';
import { MobileColorPicker } from '@/app/pixel-art-together/components/mobile-color-picker';
import { CustomTooltip } from "@/components/custom-tooltip";

// Import CSS
import '../pixel-art-styles.css'
import { PixelColor } from '@/lib/types/pixel-art-editor/pixel-color';

// Note: I kept the order of the state, useEffect blocks etc. the same as the way the original developer kept them. I did add documentation though.

/**
 * @fileoverview The core client-side component for the pixel art editor, 
 * inspired by [PixelArt Liveblocks](https://pixelart.liveblocks.app/).
 * 
 * This component integrates all the primary features and tools required 
 * for collaborative pixel art creation.
 * 
 * Features include:
 * - **Real-time Collaboration**: Uses `@liveblocks/react` hooks to sync user actions.
 * - **Pixel Manipulation**: Utilities for filling and moving pixels.
 * - **Undo/Redo Support**: Enables users to revert or redo actions.
 * - **Layer Management**: Handles structured artwork creation with layers.
 * - **Brush Customization**: Supports multiple brushes and swatches.
 * - **Export & Sharing**: Allows saving and sharing artwork.
 * - **Interactive UI**: Includes color pickers, pixel grids, and tool panels.
 * 
 * This component acts as the main entry point for the pixel art editor, 
 * handling state, user actions, and rendering essential UI elements.
 * 
 * @module PixelArtEditorClientComponent
 */
export default function PixelArtEditorClientComponent() {
  // The current user's presence in the Liveblocks session.  
  // useMyPresence causes a re-render whenever the presence state changes, which is fine as we do want the component to be dependent on myPresence
  const [myPresence, updateMyPresence] = useMyPresence();

  // Other users currently in the Liveblocks session.
  const others = useOthers()

  // The current user's metadata and session information.
  const self = useSelf();

  /**
 * Initializes the user's presence when the component mounts.
 * 
 * The presence state is set to `INITIAL_LIVEBLOCKS_PRESENCE`, ensuring that
 * each user has an initial state upon joining.
 */
  useEffect(() => {
    updateMyPresence(INITIAL_LIVEBLOCKS_PRESENCE);
  }, [updateMyPresence])

  /**
  * Pixels are stored inside pixelStorage as individual properties in an object.
  * Liveblocks storage reference for pixel data, synced across all users. This is subscribed to, so any changes to it from other users cause a rerender.
  * A red pixel on layer 0, row 1, column 2:
  *
  * pixelStorage = {
  *   0_1_2: "red",
  *   // ...
  *   }
  */
  const pixelStorage = useStorage((root) => root.pixelStorage);

  // Liveblocks storage reference for layer data, synced across all users. This is subscribed to, so any changes to it from other users cause a rerender.
  const layerStorage = useStorage((root) => root.layerStorage);

  /**
   * This is the max number of pixels that are allowed on 1 room by our system. We have this in place to prevent abuse of resources 
   */
  const maxPixels: number = 2600;

  /**
   * Converts a pixel object into a unique pixel key.
   * 
   * The key format follows `{layer}_{row}_{col}`, where:
   * - `layer`: The selected layer ID.
   * - `row`: The row index of the pixel.
   * - `col`: The column index of the pixel.
   * 
   * @constant
   * @type {Function}
   * @param {PixelObject} pixel - The pixel object containing `row`, `col`, and optional `layer`.
   * @returns {PixelKey} The unique pixel key string.
   */
  const pixelToKey = useCallback(({ layer = myPresence.selectedLayer, row, col }: PixelObject): PixelKey => {
    return `${layer}_${row}_${col}`;
  }, [myPresence.selectedLayer]);

  /**
   * Converts a pixel key back into a pixel object.
   * 
   * The key is split into `{layer, row, col}`, converting numeric values from strings.
   * 
   * @constant
   * @type {Function}
   * @param {PixelKey} key - The pixel key string in the format `{layer}_{row}_{col}`.
   * @returns {PixelObject} The pixel object containing `layer`, `row`, and `col`.
   */
  const keyToPixel = useCallback((key: PixelKey): PixelObject => {
    const [layer, row, col] = key.split("_").map((num) => parseInt(num));
    return { layer, row, col };
  }, []);

  /**
   * Retrieves the stored pixel data based on a pixel object.
   * 
   * - If no `pixelStorage` is available, returns a default color.
   * - If the stored value is a string, it is treated as a color.
   * - Otherwise, it returns the stored pixel object.
   * 
   * @constant
   * @type {Function}
   * @param {PixelObject} pixelProps - The pixel object containing `layer`, `row`, and `col`.
   * @returns {{ color: string }} The pixel's color information.
   */
  const getPixel = useCallback((pixelProps: PixelObject) => {
    if (!pixelStorage) return { color: DEFAULT_PIXEL_COLOR_NAME };

    const stored = pixelStorage[pixelToKey(pixelProps)];
    if (!stored) {
      return { color: DEFAULT_PIXEL_COLOR_NAME };
    }
    if (typeof stored === "string") {
      return { color: stored };
    }
    return stored;
  }, [pixelStorage, pixelToKey]);

  /**
 * Updates an array of pixels within Liveblocks storage.
 * 
 * - If `newVal` is provided, it will replace the pixel's value.
 * - If `newVal` is not provided, existing values are retained (used in `handleLayerMove`).
 * - Updates only the required pixels without affecting the rest.
 * 
 * @constant
 * @type {Function}
 * @param {object} context - The storage context from Liveblocks.
 * @param {PixelObject[]} pixelArray - The array of pixels to update.
 * @param {string} [newVal] - The new value (usually `brush.color` or an empty string).
 */
  const updatePixels = useMutation(({ storage }, pixelArray: PixelObject[], newVal: string) => {
    const updatedPixels: PixelStorage = {};
    pixelArray.forEach((pixelProps) =>
      (updatedPixels[pixelToKey(pixelProps)] = pixelProps.value || newVal)
    );

    // Retrieve the pixel storage object from Liveblocks
    const pixelStorageLiveObject = storage.get('pixelStorage');

    // Update only the necessary pixels in Liveblocks storage
    Object.keys(updatedPixels).map((key) => {
      pixelStorageLiveObject.set(key, updatedPixels[key]);
    });
  }, []);

  /**
   * State to store the formatted layer data.
   * 
   * - Layers are updated whenever `pixelStorage` or `layerStorage` changes.
   * - The layers are formatted into a single array for easier rendering.
   * 
   * @constant
   * @type {[Layer[], Function]}
   */
  const [layers, setLayers] = useState<Layer[]>([]);

  /**
   * Formats and updates the `layers` state whenever `pixelStorage` or `layerStorage` changes.
   * 
   * - Uses `formatLayers()` utility to combine pixel and layer data.
   * - Ensures the state reflects the latest storage updates.
   * 
   * @effect
   */
  useEffect(() => {
    if (layerStorage && pixelStorage) {
      const formattedLayers = formatLayers({
        pixelStorage,
        layerStorage,
        keyToPixel,
        getPixel,
      });

      setLayers(formattedLayers);
    }
  }, [pixelStorage, layerStorage, keyToPixel, getPixel]);

  /**
   * Indicates whether the canvas is ready for rendering.
   * 
   * - The canvas is considered ready if `pixelStorage` has existing data.
   * 
   * @constant
   * @type {[boolean, Function]}
   */
  const [canvasReady, setCanvasReady] = useState<boolean>(
    pixelStorage ? Object.keys(pixelStorage).length > 0 : false
  );

  /**
   * Indicates if data is still loading to avoid UI jitters.
   * 
   * - Prevents rendering issues by ensuring data is available before updates.
   * 
   * @constant
   * @type {[boolean, Function]}
   */
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  /**
 * Monitors `pixelStorage` and updates `canvasReady` and `isDataLoading` states.
 * 
 * - `canvasReady` is set based on whether `pixelStorage` contains data.
 * - `isDataLoading` is updated after pixelStorage is populated with data, to prevent UI jitters.
 * 
 * @effect
 */
  useEffect(() => {
    const newCanvasReady = pixelStorage ? Object.keys(pixelStorage).length > 0 : false;
    setCanvasReady(newCanvasReady);

    // We delay updating isDataLoading slightly to ensure smooth UI updates 
    // (in the old implementation, pixelStorage having data was the only condition for rendering the UI)
    if (pixelStorage) {
      setIsDataLoading(false);
    }
  }, [pixelStorage]);


  // ================================================================================
  // INTRO DIALOG

  const [nameSet, setNameSet] = useState<boolean>(false) // This represents whether the user has entered his name yet

  /**
 * Updates the user's presence with a new name.
 * 
 * - This function is triggered when a user sets their name.
 * - It updates the `myPresence` state in Liveblocks with the new name.
 * - Also sets `nameSet` to `true`, indicating that the name has been registered.
 *
 * @param {Object} event - Event object containing the detail payload.
 * @param {Object} event.detail - The detail object with user data.
 * @param {string} event.detail.name - The new name of the user.
 */
  const setName = useCallback(({ detail }: { detail: { name: string } }) => {
    updateMyPresence({ name: detail.name });
    setNameSet(true);
  }, [updateMyPresence]);

  /**
   * Updates the pixel storage with a given set of layer pixels. Used when a new canvas is created.
   * 
   * - Iterates over `layerPixels` and updates `pixelStorageLiveObject` in Liveblocks storage.
   * - Each pixel is set using its `pixelKey` as the identifier.
   *
   * @mutation
   * @param {Object} context - The mutation context.
   * @param {Object} context.storage - The Liveblocks storage object.
   * @param {PixelStorage} layerPixels - The pixels to be added or updated.
   */
  const updatePixelStorageWithLayer = useMutation(({ storage }, layerPixels: PixelStorage) => {
    const pixelStorageLiveObject = storage.get('pixelStorage');

    Object.keys(layerPixels).map((pixelKey: PixelKey) => {
      pixelStorageLiveObject.set(pixelKey, layerPixels[pixelKey] as PixelColor);
    });
  }, []);

  /**
   * Initializes the layer storage by setting up a default layer. Used when creating a new canvas.
   * 
   * - Creates a new layer with default settings (opacity: `1`, blend mode: `"normal"`, etc.).
   * - This ensures that at least one layer exists in the storage.
   *
   * @mutation
   * @param {Object} context - The mutation context.
   * @param {Object} context.storage - The Liveblocks storage object.
   */
  const updateLayerStorageWithLayer = useMutation(({ storage }) => {
    const layerStorageLiveObject = storage.get('layerStorage');
    layerStorageLiveObject.set(0, { id: 0, opacity: 1, blendMode: "normal", hidden: false, grid: [] });
  }, []);

  /**
 * Creates a new canvas with the specified name, width, and height.
 *
 * - Generates a default layer with the given width and height.
 * - Initializes all pixels in the layer with `DEFAULT_PIXEL_COLOR_NAME`.
 * - Updates both `pixelStorage` and `layerStorage` accordingly.
 * - Sets the user's name to associate them with the canvas.
 *
 * @param {Object} params - The parameters object.
 * @param {Object} params.detail - The details of the canvas.
 * @param {string} params.detail.name - The name of the user creating the canvas.
 * @param {number} params.detail.width - The width of the canvas in pixels.
 * @param {number} params.detail.height - The height of the canvas in pixels.
 */
  const createCanvas = useCallback(({ detail }: { detail: { name: string; width: number; height: number } }) => {
    if (layerStorage) {
      const defaultLayerPixels = generateLayer({
        layer: 0,
        rows: detail.height,
        cols: detail.width,
        defaultValue: DEFAULT_PIXEL_COLOR_NAME,
      });

      updatePixelStorageWithLayer(defaultLayerPixels);
      updateLayerStorageWithLayer();
      setName({ detail });
    }
  }, [layerStorage, setName, updatePixelStorageWithLayer, updateLayerStorageWithLayer]);

  // ================================================================================
  // CANVAS

  /**
 * Function for undoing storage changes.
 */
  const undo = useUndo();

  /**
 * Function for redoing storage changes.
 */
  const redo = useRedo();

  /**
   * State to determine whether the grid is displayed on the canvas.
   * @type {boolean}
   */
  const [showGrid, setShowGrid] = useState<boolean>(false);

  /**
   * State to determine whether the move tools are visible on the canvas.
   * @type {boolean}
   */
  const [showMove, setShowMove] = useState<boolean>(false);

  /**
   * Current brush color value used in various components.
   * This ensures color consistency across `BrushPanel`, `UserOnline`, and `MobileColorPicker`.
   * @type {string}
   */
  const [colorValue, setColorValue] = useState<string>(DEFAULT_BRUSH_DATA.color);

  /**
   * Updates the brush color.
   * Used in children components to synchronize color changes across UI elements.
   * 
   * @param {string} hex - The new hex color code for the brush.
   */
  const updateBrushColor = useCallback((hex: string) => {
    setColorValue(hex);
  }, []);

  /**
   * Array of recently used colors, initialized with 16 default colors.
   * This is passed to the swatch in color pickers.
   * @type {Swatch}
   */
  const [recentColors, setRecentColors] = useState<Swatch>(new Array(16).fill(DEFAULT_SWATCH_COLOR));

  /**
   * Handles brush changes and updates the user's presence.
   * This is triggered when the brush selection is changed in various UI components.
   * 
   * @param {Object} params - The event parameters.
   * @param {BrushData} params.detail - The new brush details.
   */
  const handleBrushChange = useCallback(({ detail }: { detail: BrushData }) => {
    updateMyPresence({ brush: detail });
  }, [updateMyPresence]);

  /**
 * Handles pixel changes based on the current tool selected.
 * If the Fill tool is selected, it finds and updates neighboring pixels of the same color.
 * If the Eraser tool is selected, it clears the pixel.
 * Otherwise, it updates the pixel with the current brush color.
 *
 * @function handlePixelChange
 * @param {Object} detail - Details of the pixel being changed.
 * @param {number} detail.col - The column index of the pixel.
 * @param {number} detail.row - The row index of the pixel.
 * @param {string} detail.hex - The hex color value of the pixel.
 */
  function handlePixelChange({ detail }: { detail: { col: number; row: number; hex: string } }) {
    if (!myPresence?.brush?.color || !pixelStorage) {
      return;
    }

    const tool: Tool = myPresence.tool;
    const color = myPresence.brush.color;
    const selected = myPresence.selectedLayer;

    const currentPixel: PixelObject = {
      row: detail.row,
      col: detail.col,
      layer: selected,
    };

    // Array of pixels to update (defaults to the current pixel)
    let pixelsToChange: PixelObject[] = [currentPixel];

    // If Fill tool is selected, find all neighboring pixels to fill
    if (tool === Tool.Fill) {
      const currentLayer = layers.find((layer) => layer.id === selected)!; // Non-null assertion, as we expect the layer to exist
      pixelsToChange = [
        ...pixelsToChange,
        ...getFillPixels(currentPixel, currentLayer.grid),
      ];
    }

    // Update pixels with color or clear them if using the Eraser tool
    updatePixels(pixelsToChange, tool === Tool.Eraser ? "" : color);

    // Update the list of recently used colors if the color is new
    if (!recentColors.includes(color)) {
      const a = recentColors;
      a.pop();
      a.unshift(color);
      setRecentColors(a);
    }
  }

  /**
   * Moves all pixels in the selected layer in a given direction.
   * Calls `getMovePixels` to calculate new positions and updates pixel storage.
   *
   * @function handleLayerMove
   * @param {Object} detail - Details about the movement direction.
   * @param {Direction} detail.direction - The direction in which pixels should move.
   */
  const handleLayerMove = useCallback(({ detail }: { detail: { direction: Direction } }) => {
    if (!myPresence?.brush?.color || !pixelStorage || !canvasReady) {
      return;
    }

    const selected = myPresence.selectedLayer;
    const movedLayer = getMovePixels({
      pixelStorage: pixelStorage,
      detail,
      selected,
      keyToPixel,
    });

    // Move pixels without setting a new color (empty string maintains transparency)
    updatePixels(movedLayer, "");
  }, [canvasReady, keyToPixel, myPresence, pixelStorage, updatePixels]);

  // ================================================================================
  // LIVE CURSORS

  /**
   * Live cursor position is calculated according to which panel is currently being
   * used. The center panel uses a percentage value calculated from the middle of
   * the panel, whereas the two side panels use a pixel value from the top left
   * corner.
   */

  /**
  * The panels object contains references to different UI panels. Each panel is represented by a React reference.
  * It helps in accessing and interacting with each panel's DOM element directly.
  */
  const panels: Record<PanelName, React.RefObject<HTMLDivElement | null>> = {
    multiplayerPanel: useRef<HTMLDivElement | null>(null),
    mainPanel: useRef<HTMLDivElement | null>(null),
    toolsPanel: useRef<HTMLDivElement | null>(null),
  };

  /**
   * Handles mouse movement events on a specific panel.
   * It calculates the current cursor position relative to the panel and updates the presence state.
   * For the main panel, the position is normalized to percentage of the panel's dimensions.
   * 
   * @function handleMouseMove
   * @param {React.PointerEvent<HTMLDivElement>} event - The pointer event containing the cursor position.
   * @param {PanelName} area - The name of the panel where the mouse movement is happening.
   */
  function handleMouseMove(event: React.PointerEvent<HTMLDivElement>, area: PanelName) {
    if (!panels[area] || !panels[area].current || !myPresence) {
      return;
    }

    const { top, left, width, height } = panels[area].current.getBoundingClientRect();

    // Calculate cursor position relative to the top-left corner of the panel
    let x = Math.round(event.clientX - left);
    let y = Math.round(event.clientY - top + panels[area].current.scrollTop);

    // Normalize the position as a percentage of the panel's dimensions if it's the main panel
    if (area === "mainPanel") {
      x = x / width;
      y = y / height;
    }

    // Update presence with the new cursor position and area
    updateMyPresence({ cursor: { x, y, area } });
  }

  /**
   * Calculates the absolute cursor position on the panel based on normalized coordinates and the panel area.
   * Converts the cursor's relative position back to pixel values depending on the area type.
   * 
   * @function calculateCursorPosition
   * @param {Object} params - The cursor position and panel area information.
   * @param {number} params.x - The normalized x-coordinate (percentage for main panel).
   * @param {number} params.y - The normalized y-coordinate (percentage for main panel).
   * @param {PanelName} params.area - The panel area where the cursor is located.
   * @returns {Object} - The calculated cursor position in pixel values.
   */
  function calculateCursorPosition({ x, y, area }: { x: number, y: number, area: PanelName }) {
    if (!panels?.[area] || !panels[area].current) {
      return;
    }

    const { top, left, width, height } = panels[area].current.getBoundingClientRect();
    let newX;
    let newY;

    if (area === "mainPanel") {
      // Calculate cursor position relative to the panel's dimensions for main panel
      newX = left + width * x;
      newY = top + height * y;
    } else {
      // For other panels, use the position from the top left corner
      newX = left + x;
      newY = top + y;
    }
    return { x: newX, y: newY };
  }

  /**
   * When the mouse leaves the page or panel, it sets the cursor presence state to null, 
   * effectively clearing the cursor from the presence object.
   * 
   * @function handleMouseLeave
   */
  function handleMouseLeave() {
    updateMyPresence({ cursor: null });
  }

  // ================================================================================
  // MOBILE MENU 

  /**
 * `mobileMenuOpen` is a state that controls whether the mobile menu is open or closed.
 * It is toggled to show or hide the mobile menu.
 * 
 * @state mobileMenuOpen
 */
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  /**
   * `panelWidth` stores the current width of the viewport. It is updated on window resize.
   * This value is used to calculate the position of the mobile menu and adjust the mobile menu's spring animation.
   * 
   * @state panelWidth
   */
  const [panelWidth, setPanelWidth] = useState(() => window.innerWidth);

  /**
   * `mobileMenuTransform` holds the spring animation configuration for the mobile menu.
   * When the mobile menu is open, it will be at `0`, otherwise, it will be positioned at `-panelWidth`, effectively hiding it offscreen.
   * 
   * @variable mobileMenuTransform
   */
  const mobileMenuTransform = useSpring(mobileMenuOpen ? 0 : -panelWidth, { stiffness: 120, damping: 15 });

  /**
   * This `useEffect` hook is responsible for updating the `panelWidth` state when the window is resized.
   * The panel width is stored in state to allow responsive updates to the mobile menu position.
   * 
   * @effect Window resize listener
   */
  useEffect(() => {
    function updatePanelWidth() {
      setPanelWidth(window.innerWidth); // Store full viewport width
    }

    updatePanelWidth(); // Update panel width on initial mount
    window.addEventListener("resize", updatePanelWidth); // Set up event listener on mount

    return () => window.removeEventListener("resize", updatePanelWidth); // Clean up listener on unmount
  }, []);

  /**
   * This `useEffect` hook responds to changes in the `mobileMenuOpen` state.
   * When `mobileMenuOpen` changes, it triggers the spring animation to either show or hide the mobile menu.
   * 
   * @effect Spring animation for mobile menu
   */
  useEffect(() => {
    if (panelWidth > 0) { // Ensure panelWidth is valid (not 0 during initial mount)
      mobileMenuTransform.set(mobileMenuOpen ? 0 : -panelWidth); // Move mobile menu in/out based on state
    }
  }, [mobileMenuOpen, mobileMenuTransform, panelWidth]);

  // ================================================================================
  /**
   * Handle keyboard shortcuts and tool switching, as well as layer movement and undo/redo functionality.
   * 
   * @key B - Selects the Brush tool.
   * @key F - Selects the Fill tool.
   * @key E - Selects the Eraser tool.
   * @key M - Toggles the Move tool.
   * @key G - Toggles the Grid display.
   * @key Arrow Keys - Move the layer if Move tool is enabled.
   * @key Ctrl + Z / Cmd + Z - Undo action.
   * @key Ctrl + Shift + Z / Cmd + Shift + Z or Ctrl + Y / Cmd + Y - Redo action.
   * 
   * @callback handleKeyDown - Handles the keydown events to toggle tools, grid visibility, and move layers.
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!event.ctrlKey && !event.metaKey) {
      // Toggle grid visibility
      if (event.key === "g") {
        setShowGrid(!showGrid);
        return;
      }

      // Toggle move tool visibility
      if (event.key === "m") {
        setShowMove(!showMove);
        return;
      }

      // Handle tool switching based on key press
      const toolKeys: Record<string, Tool> = {
        b: Tool.Brush,
        f: Tool.Fill,
        e: Tool.Eraser,
      };

      if (myPresence && toolKeys[event.key]) {
        updateMyPresence({ tool: toolKeys[event.key] });
        return;
      }

      // Handle layer movement with arrow keys if move tool is enabled
      const arrowKeys: Record<string, Direction> = {
        ArrowUp: Direction.Up,
        ArrowRight: Direction.Right,
        ArrowDown: Direction.Down,
        ArrowLeft: Direction.Left,
      };
      if (showMove && arrowKeys[event.key]) {
        const detail: { direction: Direction } = { direction: arrowKeys[event.key] };
        handleLayerMove({ detail });
      }

      return;
    }

    // Handle undo/redo actions with Ctrl + Z or Cmd + Z
    if (event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    } else if (event.key === "y") {
      event.preventDefault();
      redo();
    }
  }, [showMove, showGrid, handleLayerMove, myPresence, redo, undo, updateMyPresence]);

  /**
   * Handle mouse pointer down event, marking the start of a mouse interaction.
   * 
   * @callback handlePointerDown - Updates presence state when mouse button is pressed.
   */
  const handlePointerDown = useCallback(() => {
    updateMyPresence({ mouseDown: true });
  }, [updateMyPresence]);

  /**
   * Handle mouse pointer up event, marking the end of a mouse interaction.
   * 
   * @callback handlePointerUp - Updates presence state when mouse button is released.
   */
  const handlePointerUp = useCallback(() => {
    updateMyPresence({ mouseDown: false });
  }, [updateMyPresence]);

  /**
   * Set up event listeners for keyboard and pointer events.
   * Clean up event listeners on component unmount to prevent memory leaks.
   * 
   * @effect Component mount setup and cleanup for keydown, pointerdown, and pointerup event listeners.
   */
  useEffect(() => {
    // Set up event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerDown, handlePointerUp, handleKeyDown]);

  return (
    <>
      {/* Intro dialog */}
      {!nameSet && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <IntroDialog
            maxPixels={maxPixels}
            loading={isDataLoading}
            shouldCreateCanvas={!canvasReady}
            createCanvas={createCanvas}
            setName={setName}
          />
        </div>
      )}

      {/* <!-- Live Cursors --> */}
      <div className="pointer-events-none absolute inset-0 z-50">
        {others?.map(({ presence, info, connectionId }) => {
          return presence?.cursor && presence?.brush ? (
            <Cursor
              key={connectionId}
              {...calculateCursorPosition(presence.cursor)}
              shrink={presence.mouseDown}
              brush={presence.brush}
              tool={presence.tool}
              name={presence.name || info.name}
            />
          ) : null
        }

        )}
      </div>

      {/* <!-- App --> */}
      <div className=" flex w-full h-full min-h-full bg-white">

        {/* <!-- Left panel, containing layers etc --> */}
        <motion.div
          className={`side-panel fixed z-20 h-full w-[100vw] flex-shrink-0 flex-grow-0 overflow-y-auto overflow-x-hidden border-gray-100 bg-white md:!relative md:right-auto md:z-10 md:!w-auto md:min-w-[320px] md:!translate-x-0 ${mobileMenuOpen
            ? 'border-r-2 drop-shadow-xl'
            : ''}`}
          id="tools-panel"
          style={{ x: mobileMenuTransform }}
        >
          {layers && canvasReady && (
            <motion.div
              ref={panels.toolsPanel}
              onPointerMove={(e: React.PointerEvent<HTMLDivElement>) => handleMouseMove(e, "toolsPanel")}
              onPointerLeave={(handleMouseLeave)}
              className="relative flex h-full min-h-full flex-col top-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <BrushPanel
                handleBrushChange={handleBrushChange}
                updateColor={updateBrushColor}
                colorValue={colorValue}
                swatch={recentColors}
              />
              <LayersPanel layers={layers} maxPixels={maxPixels} />
              <ExportsPanel />
              <div className="-mt-2 mb-5 xl:hidden">
                <SharePanel />
              </div>
              <MobileLinksPanel />
            </motion.div>
          )}
        </motion.div>




        {/* <!-- Center panel, containing canvas, undo/redo etc. --> */}
        <div
          className="main-panel relative flex flex-grow flex-col overflow-hidden bg-gray-100"
          id="main-panel"
          onPointerLeave={handleMouseLeave}
          onPointerMove={(e: React.PointerEvent<HTMLDivElement>) => handleMouseMove(e, "mainPanel")}
        >
          {/* Toolbar above canvas */}
          {canvasReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 flex w-full flex-shrink-0 flex-grow-0 items-center justify-between border-2 border-t-0 border-gray-100 bg-white p-4"
            >
              {/* <!-- Buttons: left side --> */}
              <div className="flex gap-3">
                <div className="flex space-x-2">
                  {/* Brush Tool */}
                  <CustomTooltip tooltipContent="Brush tool (B)">
                    <button
                      className={`p-2 rounded ${myPresence.tool === Tool.Brush ? "bg-gray-300" : "hover:bg-gray-200"}`}
                      onClick={() => updateMyPresence({ tool: Tool.Brush })}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M20.71,4.63L19.37,3.29C19,2.9 18.35,2.9 17.96,3.29L9,12.25L11.75,15L20.71,6.04C21.1,5.65 21.1,5 20.71,4.63M7,14A3,3 0 0,0 4,17C4,18.31 2.84,19 2,19C2.92,20.22 4.5,21 6,21A4,4 0 0,0 10,17A3,3 0 0,0 7,14Z"
                        />
                      </svg>
                    </button>
                  </CustomTooltip>

                  {/* Eraser Tool */}
                  <CustomTooltip tooltipContent="Eraser tool (E)">
                    <button
                      className={`p-2 rounded ${myPresence.tool === Tool.Eraser ? "bg-gray-300" : "hover:bg-gray-200"}`}
                      onClick={() => updateMyPresence({ tool: Tool.Eraser })}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M16.24,3.56L21.19,8.5C21.97,9.29 21.97,10.55 21.19,11.34L12,20.53C10.44,22.09 7.91,22.09 6.34,20.53L2.81,17C2.03,16.21 2.03,14.95 2.81,14.16L13.41,3.56C14.2,2.78 15.46,2.78 16.24,3.56M4.22,15.58L7.76,19.11C8.54,19.9 9.8,19.9 10.59,19.11L14.12,15.58L9.17,10.63L4.22,15.58Z"
                        />
                      </svg>
                    </button>
                  </CustomTooltip>

                  {/* Fill Tool */}
                  <CustomTooltip tooltipContent="Fill tool (F)">
                    <button
                      className={`p-2 rounded ${myPresence.tool === Tool.Fill ? "bg-gray-300" : "hover:bg-gray-200"}`}
                      onClick={() => updateMyPresence({ tool: Tool.Fill })}
                    >
                      <svg className="mt-[6px] h-6 w-6 scale-x-[-1]" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M19,11.5C19,11.5 17,13.67 17,15A2,2 0 0,0 19,17A2,2 0 0,0 21,15C21,13.67 19,11.5 19,11.5M5.21,10L10,5.21L14.79,10M16.56,8.94L7.62,0L6.21,1.41L8.59,3.79L3.44,8.94C2.85,9.5 2.85,10.47 3.44,11.06L8.94,16.56C9.23,16.85 9.62,17 10,17C10.38,17 10.77,16.85 11.06,16.56L16.56,11.06C17.15,10.47 17.15,9.5 16.56,8.94Z"
                        />
                      </svg>
                    </button>
                  </CustomTooltip>
                </div>

                <div className="flex gap-2">
                  {/* Toggle grid button with tooltip */}
                  <CustomTooltip tooltipContent="Toggle grid (G)">
                    <Toggle
                      aria-label="Toggle grid (G)"
                      pressed={showGrid}
                      onPressedChange={() => setShowGrid(!showGrid)}
                      className={`p-2 rounded-md ${showGrid ? "bg-blue-500 text-white" : "bg-gray-200"
                        }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </Toggle>
                  </CustomTooltip>

                  {/* Toggle move button with tooltip */}
                  <CustomTooltip tooltipContent="Toggle move (M)">
                    <Toggle
                      aria-label="Toggle move (M)"
                      pressed={showMove}
                      onPressedChange={() => setShowMove(!showMove)}
                      className={`p-2 rounded-md ${showMove ? "bg-green-500 text-white" : "bg-gray-200"
                        }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          transform="translate(10, -2.7) rotate(45) scale(0.95)"
                          fillRule="evenodd"
                          d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Toggle>
                  </CustomTooltip>
                </div>


              </div>

              {/* <!-- Buttons: right side --> */}
              <div className="ml-3 flex gap-3">
                <div className="flex gap-2">
                  {/* Undo Button */}
                  <CustomTooltip tooltipContent="Undo">
                    <Button
                      variant="ghost"
                      className="p-2 rounded-md hover:bg-gray-200 transition"
                      onClick={() => undo()}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Button>
                  </CustomTooltip>

                  {/* Redo Button */}
                  <CustomTooltip tooltipContent="Redo">
                    <Button
                      variant="ghost"
                      className="p-2 rounded-md hover:bg-gray-200 transition"
                      onClick={() => redo()}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Button>
                  </CustomTooltip>
                </div>
              </div>

            </motion.div>
          )}

          {/* Main canvas */}
          <div className="relative flex-shrink flex-grow">
            {canvasReady && layers?.[0]?.grid?.length && (
              <PixelGridSegment
                showGrid={showGrid}
                showMove={showMove}
                layers={layers}
                handleLayerMove={handleLayerMove}
                handlePixelChange={handlePixelChange}
                mainPanelElementRef={panels.mainPanel}
              />
            )}
          </div>

          {/* Mobile menu bar at bottom */}
          <div
            className="relative z-30 w-full flex-shrink-0 flex-grow-0 border-2 border-gray-100 bg-white py-3 pr-4 xl:hidden"
          >
            <div className="flex items-center justify-between">
              {/* Open mobile menu button */}
              <div className="flex md:hidden">
                <button
                  className="px-4 py-2"
                  onClick={() => (setMobileMenuOpen(!mobileMenuOpen))}
                >
                  {mobileMenuOpen ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* <!-- User avatars --> */}
              <div
                className="-mr-3 flex flex-grow flex-row-reverse items-center justify-center md:mr-0"
              >
                {others && (
                  <>
                    {others.map(({ presence, info, connectionId }) =>
                      presence ? (
                        <div
                          key={connectionId}
                          className="transparent-bg relative -ml-2 h-10 w-10 rounded-full ring-4 ring-white"
                        >
                          <Image
                            alt={`${presence?.name || info.name}'s avatar`}
                            src={info.picture as string}
                            width={40}
                            height={40}
                          />
                        </div>
                      ) : null
                    )}
                  </>
                )}

                {self && myPresence && myPresence.brush && (
                  <>
                    <div className="-my-2 mr-2 hidden flex-grow md:block">
                      <div className="flex-grow-0">
                        <UserOnline
                          picture={self.info.picture}
                          name={myPresence.name || self.info.name}
                          brush={myPresence.brush}
                          selectedLayer={myPresence.selectedLayer}
                          tool={myPresence.tool}
                          handleSelectColor={({ detail }: { detail: { color: string } }) => updateBrushColor(detail.color)}
                          isYou={true}
                          short={true}
                        />
                      </div>
                      <div className="w-full flex-grow" />
                    </div>

                    <div
                      className="transparent-bg relative -ml-2 block h-10 w-10 rounded-full ring-4 ring-white md:hidden"
                    >
                      <Image
                        alt={`${myPresence?.name || self.info.name}'s avatar`}
                        src={self.info!.picture}
                        height={40}
                        width={40}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Mobile color picker */}
              <div className="flex md:hidden">
                <MobileColorPicker
                  handleBrushChange={handleBrushChange}
                  updateColor={updateBrushColor}
                  swatch={recentColors}
                  colorValue={colorValue}
                />
              </div>
            </div>
          </div>
        </div>

        {/* <!-- Right panel, containing share links, users' colors etc. (only on large screens) --> */}
        <div
          ref={panels.multiplayerPanel}
          className="side-panel relative left-full flex  w-0 flex-col overflow-y-auto py-5 xl:left-auto xl:w-[300px]"
          id="multiplayer-panel"
          onPointerLeave={handleMouseLeave}
          onPointerMove={(e: React.PointerEvent<HTMLDivElement>) => handleMouseMove(e, "multiplayerPanel")}
        >
          {others && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div>
                  <div
                    className="border-gray-200 px-5 pb-1 text-sm font-semibold text-gray-500"
                  >
                    Currently online
                  </div>

                  {/* <!-- You --> */}
                  {myPresence && self && myPresence.brush && (
                    <UserOnline
                      picture={self.info.picture as string}
                      name={myPresence.name || self.info.name}
                      brush={myPresence.brush}
                      selectedLayer={myPresence.selectedLayer}
                      tool={myPresence.tool}
                      isYou={true}
                    />
                  )}

                  {/* <!-- Other users --> */}
                  {others.map(({ presence, info, connectionId }) => {
                    if (presence?.brush?.color) return (
                      <UserOnline
                        key={connectionId}
                        picture={info.picture}
                        name={presence.name || info.name}
                        brush={presence.brush}
                        selectedLayer={presence.selectedLayer}
                        tool={presence.tool}
                        handleSelectColor={({ detail }: { detail: { color: string } }) => updateBrushColor(detail.color)}
                        isYou={false}
                      />
                    )
                  })}
                </div>

                {/* Share buttons */}
                <SharePanel></SharePanel>
              </motion.div>


              {/* < !--Liveblocks logo --> */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-grow items-end"
              >
                <LinksPanel />
              </motion.div>
            </>

          )}
        </div>
      </div>

    </>
  );
}
