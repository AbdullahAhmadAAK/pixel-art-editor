// Note: the purpose of this file is to enable TS to recognize the native EyeDropper API
interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropperAPI {
  open: () => Promise<EyeDropperResult>;
}

declare global {
  interface Window {
    EyeDropper?: new () => EyeDropperAPI;
  }
}

export { }; // Ensures this file is treated as a module