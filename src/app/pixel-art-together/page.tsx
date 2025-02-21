'use client'
import { Room } from '../room';

export type PixelObject = {
  layer: number;
  row: number;
  col: number;
  value?: string;
};

// A key for a pixel, e.g. '0_1_2'
export type PixelKey = string;
export type PixelColor = string;

export type PixelStorage = {
  [key: string]: string; // Replace PixelObject with the actual structure if it's different
};

import PixelArtEditorClientComponent from './components/page-client-components';

export default function PixelArtEditor() {
  return (
    <>
      <div>hi tina</div>
      <Room>
        <PixelArtEditorClientComponent></PixelArtEditorClientComponent>
      </Room>
    </>
  );
}
