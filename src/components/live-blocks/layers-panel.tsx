import type { Layer } from "@/lib/types";

// import { slide } from "svelte/transition"; // TODO find alternative
import { useStorage, useMyPresence, useUpdateMyPresence } from '@liveblocks/react';

import { generateLayer } from "@/app/pixel-art-together/lib/utils/generate-layer";
import { blendModes } from "@/app/pixel-art-together/lib/utils/blend-modes";

import { debounce } from "@/app/pixel-art-together/lib/utils/debounce";
import { useCallback, useEffect, useRef, useState } from "react";

// import("@shoelace-style/shoelace/dist/components/menu-item/menu-item.js");
//     import("@shoelace-style/shoelace/dist/components/menu/menu.js");
//     import("@shoelace-style/shoelace/dist/components/dropdown/dropdown.js");
//     await import("@shoelace-style/shoelace/dist/components/range/range.js");

import SlMenu from '@shoelace-style/shoelace/dist/react/menu/index.js';
import SlMenuItem from '@shoelace-style/shoelace/dist/react/menu-item/index.js';
import SlDropdown from '@shoelace-style/shoelace/dist/react/dropdown/index.js';

import SlRange from '@shoelace-style/shoelace/dist/react/range/index.js';
import type SlRangeType from '@shoelace-style/shoelace/dist/components/range/range.component.d.ts';

export function LayersPanel({
  layers = [],
  maxPixels = 2600
}: {
  layers: Layer[],
  maxPixels: number
}) {

  const [myPresence, updateMyPresenceTest] = useMyPresence();
  const updateMyPresence = useUpdateMyPresence();

  const pixelStorage = useStorage((root) => root.pixelStorage);
  const layerStorage = useStorage((root) => root.layerStorage);

  // const layerPixelCount = layers[0].grid.length * layers[0].grid[0].length;
  // $: willExceedPixelCount = (layers.length + 1) * layerPixelCount > maxPixels;
  const [layerPixelCount, setLayerPixelCount] = useState<number>(layers?.length > 0 ? layers[0].grid.length * layers[0].grid[0].length : 0);
  useEffect(() => {
    if (layers?.length > 0) {
      const newLayerPixelCount = layers[0].grid.length * layers[0].grid[0].length
      setLayerPixelCount(newLayerPixelCount)
    }
  }, [layers])

  const [willExceedPixelCount, setWillExceedPixelCount] = useState<boolean>((layers.length + 1) * layerPixelCount > maxPixels)
  useEffect(() => {
    const newBoolean = (layers.length + 1) * layerPixelCount > maxPixels
    setWillExceedPixelCount(newBoolean)
  }, [layerPixelCount, maxPixels, layers])


  // I only need the tooltip formattter part from this
  // onMount(async () => {
  //   import("@shoelace-style/shoelace/dist/components/menu-item/menu-item.js");
  //   import("@shoelace-style/shoelace/dist/components/menu/menu.js");
  //   import("@shoelace-style/shoelace/dist/components/dropdown/dropdown.js");
  //   await import("@shoelace-style/shoelace/dist/components/range/range.js");
  //   rangeElement.tooltipFormatter = (value) => `Opacity: ${value}%`;
  // });

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

      // TODO: test this part when left panel all done
      // if (!$layerStorage.get(currentLayer + "") && !addingNewLayer) { sveltekit had this, idk why
      if (!layerStorage[currentLayer] && !addingNewLayer) {
        const tempLayers = Object.values(layerStorage);
        const newLayer = tempLayers[tempLayers.length > 0 ? tempLayers.length - 1 : 0].id;
        // myPresence.update({ selectedLayer: newLayer });
        updateMyPresence({ selectedLayer: newLayer })
      }

      // TODO: what was  the purpose of this? there is no layerChange function in the entire sveltekit codebase
      // dispatch("layerChange", $myPresence.selectedLayer);
    }
  }, [addingNewLayer, layerStorage, myPresence, updateMyPresence])


  // When layers update, make sure a layer is still selected
  // $: whenLayersUpdate($layerStorage, $myPresence?.selectedLayer);
  useEffect(() => {
    whenLayersUpdate()
  }, [layerStorage, whenLayersUpdate])

  // handleBlendModeChange

  // handleOpacityChange

  // toggleVisibility

  // addLayer

  // deleteLayer
  // Deletes layer using `id` TODO: this is in progress
  function deleteLayer(id, event) {
    if (event) {
      event.stopPropagation();
    }

    if (layerStorage && Object.values(layerStorage).length > 1 && layers.length > 0) {
      batch(() => {
        layerStorage.delete("" + id);
        for (let row = 0; row < layers[0].grid.length; row++) {
          for (let col = 0; col < layers[0].grid[0].length; col++) {
            $pixelStorage.delete(`${id}_${row}_${col}`);
          }
        }
      });
      selectTopLayer();
    }
  }

  // changeLayer
  // Changes to layer using `id`
  function changeLayer(id) {
    // myPresence?.update({ selectedLayer: id });
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

  // selectTopLayer
  // Selects the top layer
  function selectTopLayer() {
    if (layerStorage && myPresence) {
      const firstLayer = Object.values(layerStorage)[0].id;
      // myPresence?.update({ selectedLayer: firstLayer });
      updateMyPresence({ selectedLayer: firstLayer })
    }
  }

  return (
    <>
      <SlRange id="opacity-changer" ref={rangeElementRef}></SlRange>
      <span ref={blendTextRef}>Hi there blend text</span>
    </>
  );
}