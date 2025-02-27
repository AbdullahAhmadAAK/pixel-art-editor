// Note: the purpose of this file is to enable TS to recognize the native EyeDropper API

/**
 * Represents the result returned by the EyeDropper API.
 */
interface EyeDropperResult {
  /** The selected color in sRGB hex format (e.g., "#ffaa12") */
  sRGBHex: string;
}

/**
 * Represents the native EyeDropper API.
 */
interface EyeDropperAPI {
  /**
   * Opens the eyedropper tool and returns the selected color.
   * @returns A promise that resolves to an `EyeDropperResult`
   */
  open: () => Promise<EyeDropperResult>;
}

/**
 * Extends the global `window` object to recognize the EyeDropper API.
 */
declare global {
  interface Window {
    /** Native EyeDropper API, if supported by the browser */
    EyeDropper?: new () => EyeDropperAPI;
  }
}

export { }; // Ensures this file is treated as a module