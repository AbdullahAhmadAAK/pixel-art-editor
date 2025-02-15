/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import {
  useMyPresence,
  useOthers,
  useSelf,
  useUpdateMyPresence,
  useUndo,
  useRedo
} from "@liveblocks/react/suspense";

import { motion, useSpring } from "framer-motion";
import { useCallback, useState, useEffect } from 'react';
import { formatLayers, Layer } from "./lib/utils/format-layers";
import { generateLayer } from "./lib/utils/generate-layer";
// import { useStorage } from "@liveblocks/react";

// import { ClientSideSuspense, useStorage } from "@liveblocks/react/suspense";
import { useStorage, useMutation } from "@liveblocks/react";

import { Brush, Direction, Pixel, Tool } from "@/lib/types";
import { getFillPixels } from "./lib/utils/get-fill-pixels";
import { getMovePixels } from "./lib/utils/get-move-pixels";
import { PanelName } from "../../../liveblocks.config";

export type PixelObject = {
  layer: number;
  row: number;
  col: number;
  value?: object;
};

// A key for a pixel, e.g. '0_1_2'
export type PixelKey = string;
export type PixelColor = string;

export type PixelStorage = {
  [key: string]: string; // Replace PixelObject with the actual structure if it's different
};

export default function PixelArtEditor() {

  const [myPresence, updateMyPresenceTest] = useMyPresence();
  const updateMyPresence = useUpdateMyPresence();

  const others = useOthers()
  const self = useSelf();

  useEffect(() => {
    updateMyPresence({
      name: "",
      selectedLayer: 0,
      cursor: null,
      tool: Tool.Brush,
      mouseDown: false,
    });
  }, [updateMyPresence])

  const pixelStorage = useStorage((root) => root.pixelStorage);
  const layerStorage = useStorage((root) => root.layerStorage);

  const maxPixels = 2600;


  /**
   * Pixels are stored inside pixelStorage as individual properties in an object
   * A red pixel on layer 0, row 1, column 2:
   *
   * $pixelStorage = {
   *   0_1_2: "red",
   *   // ...
   *   }
   */

  // Convert a pixel object into a pixel key
  const pixelToKey = useCallback(
    ({ layer = myPresence.selectedLayer as number, row, col }: PixelObject): PixelKey => {
      return `${layer}_${row}_${col}`;
    },
    [myPresence.selectedLayer] // Add dependencies if myPresence changes
  );

  // Convert a pixel key into a pixel object
  const keyToPixel = useCallback((key: PixelKey): PixelObject => {
    const [layer, row, col] = key.split("_").map((num) => parseInt(num));
    return { layer, row, col };
  }, []);

  // Get the current pixel, using a pixel object
  // Includes fallback for a previous storage system
  const getPixel = useCallback((pixelProps: PixelObject) => {
    if (!pixelStorage) return { color: "transparent" }; // not sure aboutt this tho

    const stored = pixelStorage[pixelToKey(pixelProps)];
    if (!stored) {
      return { color: "transparent" };
    }
    if (typeof stored === "string") {
      return { color: stored };
    }
    return stored;
  }, [pixelStorage, pixelToKey]);

  // const updatePixels = (pixelArray: PixelObject[], newVal) => {
  //   const updatedPixels: PixelStorage = {};
  //   pixelArray.forEach(
  //     (pixelProps) =>
  //       (updatedPixels[pixelToKey(pixelProps)] = pixelProps.value || newVal)
  //   );
  //   // setPixelStorage(updatedPixels)
  //   // return $pixelStorage.update(updatedPixels);
  // };

  // Update an array of pixels, with the pixelArray.value object, or newObj if none set
  // newVal is either brush.color, which seems to be a string, or it is "". In either case, it's string.
  const updatePixels = useMutation(({ storage }, pixelArray: PixelObject[], newVal: string) => {
    const updatedPixels: PixelStorage = {};
    pixelArray.forEach((pixelProps) =>
      (updatedPixels[pixelToKey(pixelProps)] = newVal) // idk why he wrote pixelProps.value before. do keep in mind tho.
      // (updatedPixels[pixelToKey(pixelProps)] = pixelProps.value || newVal)
    );

    // Note: need to only update the new pixels, and keep the rest the same
    const pixelStorage = storage.get('pixelStorage')

    // This will only set the pixels that have to be changed, within the pixelStorage key of liveblocks storage
    Object.keys(updatedPixels).map((key) => {
      pixelStorage.set(key, updatedPixels[key])
    })
  }, []);

  // Every time pixelStorage or layerStorage updates, format layers into single array
  const [layers, setLayers] = useState<Layer[]>([])

  useEffect(() => {
    if (layerStorage && pixelStorage) {
      const formattedLayers = formatLayers({
        pixelStorage: pixelStorage,
        layerStorage: layerStorage,
        keyToPixel,
        getPixel,
      });

      setLayers(formattedLayers);
    }
  }, [pixelStorage, layerStorage, keyToPixel, getPixel])

  const [canvasReady, setCanvasReady] = useState<boolean>(false)

  useEffect(() => {
    const newCanvasReady = pixelStorage ? Object.keys(pixelStorage).length > 0 : false
    setCanvasReady(newCanvasReady)
  }, [pixelStorage])

  // ================================================================================
  // INTRO DIALOG

  let nameSet = false;

  // Set name inside presence
  function setName({ detail }: { detail: { name: string } }) {
    updateMyPresence({ name: detail.name })
    nameSet = true;
  }

  // TODO: is this even correct?
  const updatePixelStorageWithLayer = useMutation(({ storage }, layer) => {
    storage.set('pixelStorage', layer)
  }, []);

  // Create canvas with dialog settings and default color TODO: needs to be fixed
  function createCanvas({ detail }: { detail: { name: string, width: number, height: number } }) {
    if (layerStorage) {
      const defaultLayer = generateLayer({
        layer: 0,
        rows: detail.height,
        cols: detail.width,
        defaultValue: "",
      });

      updatePixelStorageWithLayer(defaultLayer)
      // $pixelStorage.update(defaultLayer);

      // layerStorage.set(0, {
      //   id: 0,
      //   opacity: 1,
      //   blendMode: "normal",
      //   hidden: false,
      // });
      updateLayerStorageWithLayer(0, {
        id: 0,
        opacity: 1,
        blendMode: "normal",
        hidden: false,
      })

      setName({ detail });
    }
  }


  const updateLayerStorageWithLayer = useMutation(({ storage }, layerKey, layer) => {
    const layerStorageTester = storage.get('layerStorage')

    layerStorageTester.set(0, {
      id: 0,
      opacity: 1,
      blendMode: "normal",
      hidden: false,
    })
    // storage.set('layerStorage', layer)
  }, []);


  // ================================================================================
  // CANVAS

  // Functions that allow undoing and redoing storage changes
  const undo = useUndo();
  const redo = useRedo();

  // Is grid showing on canvas
  let showGrid = false;

  // Are move tools showing on canvas
  let showMove = false;

  // Will be bound to a function that allows the current color to be updated
  let updateBrushColor;

  // Recently used colors to be passed to the swatch
  let recentColors = new Array(16).fill("#ffffffff");

  // On brush component change, update presence with new brush
  function handleBrushChange({ detail }: { detail: Brush }) {
    updateMyPresence({ brush: detail })
  }

  // On pixel change, update pixels according to the current tool TODO: pixel storage rework?
  function handlePixelChange({ detail }: { detail: { col: number; row: number; hex: string } }) {
    if (!myPresence?.brush?.color || !pixelStorage) {
      return;
    }

    const tool: Tool = myPresence.tool;
    const color = myPresence.brush.color;
    const selected = myPresence.selectedLayer;

    const currentPixel = {
      row: detail.row,
      col: detail.col,
      layer: selected,
    };

    // Current pixel
    let pixelsToChange: PixelObject[] = [currentPixel];

    // If fill tool, find neighbour pixels
    if (tool === Tool.Fill) {
      const currentLayer = layers.find((layer) => layer.id === selected)!;
      pixelsToChange = [
        ...pixelsToChange,
        ...getFillPixels(currentPixel, currentLayer.grid),
      ];
    }

    updatePixels(pixelsToChange, tool === Tool.Eraser ? "" : color);

    if (!recentColors.includes(color)) {
      const a = recentColors;
      a.pop();
      a.unshift(color);
      recentColors = a;
    }
  }

  // Move pixels by 1 pixel in detail.direction Direction
  function handleLayerMove({ detail }: { detail: { direction: Direction } }) {
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

    updatePixels(movedLayer, "");
  }

  // ================================================================================
  // LIVE CURSORS

  /**
   * Live cursor position is calculated according to which panel is currently being
   * used. The center panel uses a percentage value calculated from the middle of
   * the panel, whereas the two side panels use a pixel value from the top left
   * corner.
   */

  // The different panels TODO: add ts here soon
  const panels: Record<PanelName, HTMLElement | null> = {
    multiplayerPanel: null,
    mainPanel: null,
    toolsPanel: null,
  };

  // Pass current cursor position on panel, and current panel, to presence
  function handleMouseMove(event: PointerEvent, area: PanelName) {
    if (!panels[area] || !myPresence) {
      return;
    }

    const { top, left, width, height } = panels[area].getBoundingClientRect();

    // Position from top left corner by default
    let x = Math.round(event.clientX - left);
    let y = Math.round(event.clientY - top + panels[area].scrollTop);

    // Percentage from center of element for main panel
    if (area === "mainPanel") {
      x = x / width;
      y = y / height;
    }

    updateMyPresence({
      cursor: { x, y, area }
    })
    // myPresence.update({
    //   cursor: { x, y, area },
    // });
  }

  // Reverse of above, find location of cursor according to coords and panel
  function calculateCursorPosition({ x, y, area }: { x: number, y: number, area: PanelName }) {
    if (!panels?.[area]) {
      return;
    }

    const { top, left, width, height } = panels[area].getBoundingClientRect();
    let newX;
    let newY;

    if (area === "mainPanel") {
      // Percentage from center of element for main panel
      newX = left + width * x;
      newY = top + height * y;
    } else {
      // Position from top left corner otherwise
      newX = left + x;
      newY = top + y;
    }

    return { x: newX, y: newY };
  }

  // When the mouse leaves the page, set cursor presence to null
  function handleMouseLeave() {
    updateMyPresence({
      cursor: null
    })
    // myPresence.update({
    //   cursor: null,
    // });
  }

  // ================================================================================
  // MOBILE MENU TODO: needs to be checked tho

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Spring animation for mobile menu

  const [mobileMenuTransform, setMobileMenuTransform] = useState(useSpring(0, {
    stiffness: 70, // Similar to Svelte's stiffness
    damping: 10,   // Similar to Svelte's damping
  }))

  // let mobileMenuTransform = spring(0, {
  //   stiffness: 0.07,
  //   damping: 0.4,
  // });

  useEffect(() => {
    mobileMenuTransform.set(mobileMenuOpen ? 100 : 0);
  }, [mobileMenuOpen, mobileMenuTransform])

  // When `mobileMenuOpen` changes, set spring value
  // $: mobileMenuTransform.set(mobileMenuOpen ? 100 : 0);

  // ================================================================================
  // KEYBOARD SHORTCUTS

  // B for brush, F for fill, E for eraser, M for move, G for grid
  // Arrow keys to move layers if showMove truthy
  // Ctrl+Z for undo. Ctrl+Shift+Z and Ctrl+Y for redo.
  // Handle keydown event

  // showMove, showGrid issue to be fixed:
  // TODO: Assignments to the 'showGrid' variable from inside React Hook useCallback will be lost after each render. To preserve the value over time, store it in a useRef Hook and keep the mutable value in the '.current' property. Otherwise, you can move this variable directly inside useCallback.eslintreact-hooks/exhaustive-deps
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!event.ctrlKey && !event.metaKey) {
      if (event.key === "g") {
        showGrid = !showGrid;
        return;
      }

      if (event.key === "m") {
        showMove = !showMove;
        return;
      }

      // Change tool
      const toolKeys: Record<string, Tool> = {
        b: Tool.Brush,
        f: Tool.Fill,
        e: Tool.Eraser,
      };

      if (myPresence && toolKeys[event.key]) {
        updateMyPresence({ tool: toolKeys[event.key] })
        // myPresence.update({ tool: toolKeys[event.key] });
        return;
      }

      // If move tool enabled, move layer with arrow keys
      const arrowKeys: Record<string, Direction> = {
        ArrowUp: Direction.Up,
        ArrowRight: Direction.Right,
        ArrowDown: Direction.Down,
        ArrowLeft: Direction.Left,
      };
      if (showMove && arrowKeys[event.key]) {
        const detail: { direction: Direction } = { direction: (arrowKeys[event.key]) };
        handleLayerMove({ detail });
      }

      return;
    }

    // Undo/redo keys
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
  }, [showMove, showGrid])






  // Handle pointerdown and pointerup
  const handlePointerDown = useCallback(() => {
    updateMyPresence({ mouseDown: true })
  }, [updateMyPresence])

  const handlePointerUp = useCallback(() => {
    updateMyPresence({ mouseDown: false })
  }, [updateMyPresence])

  useEffect(() => {
    // Set up event listeners for keydown
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointerup', handlePointerUp)

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
    };
  }, [handlePointerDown, handlePointerUp, handleKeyDown]);

  return (
    <>
      <h1>hi</h1>
    </>
  );
}
