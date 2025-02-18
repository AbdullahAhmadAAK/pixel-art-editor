/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import SlButtonGroup from '@shoelace-style/shoelace/dist/react/button-group/index.js';


import {
  useMyPresence,
  useOthers,
  useSelf,
  useUpdateMyPresence,
  useUndo,
  useRedo
} from "@liveblocks/react/suspense";

import { motion, useSpring } from "framer-motion";
import { useCallback, useState, useEffect, useRef, RefObject, useMemo } from 'react';
import { formatLayers, Layer } from "./lib/utils/format-layers";
import { generateLayer } from "./lib/utils/generate-layer";
// import { useStorage } from "@liveblocks/react";

// import { ClientSideSuspense, useStorage } from "@liveblocks/react/suspense";
import { useStorage, useMutation } from "@liveblocks/react";

import { Brush, Direction, Pixel, PixelGrid, Tool } from "@/lib/types";

import { getFillPixels } from "./lib/utils/get-fill-pixels";
import { getMovePixels } from "./lib/utils/get-move-pixels";

import { PanelName } from "../../../liveblocks.config";

import { Cursor } from "@/components/live-blocks/cursor";
import { IntroDialog } from "@/components/live-blocks/intro-dialog";
import { BrushPanel } from "@/components/live-blocks/brush-panel";
import { LayersPanel } from '../../components/live-blocks/layers-panel';

// Import CSS
import './pixel-art-styles.css'
import { ExportsPanel } from "@/components/live-blocks/exports-panel";
import { SharePanel } from "@/components/live-blocks/share-panel";
import { MobileLinksPanel } from "@/components/live-blocks/mobile-links-panel";
import { LinksPanel } from "@/components/live-blocks/links-panel";
import { UserOnline } from '../../components/pixel-art-editor/user-online';
import { IconButton } from '@/components/pixel-art-editor/icon-button';

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

  const [nameSet, setNameSet] = useState<boolean>(false)

  // Set name inside presence
  function setName({ detail }: { detail: { name: string } }) {
    updateMyPresence({ name: detail.name })
    setNameSet(true)
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
  const [showGrid, setShowGrid] = useState<boolean>(false)

  // Are move tools showing on canvas
  const [showMove, setShowMove] = useState<boolean>(false)

  // This is the value used in brush panel component, added by me only
  const [colorValue, setColorValue] = useState<string>("")

  // Will be bound to a function that allows the current color to be updated
  const updateBrushColor = useCallback((hex: string) => {
    setColorValue(hex)
  }, [])

  // const [updateBrushColor, setUpdateBrushColor] = useState()

  // Recently used colors to be passed to the swatch
  // const recentColors = useMemo(() => new Array(16).fill("#ffffffff"))
  // let recentColors = new Array(16).fill("#ffffffff");
  // const recentColors = useMemo(() => new Array(16).fill("#ffffffff"), []);
  const [recentColors, setRecentColors] = useState(new Array(16).fill("#ffffffff"))

  // On brush component change, update presence with new brush TODO: usecallback
  const handleBrushChange = useCallback(({ detail }: { detail: Brush }) => {
    updateMyPresence({ brush: detail })
  }, [updateMyPresence])

  // On pixel change, update pixels according to the current tool TODO: pixel storage rework?
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
      // recentColors = a;
      setRecentColors(a)
    }
  }

  // TODO: add callback
  // Move pixels by 1 pixel in detail.direction Direction
  const handleLayerMove = ({ detail }: { detail: { direction: Direction } }) => {
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
  // const panels: Record<PanelName, RefObject(HTMLElement | null)> = {
  //   multiplayerPanel: useRef(null),
  //   mainPanel: useRef(null),
  //   toolsPanel: useRef(null),
  // };

  const panels: Record<PanelName, React.RefObject<HTMLDivElement | null>> = {
    multiplayerPanel: useRef<HTMLDivElement | null>(null),
    mainPanel: useRef<HTMLDivElement | null>(null),
    toolsPanel: useRef<HTMLDivElement | null>(null),
  };


  // Pass current cursor position on panel, and current panel, to presence
  function handleMouseMove(event: React.PointerEvent<HTMLDivElement>, area: PanelName) {
    if (!panels[area] || !panels[area].current || !myPresence) {
      return;
    }

    const { top, left, width, height } = panels[area].current.getBoundingClientRect();

    // Position from top left corner by default
    let x = Math.round(event.clientX - left);
    let y = Math.round(event.clientY - top + panels[area].current.scrollTop);

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
    if (!panels?.[area] || !panels[area].current) {
      return;
    }

    const { top, left, width, height } = panels[area].current.getBoundingClientRect();
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
        setShowGrid(!showGrid)
        return;
      }

      if (event.key === "m") {
        setShowMove(!showMove)
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
  }, [showMove, showGrid, handleLayerMove, myPresence, redo, undo, updateMyPresence])


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
      {/* <!-- Live Cursors --> */}
      <div className="pointer-events-none absolute inset-0 z-50">
        {others?.map(({ presence, info, connectionId }) => {

          return presence?.cursor && presence?.brush ? (
            <Cursor
              key={connectionId}
              {...calculateCursorPosition(presence.cursor)}
              shrink={presence.mouseDown}
              brush={presence.brush} // 
              tool={presence.tool}
              name={presence.name || info?.name || 'NaN'} // NaN is a new addition from me, in case presence.name and info.name are falsy
            />
          ) : null
        }

        )}
      </div>

      {/* <!-- Intro dialog --> */}
      {!nameSet && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <IntroDialog
            maxPixels={maxPixels}
            loading={!pixelStorage}
            shouldCreateCanvas={!canvasReady}
            // on:createCanvas={createCanvas}
            // on:setName={setName}
            createCanvas={createCanvas}
            setName={setName}
          />
        </div>
      )}

      {/* <!-- App --> */}
      <div className="relative flex h-full min-h-full bg-white">

        {/* <!-- Left panel, containing layers etc --> */}
        <div
          className={`side-panel fixed right-full z-20 h-full w-auto flex-shrink-0 flex-grow-0 overflow-y-auto overflow-x-hidden border-gray-100 bg-white md:!relative md:right-auto md:z-10 md:!w-auto md:min-w-[320px] md:!translate-x-0 ${mobileMenuOpen
            ? 'border-r-2 drop-shadow-xl'
            : ''}`}
          id="tools-panel"
          style={{ transform: `translateX(${mobileMenuTransform}%)` }}
        // style="transform: translateX({$mobileMenuTransform}%);"
        >
          {layers && canvasReady && (
            <div
              ref={panels.toolsPanel}
              onPointerMove={(e: React.PointerEvent<HTMLDivElement>) => handleMouseMove(e, "toolsPanel")}
              onPointerLeave={(handleMouseLeave)}
              // transition:fade TODO: think of alternative, this is from svelte package
              className="relative top-[-455px] flex h-full min-h-full flex-col md:top-0"
            >
              <BrushPanel
                // on:brushChange={handleBrushChange}
                handleBrushChange={handleBrushChange}
                // bind:updateColor={updateBrushColor}
                updateColor={updateBrushColor}
                colorValue={colorValue}  // added by me only
                setColorValue={setColorValue}
                swatch={recentColors}
              />
              <LayersPanel layers={layers} maxPixels={maxPixels} />
              <ExportsPanel />
              <div className="-mt-2 mb-5 xl:hidden">
                <SharePanel />
              </div>
              <MobileLinksPanel />
            </div>
          )}
        </div>




        {/* <!-- Center panel, containing canvas, undo/redo etc. --> */}
        <div
          className="main-panel relative flex flex-grow flex-col overflow-hidden bg-gray-100"
          id="main-panel"
          onPointerLeave={handleMouseLeave}
          onPointerMove={(e: React.PointerEvent<HTMLDivElement>) => handleMouseMove(e, "mainPanel")}
        >
          {/* Part 1 conditional */}
          {canvasReady && (
            // <!-- Tool bar above canvas -->
            <div
              // transition:fade
              className="relative z-10 flex w-full flex-shrink-0 flex-grow-0 items-center justify-between border-2 border-t-0 border-gray-100 bg-white p-4"
            >
              {/* <!-- Buttons: left side --> */}
              <div className="flex gap-3">
                <SlButtonGroup>
                  {/* Brush tool HTML */}
                  <IconButton
                    screenReader="Brush tool (B)"
                    toggled={myPresence.tool === Tool.Brush}
                    handleClick={() => {
                      updateMyPresence({ tool: Tool.Brush })
                      // myPresence.update({ tool: "brush" })
                    }}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M20.71,4.63L19.37,3.29C19,2.9 18.35,2.9 17.96,3.29L9,12.25L11.75,15L20.71,6.04C21.1,5.65 21.1,5 20.71,4.63M7,14A3,3 0 0,0 4,17C4,18.31 2.84,19 2,19C2.92,20.22 4.5,21 6,21A4,4 0 0,0 10,17A3,3 0 0,0 7,14Z"
                      />
                    </svg>
                  </IconButton>

                  {/* Eraser tool HTML */}
                  <IconButton
                    screenReader="Eraser tool (E)"
                    toggled={myPresence.tool === Tool.Eraser}
                    handleClick={() => {
                      updateMyPresence({ tool: Tool.Eraser })
                      // myPresence.update({ tool: "eraser" })
                    }}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M16.24,3.56L21.19,8.5C21.97,9.29 21.97,10.55 21.19,11.34L12,20.53C10.44,22.09 7.91,22.09 6.34,20.53L2.81,17C2.03,16.21 2.03,14.95 2.81,14.16L13.41,3.56C14.2,2.78 15.46,2.78 16.24,3.56M4.22,15.58L7.76,19.11C8.54,19.9 9.8,19.9 10.59,19.11L14.12,15.58L9.17,10.63L4.22,15.58Z"
                      />
                    </svg>
                  </IconButton>

                  {/* Fill tool button HTML */}
                  <IconButton
                    screenReader="Fill tool (F)"
                    toggled={myPresence.tool === Tool.Fill}
                    handleClick={() => {
                      updateMyPresence({ tool: Tool.Fill })
                      // myPresence.update({ tool: "fill" })
                    }}
                  >
                    <svg className="mt-[6px] h-6 w-6 scale-x-[-1]" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M19,11.5C19,11.5 17,13.67 17,15A2,2 0 0,0 19,17A2,2 0 0,0 21,15C21,13.67 19,11.5 19,11.5M5.21,10L10,5.21L14.79,10M16.56,8.94L7.62,0L6.21,1.41L8.59,3.79L3.44,8.94C2.85,9.5 2.85,10.47 3.44,11.06L8.94,16.56C9.23,16.85 9.62,17 10,17C10.38,17 10.77,16.85 11.06,16.56L16.56,11.06C17.15,10.47 17.15,9.5 16.56,8.94Z"
                      />
                    </svg>
                  </IconButton>
                </SlButtonGroup>
                <SlButtonGroup>
                  {/* Toggle grid button */}
                  <IconButton
                    screenReader="Toggle grid (G)"
                    toggled={showGrid}
                    handleClick={() => (setShowGrid(!showGrid))}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </IconButton>

                  {/* Toggle move button HTML */}
                  <IconButton
                    screenReader="Toggle move (M)"
                    toggled={showMove}
                    handleClick={() => (setShowMove(!showMove))}
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
                  </IconButton>
                </SlButtonGroup>
              </div>

              {/* <!-- Buttons: right side TODO: in progress --> */}
              <div className="ml-3 flex gap-3">
              </div>

            </div>
          )}
          {/* <!-- Part 2 Main canvas --> */}
          {/* Part 3 Mobile menu bar at bottom */}
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
              <div
              // transition:fade TODO:
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
                      // TODO: solve info soon with auth.ts changes
                      // picture={self.info.picture}
                      // name={myPresence.name || self.info.name}
                      picture={"/NaN"}
                      name={myPresence.name || self?.info?.name || 'NaN'}
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
                        // TODO: solve info soon with auth.ts changes
                        // picture={info.picture}
                        // name={presence.name || info.name}
                        picture={'/NaN'}
                        name={'NaN'}
                        brush={presence.brush}
                        selectedLayer={presence.selectedLayer}
                        tool={presence.tool}
                        handleSelectColor={({ detail }: { detail: { color: string } }) => updateBrushColor(detail.color)}
                        isYou={false}
                      />
                    )
                  })}
                </div>

                {/* <!-- Share buttons--> */}
                <SharePanel></SharePanel>
              </div>


              {/* // < !--Liveblocks logo --> */}
              <div
                // transition:fade TODO:
                className="flex flex-grow items-end"
              >
                <LinksPanel />
              </div>
            </>

          )}
        </div>
      </div>

    </>
  );
}
