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
} from "@liveblocks/react";

import { motion, useSpring } from "framer-motion";
import { useCallback, useState, useEffect, useRef } from 'react';
import { formatLayers } from '../lib/utils/format-layers';
import { generateLayer } from '../lib/utils/generate-layer';
import { useStorage, useMutation } from "@liveblocks/react";

import { Direction } from '@/lib/types/pixel-art-editor/direction';
import { Tool } from '@/lib/types/pixel-art-editor/tool';
import { Layer } from '@/lib/types/pixel-art-editor/layer';
import { PanelName } from '@/lib/types/pixel-art-editor/panel-name';

import { getFillPixels } from '../lib/utils/get-fill-pixels';
import { getMovePixels } from '../lib/utils/get-move-pixels';

import { Cursor } from "@/app/pixel-art-together/components/cursor";
import { IntroDialog } from "@/app/pixel-art-together/components/intro-dialog";
import { BrushPanel } from "@/app/pixel-art-together/components/brush-panel";
import { LayersPanel } from '@/app/pixel-art-together/components/layers-panel';

// Import CSS
import '../pixel-art-styles.css'
import { ExportsPanel } from "@/app/pixel-art-together/components/exports-panel";
import { SharePanel } from "@/app/pixel-art-together/components/share-panel";
import { MobileLinksPanel } from "@/app/pixel-art-together/components/mobile-links-panel";
import { LinksPanel } from "@/app/pixel-art-together/components/links-panel";
import { UserOnline } from '@/app/pixel-art-together/components/user-online';
import { IconButton } from '@/app/pixel-art-together/components/icon-button';
import { PixelGrid as PixelGridSegment } from '@/app/pixel-art-together/components/pixel-grid';
import Image from 'next/image';
import { MobileColorPicker } from '@/app/pixel-art-together/components/mobile-color-picker';
import { DEFAULT_PIXEL_COLOR_NAME } from '@/app/pixel-art-together/lib/utils/defaults';
import { Swatch } from '../lib/utils/swatch';

import { PixelStorage } from '@/lib/types/pixel-art-editor/pixel-storage';
import { PixelObject } from '@/lib/types/pixel-art-editor/pixel-object';
import { PixelKey } from '@/lib/types/pixel-art-editor/pixel-key';
import { BrushData } from '@/lib/types/pixel-art-editor/brush-data';

export default function PixelArtEditorClientComponent() {
  useEffect(() => {
    function onResize() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    }

    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

  }, [])
  const [myPresence, _] = useMyPresence();
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
    [myPresence.selectedLayer]
  );

  // Convert a pixel key into a pixel object
  const keyToPixel = useCallback((key: PixelKey): PixelObject => {
    const [layer, row, col] = key.split("_").map((num) => parseInt(num));
    return { layer, row, col };
  }, []);

  // Get the current pixel, using a pixel object. Includes fallback for a previous storage system
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

  // Update an array of pixels, with the pixelArray.value object, or newObj if none set. newVal is either brush.color, which seems to be a string, or it is "". In either case, it's string.
  const updatePixels = useMutation(({ storage }, pixelArray: PixelObject[], newVal: string) => {
    const updatedPixels: PixelStorage = {};
    pixelArray.forEach((pixelProps) =>
      // handleLayerMove calls this to just move the layers towards a certain direction. In that case, newVal will not be provided to the function, and we will make do with the already present values
      (updatedPixels[pixelToKey(pixelProps)] = pixelProps.value || newVal)
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
        pixelStorage,
        layerStorage,
        keyToPixel,
        getPixel,
      });

      setLayers(formattedLayers);
    }
  }, [pixelStorage, layerStorage, keyToPixel, getPixel])

  // const [canvasReady, setCanvasReady] = useState<boolean>(false)
  const [canvasReady, setCanvasReady] = useState<boolean>(pixelStorage ? Object.keys(pixelStorage).length > 0 : false)

  const [isDataLoading, setIsDataLoading] = useState<boolean>(true)

  useEffect(() => {
    const newCanvasReady = pixelStorage ? Object.keys(pixelStorage).length > 0 : false
    setCanvasReady(newCanvasReady)

    // We keep this here instead of directly with pixelStorage to loading, so that both are sent at the same time. Will prevent jitters.
    if (pixelStorage) {
      setIsDataLoading(false)
    }

  }, [pixelStorage])

  // ================================================================================
  // INTRO DIALOG

  const [nameSet, setNameSet] = useState<boolean>(false)

  const setName = useCallback(({ detail }: { detail: { name: string } }) => {
    updateMyPresence({ name: detail.name });
    setNameSet(true);
  }, [updateMyPresence]);


  const updatePixelStorageWithLayer = useMutation(({ storage }, layerPixels) => {
    const pixelStorageTester = storage.get('pixelStorage')

    Object.keys(layerPixels).map(pixelKey => {
      pixelStorageTester.set(pixelKey, layerPixels[pixelKey])
    })
  }, []);

  const updateLayerStorageWithLayer = useMutation(({ storage }, layerKey, layer) => {
    const layerStorage = storage.get('layerStorage')
    layerStorage.set(0, {
      id: 0,
      opacity: 1,
      blendMode: "normal",
      hidden: false,
      grid: []
    })
  }, []);

  const createCanvas = useCallback(
    ({ detail }: { detail: { name: string; width: number; height: number } }) => {
      if (layerStorage) {
        const defaultLayerPixels = generateLayer({
          layer: 0,
          rows: detail.height,
          cols: detail.width,
          defaultValue: DEFAULT_PIXEL_COLOR_NAME,
        });

        updatePixelStorageWithLayer(defaultLayerPixels);
        updateLayerStorageWithLayer(0, {
          id: 0,
          opacity: 1,
          blendMode: "normal",
          hidden: false,
        });

        setName({ detail });
      }
    },
    [layerStorage, setName, updatePixelStorageWithLayer, updateLayerStorageWithLayer]
  );


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

  // Recently used colors to be passed to the swatch
  const [recentColors, setRecentColors] = useState<Swatch>(new Array(16).fill("#ffffffff"))

  // On brush component change, update presence with new brush
  const handleBrushChange = useCallback(({ detail }: { detail: BrushData }) => {
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
      const currentLayer = layers.find((layer) => layer.id === selected)!; // had no other option but to assert here
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
      setRecentColors(a)

      console.log('recent colors are now: ', a)
    }
  }

  // Move pixels by 1 pixel in detail.direction Direction
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

    updatePixels(movedLayer, "");
  }, [canvasReady, keyToPixel, myPresence, pixelStorage, updatePixels])

  // ================================================================================
  // LIVE CURSORS

  /**
   * Live cursor position is calculated according to which panel is currently being
   * used. The center panel uses a percentage value calculated from the middle of
   * the panel, whereas the two side panels use a pixel value from the top left
   * corner.
   */

  // The different panels
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

    updateMyPresence({ cursor: { x, y, area } })
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
    updateMyPresence({ cursor: null })
  }

  // ================================================================================
  // MOBILE MENU 

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Spring animation for mobile menu

  const [mobileMenuTransform, setMobileMenuTransform] = useState(useSpring(0, { stiffness: 70, damping: 10, }))

  useEffect(() => {
    mobileMenuTransform.set(mobileMenuOpen ? 100 : 0);
  }, [mobileMenuOpen, mobileMenuTransform])

  // When `mobileMenuOpen` changes, set spring value

  // ================================================================================
  // KEYBOARD SHORTCUTS

  // B for brush, F for fill, E for eraser, M for move, G for grid
  // Arrow keys to move layers if showMove truthy
  // Ctrl+Z for undo. Ctrl+Shift+Z and Ctrl+Y for redo.
  // Handle keydown event

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
      <div className="relative flex w-full h-full min-h-full bg-white">

        {/* <!-- Left panel, containing layers etc --> */}
        <div
          className={`side-panel fixed right-full z-20 h-full w-auto flex-shrink-0 flex-grow-0 overflow-y-auto overflow-x-hidden border-gray-100 bg-white md:!relative md:right-auto md:z-10 md:!w-auto md:min-w-[320px] md:!translate-x-0 ${mobileMenuOpen
            ? 'border-r-2 drop-shadow-xl'
            : ''}`}
          id="tools-panel"
          style={{ transform: `translateX(${mobileMenuTransform}%)` }}
        >
          {layers && canvasReady && (
            <motion.div
              ref={panels.toolsPanel}
              onPointerMove={(e: React.PointerEvent<HTMLDivElement>) => handleMouseMove(e, "toolsPanel")}
              onPointerLeave={(handleMouseLeave)}
              className="relative top-[-455px] flex h-full min-h-full flex-col md:top-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <BrushPanel
                handleBrushChange={handleBrushChange}
                updateColor={updateBrushColor}
                colorValue={colorValue}
                setColorValue={setColorValue}
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
        </div>




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
                <SlButtonGroup>
                  {/* Brush tool HTML */}
                  <IconButton
                    screenReader="Brush tool (B)"
                    toggled={myPresence.tool === Tool.Brush}
                    handleClick={() => {
                      updateMyPresence({ tool: Tool.Brush })
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

              {/* <!-- Buttons: right side --> */}
              <div className="ml-3 flex gap-3">
                <SlButtonGroup>
                  <IconButton screenReader="Undo" handleClick={() => undo()}>
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
                  </IconButton>

                  <IconButton screenReader="Redo" handleClick={() => redo()}>
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
                  </IconButton>
                </SlButtonGroup>
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
                        strokeLinejoin-linejoin="round"
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
                  swatch={recentColors}
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
