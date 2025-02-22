if (!process.env.LIVEBLOCKS_SECRET_KEY) throw new Error("LIVEBLOCKS_SECRET_KEY not set in environment variables");

export const PIXEL_ART_EDITOR_CONFIG = {
  api_key: process.env.LIVEBLOCKS_SECRET_KEY
}