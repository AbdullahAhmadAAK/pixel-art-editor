import type { Layer } from '@/lib/types/pixel-art-editor/layer';
import { useStorage, useMyPresence, useUpdateMyPresence, useMutation } from '@liveblocks/react';
import { generateLayer } from "@/app/pixel-art-together/lib/utils/generate-layer";
import { blendModes } from "@/app/pixel-art-together/lib/utils/blend-modes";
import React, { useCallback, useEffect, useRef, useState } from "react";

import SlMenu from '@shoelace-style/shoelace/dist/react/menu/index.js';
import SlMenuItem from '@shoelace-style/shoelace/dist/react/menu-item/index.js';
import SlDropdown from '@shoelace-style/shoelace/dist/react/dropdown/index.js';
import SlButton from '@shoelace-style/shoelace/dist/react/button/index.js';
import SlTooltip from '@shoelace-style/shoelace/dist/react/tooltip/index.js';
import SlRange from '@shoelace-style/shoelace/dist/react/range/index.js';
import type SlRangeType from '@shoelace-style/shoelace/dist/components/range/range.component.d.ts';

import { motion } from "framer-motion";
import { DEFAULT_PIXEL_COLOR_NAME } from '@/app/pixel-art-together/lib/utils/defaults';

export function LayersPanel({
  layers = [],
  maxPixels = 2600
}: {
  layers: Layer[],
  maxPixels: number
}) {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [myPresence, _] = useMyPresence();
  const updateMyPresence = useUpdateMyPresence();

  const layerStorage = useStorage((root) => root.layerStorage);

  const layerPixelCountFinder = (layers: Layer[]) => {
    if (!layers || layers.length == 0 || !layers[0].grid || !layers[0].grid[0] || layers[0].grid[0].length == 0) return 0
    else return layers[0].grid.length * layers[0].grid[0].length
  }

  const [layerPixelCount, setLayerPixelCount] = useState<number>(layerPixelCountFinder(layers));

  useEffect(() => {
    const newLayerPixelCount = layerPixelCountFinder(layers)
    setLayerPixelCount(newLayerPixelCount)
  }, [layers])

  const [willExceedPixelCount, setWillExceedPixelCount] = useState<boolean>((layers.length + 1) * layerPixelCount > maxPixels)
  useEffect(() => {
    const newBoolean = (layers.length + 1) * layerPixelCount > maxPixels
    setWillExceedPixelCount(newBoolean)
  }, [layerPixelCount, maxPixels, layers])

  const rangeElementRef = useRef<SlRangeType | null>(null);
  const blendTextRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (rangeElementRef?.current) {
      rangeElementRef.current.tooltipFormatter = (value) => `Opacity: ${value}%`;
    }
  }, [rangeElementRef])

  const getLayerIndexFromSelected = useCallback(
    () => {
      if (myPresence) {
        return layers.findIndex(
          (layer) => layer.id === myPresence.selectedLayer
        );
      }
      return 0;
    }, [layers, myPresence])

  useEffect(() => {
    if (rangeElementRef?.current) {
      rangeElementRef.current.value = layers[getLayerIndexFromSelected()]?.opacity * 100 || 0;
    }
  }, [layers, getLayerIndexFromSelected])

  const [addingNewLayer, setAddingNewLayer] = useState<boolean>(false)

  const whenLayersUpdate = useCallback(() => {
    if (
      layerStorage &&
      myPresence &&
      myPresence.selectedLayer !== undefined
    ) {
      const currentLayer = myPresence.selectedLayer;
      if (!layerStorage[currentLayer] && !addingNewLayer) {
        const tempLayers = Object.values(layerStorage);
        const newLayer = tempLayers[tempLayers.length > 0 ? tempLayers.length - 1 : 0].id;
        updateMyPresence({ selectedLayer: newLayer })
      }
    }
  }, [addingNewLayer, layerStorage, myPresence, updateMyPresence])


  // When layers update, make sure a layer is still selected
  useEffect(() => {
    whenLayersUpdate()
  }, [layerStorage, whenLayersUpdate])

  // Update current layer blend mode on change
  const handleBlendModeChange = useMutation(({ storage }, { detail }) => {
    const layerStorage = storage.get('layerStorage')
    if (!myPresence || !layerStorage || !blendTextRef?.current) {
      return;
    }

    const layerStorageObject = layerStorage.toObject()
    const index = myPresence.selectedLayer;
    const oldLayer = layerStorageObject[index];
    const newLayer = { ...oldLayer, blendMode: detail.item.dataset.value };

    layerStorage.set(myPresence.selectedLayer, newLayer)
    blendTextRef.current.innerText = detail.item.dataset.value;
  }, [])

  // Update current layer opacity on change
  const handleOpacityChange = useMutation(({ storage }, event) => {
    const target = event.target
    const layerStorage = storage.get('layerStorage')
    if (!myPresence || !layerStorage) {
      return;
    }

    const layerStorageObject = layerStorage.toObject()
    const firstIndex = myPresence.selectedLayer;
    const oldLayer = layerStorageObject[firstIndex];
    const newLayer: Layer = { ...oldLayer, opacity: target.value / 100 };
    layerStorage.set(myPresence.selectedLayer, newLayer)
  }, [myPresence.selectedLayer])

  // Toggle visibility of current layer
  const toggleVisibility = useMutation(({ storage }, layerId: number, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (event) {
      event.stopPropagation();
    }

    const layerStorage = storage.get('layerStorage')
    const layerStorageObject = layerStorage.toObject()
    if (!layerStorage) return

    const oldLayer = layerStorageObject[layerId]
    const newLayer = { ...oldLayer, hidden: !oldLayer.hidden };
    layerStorage.set(layerId, newLayer)
  }, [])

  // Adds new layer to top of stack
  const addLayer = useMutation(({ storage }) => {
    const layerStorage = storage.get('layerStorage')

    if (!layerStorage || !layers || layers.length == 0 || !layers[0].grid) return;

    const layerStorageObject = layerStorage.toObject()
    let newId = 0;
    Object.values(layerStorageObject).map((layer) => {
      if (layer.id > newId) {
        newId = layer.id;
      }
    });
    newId++;

    const generatedLayer = generateLayer({
      layer: newId,
      cols: layers[0].grid[0].length,
      rows: layers[0].grid.length,
      defaultValue: DEFAULT_PIXEL_COLOR_NAME,
    });

    const pixelStorage = storage.get('pixelStorage')

    Object.keys(generatedLayer).forEach(key => {
      pixelStorage.set(key, generatedLayer[key])
    })

    layerStorage.set(newId, {
      id: newId,
      opacity: 1,
      blendMode: "normal",
      hidden: false,
      grid: []
    })

    setAddingNewLayer(true)
    updateMyPresence({ selectedLayer: newId })
    setTimeout(() => (setAddingNewLayer(false)));
  }, [])


  // Deletes layer using `id`
  const deleteLayer = useMutation(({ storage }, id: number, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (event) {
      event.stopPropagation();
    }

    const layerStorage = storage.get('layerStorage')
    const pixelStorage = storage.get('pixelStorage')

    if (layerStorage && layers.length > 1) {
      layerStorage.delete(`${id}` as unknown as number) // The old developer had layer ID as number, but liveblocks expects strings, so we cast it

      for (let row = 0; row < layers[0].grid.length; row++) {
        for (let col = 0; col < layers[0].grid[0].length; col++) {
          pixelStorage.delete(`${id}_${row}_${col}`)
        }
      }
      selectTopLayer();
    }
  }, [layers]) // This will update the layers array in the function whenever the layers state changes 

  // Changes to layer using `id`
  function changeLayer(id: number) {
    updateMyPresence({ selectedLayer: id })

    if (blendTextRef.current) {
      blendTextRef.current.innerText =
        layers[getLayerIndexFromSelected()]?.blendMode || "normal";
    }
    if (rangeElementRef.current) {
      rangeElementRef.current.value =
        layers[getLayerIndexFromSelected()]?.opacity * 100 || 100;
    }
  }

  // Selects the top layer
  function selectTopLayer() {
    if (layerStorage && myPresence) {
      const firstLayer = Object.values(layerStorage)[0].id;
      updateMyPresence({ selectedLayer: firstLayer })
    }
  }

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

                <SlDropdown
                  id="blend-mode-changer"
                  onSelect={handleBlendModeChange}
                >
                  <SlButton
                    className="focus-visible:z-10"
                    variant="text"
                    slot="trigger"
                    caret
                  >
                    <SlTooltip content="Blend mode">
                      <span className="capitalize" ref={blendTextRef}>
                        {layers[getLayerIndexFromSelected()]?.blendMode || "normal"}
                      </span>
                    </SlTooltip>
                  </SlButton>

                  <SlMenu className="relative z-10">
                    {blendModes.map(mode => (
                      <SlMenuItem key={"blendModes" + mode.name} data-value={mode.name}>
                        <div className="text-sm">{mode.label}</div>
                      </SlMenuItem>
                    ))}
                  </SlMenu>
                </SlDropdown>

                <div className="flex max-w-[140px] items-center justify-center pr-4">
                  <label htmlFor="opacity-changer" className="sr-only">Change opacity</label>
                  <SlRange
                    id="opacity-changer"
                    onInput={handleOpacityChange}
                    ref={rangeElementRef}
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
              {layers.map(layer => (
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
                    <SlTooltip content={layer.hidden ? "Show" : 'Hide'}>
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
                    </SlTooltip>

                    <span className={`font-medium ${myPresence?.selectedLayer === layer.id ? 'font-bold' : ''}`}>
                      Layer {layer.id}
                    </span>
                  </div>

                  <div>
                    {Math.round(layer.opacity * 100)}%, {layer.blendMode}
                  </div>

                  <SlTooltip content="Delete" placement="top">
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
                  </SlTooltip>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </>
  );
}