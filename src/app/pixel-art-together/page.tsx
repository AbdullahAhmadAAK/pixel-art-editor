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
      {/* <div>hi tina</div> */}
      {/* <Room>
        <PixelArtEditorClientComponent></PixelArtEditorClientComponent>
      </Room> */}

      <main className="flex w-[100vw] h-[100vh]">

        {/* <div className="relative flex w-full h-full min-h-full bg-white"> */}

        {/* <div className='h-full bg-red-500'>left</div>

          <div className='h-full bg-blue-500'>center</div>

          <div className='h-full bg-green-500'>right</div> */}
        <Room>
          <PixelArtEditorClientComponent></PixelArtEditorClientComponent>
        </Room>
        {/* </div> */}

        {/* <div className="grow h-full bg-gray-100">
          <h1>im the ccanvas baby</h1>
        </div>
        <div className="w-[300px] h-full">
          <h1>checkc me out sidebar ehre</h1>
        </div> */}
      </main>
    </>
  );
}
