import PixelArtEditorClientComponent from './components/page-client-components';
import { Room } from '../room';
import "@/shoelace-styles.css"; // TODO: remove at end when everyting converted from shoelace to oter

export default function PixelArtEditor() {
  return (
    <main className="flex w-[100vw] h-[100vh]">
      <Room>
        <PixelArtEditorClientComponent></PixelArtEditorClientComponent>
      </Room>
    </main>
  );
}
