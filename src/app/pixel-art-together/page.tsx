import PixelArtEditorClientComponent from './components/page-client-components';
import { Room } from '../room';

// This contains a lot of general styles used in the pixel art page, so we kept this, even though it has a lot of styles regarding shoelace components. Would recommend changing its contents or at least renaming it.
import "@/shoelace-styles.css";

export default function PixelArtEditor() {
  return (
    <main className="flex w-[100vw] h-[100vh]">
      <Room>
        <PixelArtEditorClientComponent></PixelArtEditorClientComponent>
      </Room>
    </main>
  );
}
