import PixelArtEditorClientComponent from './components/page-client-component';
import { Room } from './room';

// This file imports general styles used across the pixel art editor page.
// Note: The styles include Shoelace component styles, which might not be ideal for this component.
// Consider renaming the file or refactoring its contents if necessary.
import "@/shoelace-styles.css";

/**
 * PixelArtEditor Component
 *
 * This is the main layout component for the pixel art editor page.
 * It wraps the editor inside a `Room` context, which handles collaboration features for the PixelArtEditor.
 *
 * @returns {JSX.Element} - The main layout for the pixel art editor.
 */
export default function PixelArtEditor() {
  return (
    // The main container takes up the full viewport width and height
    <main className="flex w-[100vw] h-[100vh]">
      {/* The `Room` component manages live collaboration or shared state */}
      <Room>
        {/* Client-side component that renders the pixel art editor */}
        <PixelArtEditorClientComponent />
      </Room>
    </main>
  );
}
