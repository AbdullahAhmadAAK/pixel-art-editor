import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";
import { PIXEL_ART_EDITOR_CONFIG } from "@/config/pixel-art-editor";
import { LiveblocksUserMeta } from "@/lib/types/pixel-art-editor/liveblocks-user-meta";

const liveblocks = new Liveblocks({
  secret: PIXEL_ART_EDITOR_CONFIG.api_key,
});

export const POST = async (req: NextRequest) => {
  try {
    const { room } = await req.json();

    if (!room) {
      return NextResponse.json({ error: "Missing room parameter" }, { status: 400 });
    }

    const user: LiveblocksUserMeta = {
      id: Math.random().toString(36).slice(-6),
      info: {
        name: "Guest",
        picture: `/liveblocks/avatars/${Math.floor(Math.random() * 10)}.png`,
      },
    };

    const session = liveblocks.prepareSession(user.id, { userInfo: user.info });
    session.allow(room, session.FULL_ACCESS);

    const { status, body } = await session.authorize();

    const token = JSON.parse(body).token
    return NextResponse.json({ token, status });
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
