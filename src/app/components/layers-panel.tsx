// React & Hooks
import React, { CSSProperties, useCallback, useEffect, useRef, useState } from "react";

// Third-Party Libraries
import { useStorage, useMyPresence, useMutation } from '@liveblocks/react';
import { motion } from "framer-motion";

// Utilities & Helpers
import { generateLayer } from '../utils/generate-layer';

// Types
import type { Layer } from '@/lib/types/pixel-art-editor/layer';

// Defaults and constants
import { blendModes } from '../utils/blend-modes';
import { DEFAULT_PIXEL_COLOR_NAME } from '@/app/utils/defaults';

// Internal components
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CustomTooltip } from '@/components/custom-tooltip';

/**
 * Props for the LayersPanel component.
 */
export interface LayersPanelProps {
  layers: Layer[];   // List of layers to display in the panel
  maxPixels: number;  // Maximum number of pixels allowed per layer
}

/**
 * Renders the LayersPanel, displaying a list of layers and controlling their visibility.
 * 
 * @param {LayersPanelProps} props - Component properties.
 * @param {Layer[]} props.layers - The list of layers to display.
 * @param {number} props.maxPixels - The maximum allowed pixels per layer.
 * 
 * @returns {JSX.Element} The rendered LayersPanel component.
 */

export function LayersPanel({
  layers = [],
  maxPixels = 2600
}: LayersPanelProps) {

  // -----------------------------------
  // State and Refs + 1 callback function
  // -----------------------------------
  const [myPresence, updateMyPresence] = useMyPresence();

  /**
   * This is the subscribed storage object from liveblocks. Whenever the layer data is changed on liveblocks, this will be changed and thus trigger re-renders
   */
  const layerStorage = useStorage((root) => root.layerStorage);

  /**
 * Calculates the total number of pixels in a single layer.
 *
 * This function determines the total pixel count by multiplying:
 * - The number of rows (height) in the grid → `layers[0].grid.length`
 * - The number of columns (width) in the grid → `layers[0].grid[0].length`
 *
 * It ensures:
 * - The `layers` array is not empty.
 * - The first layer exists and contains a valid grid structure.
 * - If any condition fails, it returns `0` instead of throwing an error.
 *
 * @param {Layer[]} layers - An array of layers where each layer contains a `grid` property.
 * @returns {number} The total pixel count for a single layer, or `0` if invalid.
 */
  const layerPixelCountFinder = useCallback((layers: Layer[]) => {
    if (!layers.length || !layers[0]?.grid?.length || !layers[0]?.grid[0]?.length) {
      return 0;
    }
    return layers[0].grid.length * layers[0].grid[0].length;
  }, []);

  // This state holds the total number of pixels at any point
  const [layerPixelCount, setLayerPixelCount] = useState(() => layerPixelCountFinder(layers));

  // This helps us determine whether the addition of a new layer will exceed the limit, and thus, whether to allow the user to add a new layer to the canvas
  const [willExceedPixelCount, setWillExceedPixelCount] = useState(() => (layers.length + 1) * layerPixelCount > maxPixels);

  // This is a ref pointing to the span containing the currently selected blend mode. We need this to programatically update the text in that span element.
  const blendTextRef = useRef<HTMLSpanElement | null>(null);

  // -----------------------------------
  // Derived Values & Memoized Functions
  // -----------------------------------

  /**
 * Retrieves the index of the currently selected layer.
 *
 * This function searches for the layer whose `id` matches the `selectedLayer` 
 * attribute in the `myPresence` object.
 *
 * Behavior:
 * - If `myPresence` is defined and `selectedLayer` exists, it finds the corresponding layer's index.
 * - If no match is found or `myPresence` is undefined, it defaults to `0`.
 *
 * @returns {number} The index of the selected layer, or `0` if not found.
 */
  const getLayerIndexFromSelected = useCallback(() => {
    return myPresence ? layers.findIndex(layer => layer.id === myPresence.selectedLayer) : 0;
  }, [layers, myPresence]);

  /**
 * Ensures a valid layer is always selected when `layerStorage` updates.
 *
 * Behavior:
 * - If `layerStorage` exists and `selectedLayer` is defined:
 *   - It checks whether the `selectedLayer` still exists in `layerStorage`.
 *   - If the `selectedLayer` was deleted, it selects the last available layer.
 *   - If no layers are available, it defaults to layer `0`.
 *   - This ensures that when a selected layer is deleted, a new layer is immediately selected and shown.
 *
 * @returns {void}
 */
  const whenLayersUpdate = useCallback(() => {
    if (!layerStorage || myPresence?.selectedLayer === undefined) return;

    const currentLayer = myPresence.selectedLayer;

    // If the selected layer has been deleted, fallback to the last available layer
    if (!layerStorage[currentLayer]) {
      const layersArray = Object.values(layerStorage);
      const newLayer = layersArray.length > 0 ? layersArray[layersArray.length - 1].id : 0;

      updateMyPresence({ selectedLayer: newLayer });
    }
  }, [layerStorage, myPresence, updateMyPresence]);

  // -----------------------------------
  // Layer Operations (CRUD)
  // -----------------------------------

  /**
 * Adds a new layer to the stack and updates Liveblocks storage.
 * 
 * - Generates a new layer with the same dimensions as the first layer.
 * - Updates `pixelStorage` and `layerStorage` in Liveblocks.
 * - Sets the new layer as the selected layer.
 */
  const addLayer = useMutation(({ storage }) => {
    if (!layerStorage || !layers[0]?.grid) return;

    const newId = Math.max(...Object.values(layerStorage).map(layer => layer.id), 0) + 1;

    const generatedLayer = generateLayer({
      layer: newId,
      cols: layers[0].grid[0].length,
      rows: layers[0].grid.length,
      defaultValue: DEFAULT_PIXEL_COLOR_NAME,
    });

    const pixelStorageLiveObject = storage.get('pixelStorage');
    Object.keys(generatedLayer).forEach(key => pixelStorageLiveObject.set(key, generatedLayer[key]));

    const newLayerToAdd: Layer = { id: newId, opacity: 1, blendMode: "normal", hidden: false, grid: [] };
    storage.get('layerStorage').set(newId, newLayerToAdd);

    updateMyPresence({ selectedLayer: newId });
  }, [layerStorage]);

  /**
 * Deletes a specified layer from the storage and ensures a new layer is selected.
 * 
 * - Uses `useMutation` from Liveblocks to modify the shared live state.
 * - Stops event propagation to prevent unintended parent event handlers from triggering.
 * - Removes the layer from `layerStorage` in Liveblocks.
 * - Iterates through the grid to delete all associated pixels from `pixelStorage`.
 * - Calls `selectTopLayer()` to ensure another layer is selected after deletion.
 * 
 * @param {Storage} storage - Liveblocks storage object.
 * @param {number} layerId - The ID of the layer to delete.
 * @param {React.MouseEvent} event - The click event triggering the deletion.
 */
  const deleteLayer = useMutation(({ storage }, layerId: number, event: React.MouseEvent) => {
    event?.stopPropagation(); // Prevents unintended parent event handlers from triggering.

    if (layerStorage && layers.length > 1) {
      const layerStorageLiveObject = storage.get('layerStorage');
      const pixelStorageLiveObject = storage.get('pixelStorage');

      // Remove the layer from live storage.
      layerStorageLiveObject.delete(`${layerId}` as unknown as number); // Layer ID is stored as a number, but Liveblocks expects a string.

      // Remove all associated pixels from storage.
      for (let row = 0; row < layers[0].grid.length; row++) {
        for (let col = 0; col < layers[0].grid[0].length; col++) {
          pixelStorageLiveObject.delete(`${layerId}_${row}_${col}`);
        }
      }

      // Select another layer after deletion to maintain active selection.
      selectTopLayer();
    }
  }, [layers, layerStorage]);

  /**
  * Changes the currently selected layer and updates the UI accordingly.
  *
  * - Updates the `selectedLayer` in Liveblocks presence.
  * - If the blend mode text reference (`blendTextRef`) exists, updates it to reflect the 
  *   blend mode of the newly selected layer.
  *
  * @param {number} layerId - The ID of the layer to select.
  */
  const changeLayer = (layerId: number) => {
    updateMyPresence({ selectedLayer: layerId });

    if (blendTextRef.current) {
      // Updates the blend mode text UI to match the selected layer's blend mode.
      blendTextRef.current.innerText = layers[getLayerIndexFromSelected()]?.blendMode || "normal";
    }
  };


  /**
 * Selects the topmost layer (first in storage) and updates the user's presence.
 *
 * - Retrieves the first layer from `layerStorage`.
 * - Updates the `selectedLayer` in Liveblocks presence to reflect this layer.
 *
 * This is typically called when a layer is deleted, ensuring a valid layer remains selected.
 */
  const selectTopLayer = () => {
    if (layerStorage && myPresence) {
      const firstLayer = layerStorage[0].id;
      updateMyPresence({ selectedLayer: firstLayer });
    }
  };

  // -----------------------------------
  // Layer Property Updates
  // -----------------------------------

  /**
 * Handles changing the blend mode for the selected layer.
 *
 * - Retrieves `layerStorage` from Liveblocks storage.
 * - Finds the currently selected layer using `myPresence`.
 * - Updates the `blendMode` of the selected layer.
 * - Updates the UI reference `blendTextRef` with the new mode.
 *
 * @param storage - Liveblocks storage object.
 * @param args - Event object containing dataset attributes.
 */
  const handleBlendModeChange = useMutation(({ storage }, args: { target: HTMLElement | null }) => {
    if (!myPresence || !layerStorage || !blendTextRef?.current || !args?.target) return;

    const index = myPresence.selectedLayer;
    const oldLayer = layerStorage[index];

    // Extract blend mode value from dataset
    const newBlendModeValue = args.target.dataset.value as CSSProperties['mixBlendMode'];
    if (!newBlendModeValue) return;

    // Update layer blend mode in storage
    const layerStorageLiveObject = storage.get('layerStorage');
    layerStorageLiveObject.set(index, { ...oldLayer, blendMode: newBlendModeValue });

    // Update UI reference text
    blendTextRef.current.innerText = newBlendModeValue;
  }, [myPresence?.selectedLayer, layerStorage,]);

  /**
 * Updates the opacity of the selected layer.
 *
 * - Ensures `myPresence` and `layerStorage` exist before proceeding.
 * - Retrieves the currently selected layer from `myPresence`.
 * - Converts the new opacity value from a range of **0-100** to **0-1** (normalized).
 * - Updates the layer’s opacity in **Liveblocks storage**.
 *
 * @param storage - Liveblocks storage object for real-time state updates.
 * @param newOpacity - The new opacity value (expected range: **0-100**).
 */
  const handleOpacityChange = useMutation(({ storage }, newOpacity: number) => {
    if (!myPresence || !layerStorage) return;

    const index = myPresence.selectedLayer;
    const oldLayer = layerStorage[index];

    const layerStorageLiveObject = storage.get('layerStorage');
    const normalizedOpacity = newOpacity / 100
    layerStorageLiveObject.set(index, { ...oldLayer, opacity: normalizedOpacity });
  }, [myPresence?.selectedLayer, layerStorage]);


  /**
  * Toggles the visibility of a specified layer.
  *
  * - Prevents event propagation to avoid unintended side effects.
  * - Ensures `layerStorage` exists before proceeding.
  * - Retrieves the current layer state and toggles its `hidden` property.
  * - Updates the layer's visibility in **Liveblocks storage**.
  *
  * @param storage - Liveblocks storage object for real-time state updates.
  * @param layerId - The ID of the layer whose visibility should be toggled.
  * @param event - The mouse event, used to stop propagation.
  */
  const toggleVisibility = useMutation(({ storage }, layerId: number, event: React.MouseEvent) => {
    event?.stopPropagation(); // Prevents event bubbling
    if (!layerStorage) return;

    const oldLayer = layerStorage[layerId];

    const layerStorageLiveObject = storage.get('layerStorage');
    layerStorageLiveObject.set(layerId, { ...oldLayer, hidden: !oldLayer.hidden }); // Toggle visibility
  }, [layerStorage]);

  // -----------------------------------
  // useEffect Blocks
  // -----------------------------------

  /**
 * Updates the `layerPixelCount` state whenever layers change.
 * Calls `layerPixelCountFinder(layers)` to recalculate the total number of pixels in all layers.
 */
  useEffect(() => {
    setLayerPixelCount(layerPixelCountFinder(layers));
  }, [layers, layerPixelCountFinder]);

  /**
   * Determines whether adding a new layer would exceed the maximum allowed pixel count.
   * Updates the `willExceedPixelCount` state to prevent excessive layer creation.
   */
  useEffect(() => {
    setWillExceedPixelCount((layers.length + 1) * layerPixelCount > maxPixels);
  }, [layerPixelCount, maxPixels, layers]);

  /**
   * Ensures the selected layer is updated correctly when `layerStorage` changes.
   * Calls `whenLayersUpdate()` to handle any necessary updates.
   */
  useEffect(() => {
    whenLayersUpdate();
  }, [layerStorage, whenLayersUpdate]);

  // -----------------------------------
  // TSX
  // -----------------------------------

  return (
    <>
      <div className="border-t-2 border-gray-100 p-5 text-sm">

        <div className="pb-3 font-semibold text-gray-500">Layers</div>

        <div className="select-none text-sm text-gray-700">
          <div className="rounded-[4px] border border-[#D4D4D8]">
            {/* <!-- Blend/opacity bar --> */}
            {layerStorage && myPresence && (
              <div className="items-middle relative z-10 flex justify-between border-b">
                <label htmlFor="blend-mode-changer" className="sr-only">Change blend mode</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="focus-visible:z-10">
                      <CustomTooltip tooltipContent="Blend mode">
                        <span className="capitalize" ref={blendTextRef}>
                          {layers[getLayerIndexFromSelected()]?.blendMode || "normal"}
                        </span>
                      </CustomTooltip>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="relative z-10">
                    {blendModes.map((mode) => (
                      <DropdownMenuItem key={"blendModes" + mode.name} data-value={mode.name} onSelect={(e) => handleBlendModeChange({ target: e.currentTarget as HTMLElement })}>
                        <div className="text-sm">{mode.label}</div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex max-w-[140px] items-center justify-center pr-4">
                  <label htmlFor="opacity-changer" className="sr-only">Change opacity</label>
                  <Slider
                    id="opacity-changer"
                    onValueChange={(valueArray) => handleOpacityChange(valueArray[0])} // Slider returns an array
                    value={[layers[getLayerIndexFromSelected()]?.opacity * 100]}
                    max={100}
                    min={0}
                    step={1}
                    className='w-[200px]'
                  />
                </div>
              </div>
            )}

            {/* <!-- New layer bar --> */}
            {!willExceedPixelCount ? (
              <button
                className="focus-visible-style group relative flex w-full cursor-pointer select-none bg-gray-50 px-2 py-2.5 focus-visible:z-10"
                onClick={addLayer}
              >
                <span
                  className="pr-2 text-gray-400 transition-colors group-hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      clipRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                      fillRule="evenodd"
                    />
                  </svg>
                </span>
                <span
                  className="font-semibold text-gray-500 transition-colors group-hover:text-gray-700"
                >
                  Add new layer
                </span>
              </button>
            ) : (
              <div
                className="relative flex w-full select-none bg-gray-50 px-2 py-2.5 cursor-not-allowed"
              >
                <span
                  className="pr-2 text-red-400 transition-colors group-hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      clipRule="evenodd"
                      d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                      fillRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="font-semibold text-red-500"> Pixel limit reached </span>
              </div>
            )}

            {/* <!-- All layers --> */}
            <div className="flex flex-col-reverse">
              {layers.map((layer) => (
                <motion.div
                  key={layer.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.5 }}
                  style={myPresence.selectedLayer === layer.id ?
                    { backgroundColor: `var(--sl-color-primary-600)`, color: '#fff' } :
                    {}
                  }
                  className={`group relative flex cursor-pointer items-center justify-between gap-1 border-t py-0.5 hover:bg-[color:var(--sl-color-primary-50)] ${myPresence?.selectedLayer ===
                    layer.id
                    ? 'bg-gray-100 font-semibold'
                    : 'bg-white'}`}
                >
                  <button
                    className="focus-visible-style absolute inset-0 block w-full transition-all focus-visible:z-10"
                    onClick={() => changeLayer(layer.id)}
                  >
                    <span className="sr-only">Select layer {layer.id}</span>
                  </button>

                  <div className="relative flex items-center">
                    <CustomTooltip tooltipContent={layer.hidden ? "Show" : 'Hide'}>
                      <button
                        onClick={(e) => toggleVisibility(layer.id, e)}
                        className={`focus-visible-style focus-visible:!opacity-100 ${myPresence?.selectedLayer ===
                          layer.id
                          ? 'text-[color:var(--sl-color-primary-200)] hover:!text-white'
                          : ''} cursor-pointer p-2 text-gray-400 hover:text-gray-600`}
                      >
                        {!layer.hidden ? (
                          <>
                            <span className="sr-only">Hide layer {layer.id}</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path
                                fillRule="evenodd"
                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span className="sr-only">Show layer {layer.id}</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                                clipRule="evenodd"
                              />
                              <path
                                d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
                              />
                            </svg>
                          </>
                        )}
                      </button>
                    </CustomTooltip>

                    <span className={`font-medium ${myPresence?.selectedLayer === layer.id ? 'font-bold' : ''}`}>
                      Layer {layer.id}
                    </span>
                  </div>

                  <div>
                    {Math.round(layer.opacity * 100)}%, {layer.blendMode}
                  </div>

                  <CustomTooltip tooltipContent='Delete'>
                    <button
                      onClick={(e) => deleteLayer(layer.id, e)}
                      className={`focus-visible-style relative ${myPresence?.selectedLayer === layer.id
                        ? 'text-[color:var(--sl-color-primary-200)] hover:!text-white'
                        : ''} cursor-pointer p-2 text-gray-400 hover:text-gray-600`}
                    >
                      <span className="sr-only">Delete layer {layer.id}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </CustomTooltip>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </>
  );
}