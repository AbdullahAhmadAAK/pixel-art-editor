'use client'
import { motion } from "framer-motion";
import { debounce } from "lodash"

import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { useHistory, useMyPresence } from "@liveblocks/react";
import { IconButton } from '@/app/pixel-art-together/components/icon-button';
import { Layer } from "@/lib/types/pixel-art-editor/layer";
import { Direction } from "@/lib/types/pixel-art-editor/direction";
import panzoom from "panzoom"
import type { PanZoom } from "panzoom"

interface PixelGridProps {
  layers: Layer[];
  showGrid: boolean;
  showMove: boolean;
  mainPanelElementRef: RefObject<HTMLDivElement | null>
  handlePixelChange: ({ detail }: { detail: { col: number; row: number; hex: string; }; }) => void
  handleLayerMove: ({ detail }: { detail: { direction: Direction; }; }) => void
}

export function PixelGrid({
  layers = [],
  showGrid = false,
  showMove = false,
  mainPanelElementRef,
  handlePixelChange,
  handleLayerMove
}: PixelGridProps) {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [myPresence, _] = useMyPresence();

  const mainPanelWrapperRef = useRef<HTMLDivElement | null>(null)
  const layersCache = layers;

  // Width and height
  const cols = layers && layers[0].grid ? layers[0].grid.length : 0;
  const rows = layers && layers[0].grid ? layers[0].grid[0].length : 0;

  const [mouseIsDown, setMouseIsDown] = useState<boolean>(false)

  const panElementRef = useRef<HTMLDivElement | null>(null)
  const panInstanceRef = useRef<PanZoom | null>(null);
  const [panning, setPanning] = useState<boolean>(false)

  const history = useHistory();

  // This will either turn on or turn off the panning mode on the panzoom instance, based on what the panning state variable is set as
  useEffect(() => {
    if (panInstanceRef.current) {
      panInstanceRef.current[panning ? "resume" : "pause"]();
    }
  }, [panInstanceRef, panning])


  const [previousHoveredPixel, setPreviousHoveredPixel] = useState<Element | EventTarget | null>(null);

  const handleKeyDown = ({ code }: { code: KeyboardEvent["code"] }) => {
    if (panInstanceRef.current && code === "Space") {
      setPanning(true);
    }
  };

  const handleKeyUp = ({ code }: { code: KeyboardEvent["code"] }) => {
    if (panInstanceRef.current && code === "Space") {
      setPanning(false)
    }
  };

  // Change pixel if not panning
  function pixelChange({ col, row, hex }: { col: number, row: number, hex: string }) {
    if (panning) {
      return;
    }

    handlePixelChange({ detail: { col, row, hex } })
  }

  // const layerMove = debounce(
  //   function (direction: Direction) {
  //     handleLayerMove({ detail: { direction } })
  //   },
  //   100,
  //   true
  // );
  const layerMove = (direction: Direction) => {
    debouncedLayerMove(direction)
  }

  const debouncedLayerMove = debounce((direction: Direction) => {
    handleLayerMove({ detail: { direction } });
  }, 100);


  function handleMouseDown() {
    setMouseIsDown(true);
    history.pause();
  }

  function handleMouseUp() {
    setMouseIsDown(false)
    history.resume();
  }

  // If mouse down, change pixel
  function handleMouseMove({ target, col, row, hex }: { target: Element | EventTarget, col: number, row: number, hex: string }) {
    if (!mouseIsDown || previousHoveredPixel === target) {
      return;
    }
    setPreviousHoveredPixel(target)
    pixelChange({ col, row, hex });
  }

  // TODO: this function was passed hex, row, col, but here definition was only for hex. will be changing the usage of this function against old dev's way
  // On touch move, take hovered col/row from data-col/data-row and pass to handleMouseMove
  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>, { hex }: { hex: string }) {
    const location =
      event?.touches?.[0] ||
      event?.changedTouches?.[0] ||
      event?.targetTouches?.[0];
    const target = document.elementFromPoint(
      location.clientX,
      location.clientY
    );

    // @ts-expect-error this is to disable the error "Property 'dataset' does not exist on type 'Element'.ts(2339)". It was added by old dev.
    if (target?.dataset?.col && target?.dataset?.row) {
      // @ts-expect-error this is to disable the error "Property 'dataset' does not exist on type 'Element'.ts(2339)". It was added by old dev.
      const { col, row } = target.dataset;

      const colNumber = Number(col)
      const rowNumber = Number(row)

      handleMouseMove({ target, hex, col: colNumber, row: rowNumber }); // here, target is sent as Element
    }
  }

  // Fallback for browsers that don't support CSS `aspect-ratio` (CSS fallback not possible here)
  const fixAspectRatioSupport = useCallback(() => {
    if (CSS.supports("aspect-ratio", `${rows} / ${cols}`)) {
      return;
    }

    console.warn("CSS aspect-ratio not supported, using fallback");

    const mainPanelWrapperElement = mainPanelWrapperRef?.current
    const panElement = panElementRef?.current

    if (!mainPanelWrapperElement || !panElement) return;

    const maxWidth = parseInt(getComputedStyle(mainPanelWrapperElement).maxWidth);
    const currentWidth = mainPanelWrapperElement.offsetWidth;

    const { paddingTop, paddingRight, paddingBottom, paddingLeft } = getComputedStyle(panElement);
    const { offsetHeight, offsetWidth } = panElement;

    const wrapperWidth = offsetWidth - parseFloat(paddingRight) - parseFloat(paddingLeft);
    const wrapperHeight = offsetHeight - parseFloat(paddingTop) - parseFloat(paddingBottom);

    const wrapperRatio = wrapperWidth / wrapperHeight;
    const artRatio = rows / cols;

    let width: string;
    let height: string;

    if (wrapperRatio > artRatio) {
      if (wrapperHeight * artRatio > maxWidth) {
        width = "100%";
        height = maxWidth * artRatio + "px";
      } else {
        height = "100%";
        width = wrapperHeight * artRatio + "px";
      }
    } else {
      if (wrapperWidth * artRatio > maxWidth) {
        height = currentWidth / artRatio + "px";
        width = "100%";
      } else {
        height = wrapperWidth / artRatio + "px";
        width = "100%";
      }
    }

    mainPanelWrapperElement.style.height = height;
    mainPanelWrapperElement.style.width = width;
  }, [cols, rows])

  useEffect(() => {
    // Add panning support to canvas (hold space to pan)
    if (panElementRef.current) {
      panInstanceRef.current = panzoom(panElementRef.current);
      panInstanceRef.current.pause() // The panzoom instance is turned on by default, so we need to pause it until a space keydown event turns it on 
      setPanning(false)

      fixAspectRatioSupport();
      window.addEventListener("resize", fixAspectRatioSupport);
      window.addEventListener("orientationchange", fixAspectRatioSupport);
    }
  }, [fixAspectRatioSupport])

  // Code for the svelte:window
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const colsIn100 = 100 / cols

  return (
    <div
      className="focus-visible-style absolute inset-0 touch-none"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      onTouchStart={handleMouseDown}
      style={{ cursor: !panning ? 'crosshair' : mouseIsDown ? 'grabbing' : 'grab' }}
    >
      <div
        ref={panElementRef}
        className="absolute inset-0 flex items-center justify-center px-4 pt-8 pb-4 lg:px-12 lg:py-12"
      >
        <div
          ref={mainPanelWrapperRef}
          className="items-middle relative flex h-full max-h-full w-full max-w-2xl justify-center"
        >
          {/* <!-- Handle all events on canvas using CSS grid and HTML elements --> */}
          <div
            ref={mainPanelElementRef}
            className="absolute inset-0 m-auto max-h-full max-w-full"
            style={{ aspectRatio: `${rows} / ${cols}` }}
          >
            {/* Part 1 */}
            <div
              className="absolute inset-0 grid select-none"
              style={{ gridTemplateColumns: `repeat(${rows}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${cols}, minmax(0, 1fr))`, transform: `translateZ(0)`, gap: `0` }}
            >

              {layersCache[0].grid?.map((row, i) => (
                row.map((pixel, j) => (
                  <div
                    key={j}
                    data-row={i}
                    data-col={j}
                    onClick={() => pixelChange({ col: j, row: i, hex: pixel.color })}
                    onMouseMove={({ target }) => handleMouseMove({ target, col: j, row: i, hex: pixel.color })} // here, target is sent as EventTarget
                    onTouchMove={(event) => handleTouchMove(event, { hex: pixel.color })}
                    className="transparent-bg-pixel relative h-full w-full pt-[100%]"
                  >

                  </div>
                ))
              ))}
            </div>

            {/* <!-- Updatable SVG display of canvas --> */}
            <div className="pointer-events-none absolute inset-0 isolate">
              <svg
                className="mx-auto h-full max-w-full"
                id="svg-image"
                viewBox={`0 0 ${(rows / cols) * 100} 100`}
                xmlns="http://www.w3.org/2000/svg"
              >
                {layers.map(layer => {
                  return (
                    // <!-- A single layer -->
                    <g
                      key={layer.id}
                      style={{ mixBlendMode: layer.blendMode }}
                      className="transition-opacity duration-150"
                      opacity={layer.hidden ? 0 : layer.opacity}
                    >

                      {layer.grid?.map((row, rowIndex) =>
                        row.map((pixel, colIndex) => (
                          <rect
                            key={`${rowIndex}-${colIndex}`}
                            shapeRendering="optimizeSpeed"
                            x={colIndex * colsIn100}
                            y={rowIndex * colsIn100}
                            width={colsIn100}
                            height={colsIn100}
                            fill={pixel?.color || ""}
                            className="transition-colors duration-75"
                          />
                        ))
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* <!-- Part 3 Grid overlay --> */}
            {showGrid && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-none absolute inset-0 select-none opacity-50 mix-blend-difference"
              >
                <svg
                  className="absolute inset-0"
                  width="100%"
                  height="100%"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      x="-0.5"
                      y="-0.5"
                      id="grid"
                      width={`${100 / rows}%`}
                      height={`${100 / cols}%`}
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        shapeRendering="crispEdges"
                        d="M 1000 0 L 0 0 0 1000"
                        fill="none"
                        strokeDasharray="3,3"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </pattern>
                  </defs>
                  <rect
                    shapeRendering="crispEdges"
                    width="100%"
                    height="100%"
                    fill="url(#grid)"
                    className=""
                  />
                </svg>
              </motion.div>
            )}

            {/* Part 4 */}
            {myPresence && (
              <div
                className="absolute bottom-full left-0 mb-1.5 text-sm font-bold uppercase tracking-wider text-gray-500 md:hidden"
              >
                Layer {myPresence.selectedLayer}
              </div>
            )}

            {/* Part 5 */}
            {showMove && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-none absolute -inset-3 lg:-inset-5 flex flex-col items-stretch"
              >
                {/* 5a */}
                <div className="pointer-events-auto flex items-center justify-center">
                  <IconButton
                    screenReader="Move up"
                    handleClick={() => layerMove(Direction.Up)}
                  >
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
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </IconButton>
                </div>

                {/* 5b */}
                <div className="flex flex-grow items-center justify-between">
                  <div className="pointer-events-auto">
                    <IconButton
                      screenReader="Move left"
                      handleClick={() => layerMove(Direction.Left)}
                    >
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
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </IconButton>
                  </div>
                  <div className="pointer-events-auto">
                    <IconButton
                      screenReader="Move right"
                      handleClick={() => layerMove(Direction.Right)}
                    >
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </IconButton>
                  </div>
                </div>

                {/* 5c */}
                <div className="pointer-events-auto flex items-center justify-center">
                  <IconButton
                    screenReader="Move down"
                    handleClick={() => layerMove(Direction.Down)}
                  >
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </IconButton>
                </div>

              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}