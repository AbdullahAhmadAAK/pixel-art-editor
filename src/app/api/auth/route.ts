import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";
import { PIXEL_ART_EDITOR_CONFIG } from "@/config/pixel-art-editor";
import { LiveblocksUserMeta } from "@/lib/types/pixel-art-editor/liveblocks-user-meta";

// Initialize the Liveblocks instance with the API key from the configuration
const liveblocks = new Liveblocks({ secret: PIXEL_ART_EDITOR_CONFIG.api_key });

/**
 * Handles the POST request to create a Liveblocks session for a user.
 * This endpoint is responsible for generating a temporary guest user,
 * assigning them an avatar, and authorizing them to access a specified room.
 *
 * @param {NextRequest} req - The incoming HTTP request object
 * @returns {Promise<NextResponse>} The JSON response containing an authorization token
 */
export const POST = async (req: NextRequest): Promise<NextResponse> => {
  try {
    console.log("Incoming request:", req.method, req.headers.get("content-type"));

    // Validate content type
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json({ error: "Invalid content type, expected application/json" }, { status: 400 });
    }

    // Read raw request body before parsing JSON 
    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);

    // Ensure request body is not empty (This is to prevent unhandled "Unexpected end of JSON input" errors that would come without this)
    if (!rawBody.trim()) {
      return NextResponse.json({ error: "Empty JSON body" }, { status: 400 });
    }

    // Parse the request body to extract the 'room' parameter
    let room: string;
    try {
      ({ room } = JSON.parse(rawBody));
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    // Ensure that the room parameter is provided
    // It must be present for us to be able to authorize the user and assign him user info. 
    // Any future auth-related changes would most likely involve this file as well.
    if (!room) {
      return NextResponse.json({ error: "Missing room parameter" }, { status: 400 });
    }

    /**
     * Create a temporary guest user with:
     * - A randomly generated ID (6-character alphanumeric string)
     * - A default name ("Guest")
     * - A randomly selected avatar from a predefined set (0-9)
     */
    const user: LiveblocksUserMeta = {
      id: Math.random().toString(36).slice(-6),
      info: {
        name: "Guest",
        picture: `/liveblocks/avatars/${Math.floor(Math.random() * 10)}.png`,
      },
    };

    // Initialize a Liveblocks session for the generated user
    const session = liveblocks.prepareSession(user.id, { userInfo: user.info });

    /**
     * Assign full access permissions for the user in the specified room.
     * ⚠️ Note: Granting FULL_ACCESS comes with security risks, so ensure
     * that only authorized users can create sessions with this level of access.
     */
    session.allow(room, session.FULL_ACCESS);

    // Authorize the session with Liveblocks
    const { status, body } = await session.authorize();

    // Extract the authorization token from the response body
    let token: string;
    try {
      token = JSON.parse(body).token;
    } catch (parseError) {
      console.error("Error parsing Liveblocks response:", parseError);
      return NextResponse.json({ error: "Invalid response from Liveblocks" }, { status: 500 });
    }

    // Return the generated token along with the authorization status
    return NextResponse.json({ token, status });

  } catch (error: unknown) {
    console.error("Error authorizing Liveblocks session:", error);

    // Return a generic error response in case of failure
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};