'use client'

// React & Hooks
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

// Third-Party Libraries
import { useHistory, useMyPresence } from "@liveblocks/react";
import panzoom from "panzoom"
import type { PanZoom } from "panzoom"
import { motion } from "framer-motion";
import { debounce } from "lodash"

// Types
import { Layer } from "@/lib/types/pixel-art-editor/layer";
import { Direction } from "@/lib/types/pixel-art-editor/direction";

// Internal components
import { IconButton } from '@/app/components/icon-button';

/**
 * Props for the PixelGrid component, defining the structure and expected types.
 */
interface PixelGridProps {
  /**
   * Array of layers representing the pixel grid.
   */
  layers: Layer[];

  /**
   * Boolean flag indicating whether the grid lines should be displayed.
   */
  showGrid: boolean;

  /**
   * Boolean flag indicating whether the user can move layers.
   */
  showMove: boolean;

  /**
   * Reference to the main panel container element, used for positioning or event handling.
   */
  mainPanelElementRef: RefObject<HTMLDivElement | null>;

  /**
   * Callback function triggered when a pixel is changed.
   * Receives an event detail containing column index, row index, and the new hex color.
   */
  handlePixelChange: ({ detail }: { detail: { col: number; row: number; hex: string } }) => void;

  /**
   * Callback function triggered when a layer is moved.
   * Receives an event detail specifying the movement direction.
   */
  handleLayerMove: ({ detail }: { detail: { direction: Direction } }) => void;
}

export function PixelGrid({
  layers = [],
  showGrid = false,
  showMove = false,
  mainPanelElementRef,
  handlePixelChange,
  handleLayerMove
}: PixelGridProps) {

  // -----------------------------------
  // State & Refs
  // -----------------------------------

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [myPresence, _] = useMyPresence();
  const history = useHistory(); // This will be used to allow us to undo/redo changes to the pixels

  // Tracks whether mouse is pressed, needed to enable tracking of history + change UI of cursor
  const [mouseIsDown, setMouseIsDown] = useState<boolean>(false);

  // Tracks whether the user is currently panning
  const [panning, setPanning] = useState<boolean>(false);

  // Tracks previously hovered pixel so that we don't end up attempting to color it again
  const [previousHoveredPixel, setPreviousHoveredPixel] = useState<Element | EventTarget | null>(null);

  // These 3 refs are needed to enable panzoom and also to bring aspect ratio support for some browsers
  const mainPanelWrapperRef = useRef<HTMLDivElement | null>(null);
  const panElementRef = useRef<HTMLDivElement | null>(null);
  const panInstanceRef = useRef<PanZoom | null>(null);

  // Memoized values to improve performance

  // I think we could do without this by directly using 'layers' too. But I did not change this from the sveltekit app so as not to break anything. 
  const layersCache = useMemo(() => layers, [layers]);

  // These are needed for the styling of the pixel grid + the aspect ratio support for browsers
  const cols = useMemo(() => layers && layers[0].grid ? layers[0].grid.length : 0, [layers]);
  const rows = useMemo(() => layers && layers[0].grid ? layers[0].grid[0].length : 0, [layers]);

  // This is needed for styling of the row element in the pixel grid
  const colsIn100 = useMemo(() => 100 / cols, [cols]);

  // -----------------------------------
  // useEffect blocks
  // -----------------------------------

  /**
   * Enables or disables panning mode on the panzoom instance.
   */
  useEffect(() => {
    if (panInstanceRef.current) {
      panInstanceRef.current[panning ? "resume" : "pause"]();
    }
  }, [panInstanceRef, panning]);

  /**
 * Adjusts element dimensions dynamically for browsers that do not support CSS `aspect-ratio`.
 * Ensures the main panel maintains the correct aspect ratio (`rows / cols`).
 *
 * This function:
 * - Checks if `aspect-ratio` is supported via `CSS.supports()`.
 * - If unsupported, calculates the correct width & height for the panel.
 * - Applies calculated dimensions to maintain the intended aspect ratio.
 *
 * Dependencies: `cols` and `rows`
 *
 * @function fixAspectRatioSupport
 * @returns {void} No return value. Updates the `style` of `mainPanelWrapperElement`.
 */
  const fixAspectRatioSupport = useCallback(() => {
    // Check if the browser supports CSS aspect-ratio
    if (CSS.supports("aspect-ratio", `${rows} / ${cols}`)) {
      return; // If supported, no need for fallback adjustments
    }

    console.warn("CSS aspect-ratio not supported, using fallback");

    // Get references to the wrapper and pan elements
    const mainPanelWrapperElement = mainPanelWrapperRef?.current;
    const panElement = panElementRef?.current;

    // Ensure both elements exist before proceeding
    if (!mainPanelWrapperElement || !panElement) return;

    // Retrieve maximum allowed width and current width of the wrapper
    const maxWidth = parseInt(getComputedStyle(mainPanelWrapperElement).maxWidth);
    const currentWidth = mainPanelWrapperElement.offsetWidth;

    // Get computed padding values of the `panElement`
    const { paddingTop, paddingRight, paddingBottom, paddingLeft } = getComputedStyle(panElement);

    // Get the actual width and height of `panElement`
    const { offsetHeight, offsetWidth } = panElement;

    // Calculate the wrapper's available width & height excluding padding
    const wrapperWidth = offsetWidth - parseFloat(paddingRight) - parseFloat(paddingLeft);
    const wrapperHeight = offsetHeight - parseFloat(paddingTop) - parseFloat(paddingBottom);

    // Compute aspect ratios for comparison
    const wrapperRatio = wrapperWidth / wrapperHeight; // Current wrapper ratio
    const artRatio = rows / cols; // Expected aspect ratio based on `rows` & `cols`

    // Initialize width and height for the wrapper
    let width: string;
    let height: string;

    // Adjust dimensions based on the ratio comparison
    if (wrapperRatio > artRatio) {
      // Case: Wrapper is wider than the intended aspect ratio
      if (wrapperHeight * artRatio > maxWidth) {
        width = "100%";
        height = `${maxWidth * artRatio}px`;
      } else {
        height = "100%";
        width = `${wrapperHeight * artRatio}px`;
      }
    } else {
      // Case: Wrapper is taller than the intended aspect ratio
      if (wrapperWidth * artRatio > maxWidth) {
        height = `${currentWidth / artRatio}px`;
        width = "100%";
      } else {
        height = `${wrapperWidth / artRatio}px`;
        width = "100%";
      }
    }

    // Apply computed width & height styles to maintain aspect ratio
    mainPanelWrapperElement.style.height = height;
    mainPanelWrapperElement.style.width = width;
  }, [cols, rows]);

  /**
   * Initializes panzoom and sets up event listeners for resizing.
   */
  useEffect(() => {
    if (panElementRef.current) {
      panInstanceRef.current = panzoom(panElementRef.current);
      panInstanceRef.current.pause();
      setPanning(false);

      fixAspectRatioSupport();
      window.addEventListener("resize", fixAspectRatioSupport);
      window.addEventListener("orientationchange", fixAspectRatioSupport);
    }
  }, [fixAspectRatioSupport]);

  /**
   * Adds keydown and keyup event listeners for panning.
   */
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // -----------------------------------
  // Functions
  // -----------------------------------

  /**
   * Handles keydown events to activate the panning state.
   * @param {Object} event - The keyboard event object.
   */
  const handleKeyDown = ({ code }: { code: KeyboardEvent["code"] }) => {
    if (panInstanceRef.current && code === "Space") {
      setPanning(true);
    }
  };

  /**
   * Handles keyup events to disable panning.
   * @param {Object} event - The keyboard event object.
   */
  const handleKeyUp = ({ code }: { code: KeyboardEvent["code"] }) => {
    if (panInstanceRef.current && code === "Space") {
      setPanning(false);
    }
  };

  /**
   * Updates pixel color if panning is not enabled.
   */
  function pixelChange({ col, row, hex }: { col: number; row: number; hex: string }) {
    if (panning) {
      return;
    }
    handlePixelChange({ detail: { col, row, hex } });
  }

  /**
 * Moves layers in the specified direction.
 * Calls the debounced version of the layer move function.
 *
 * @param {Direction} direction - The direction in which to move the layer.
 */
  const layerMove = (direction: Direction) => {
    debouncedLayerMove(direction);
  };

  /**
   * Debounced function to move layers.
   * Uses `debounce` to prevent rapid successive calls.
   *
   * @param {Direction} direction - The direction in which to move the layer.
   */
  const debouncedLayerMove = debounce((direction: Direction) => {
    handleLayerMove({ detail: { direction } });
  }, 100);

  /**
   * Handles mouse down event to pause history tracking.
   * This prevents unnecessary history states from being recorded while dragging.
   */
  function handleMouseDown() {
    setMouseIsDown(true);
    history.pause();
  }

  /**
   * Handles mouse up event to resume history tracking.
   * This allows history tracking to continue after a drag operation.
   */
  function handleMouseUp() {
    setMouseIsDown(false);
    history.resume();
  }

  /**
   * Changes pixel on mouse move if the mouse is down.
   * Ensures pixels are only modified when the mouse is actively held down and moving.
   *
   * @param {Object} param - The function parameters.
   * @param {Element | EventTarget} param.target - The DOM element being hovered.
   * @param {number} param.col - The column index of the pixel.
   * @param {number} param.row - The row index of the pixel.
   * @param {string} param.hex - The hex color value of the pixel.
   */
  function handleMouseMove({ target, col, row, hex }: { target: Element | EventTarget; col: number; row: number; hex: string }) {
    if (!mouseIsDown || previousHoveredPixel === target) {
      return;
    }
    setPreviousHoveredPixel(target);
    pixelChange({ col, row, hex });
  }

  /**
   * Handles touch movement and triggers pixel change.
   * Detects the touch position and determines the corresponding grid cell.
   *
   * @param {React.TouchEvent<HTMLDivElement>} event - The touch event.
   * @param {Object} param - Additional parameters.
   * @param {string} param.hex - The hex color value of the pixel.
   */
  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>, { hex }: { hex: string }) {
    const location = event?.touches?.[0] || event?.changedTouches?.[0] || event?.targetTouches?.[0];
    const target = document.elementFromPoint(location.clientX, location.clientY);

    // @ts-expect-error this is to disable the error "Property 'dataset' does not exist on type 'Element'.ts(2339)". It was added by old dev.
    if (target?.dataset?.col && target?.dataset?.row) {
      // @ts-expect-error this is to disable the error "Property 'dataset' does not exist on type 'Element'.ts(2339)". It was added by old dev.
      const colNumber = Number(target.dataset.col);
      // @ts-expect-error this is to disable the error "Property 'dataset' does not exist on type 'Element'.ts(2339)". It was added by old dev.
      const rowNumber = Number(target.dataset.row);

      handleMouseMove({ target, hex, col: colNumber, row: rowNumber });
    }
  }

  // -----------------------------------
  // TSX
  // -----------------------------------

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

            {/* <!--  Grid overlay --> */}
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

            {myPresence && (
              <div
                className="absolute bottom-full left-0 mb-1.5 text-sm font-bold uppercase tracking-wider text-gray-500 md:hidden"
              >
                Layer {myPresence.selectedLayer}
              </div>
            )}

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