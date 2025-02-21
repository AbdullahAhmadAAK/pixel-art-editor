import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.LIVEBLOCKS_SECRET_KEY;
if (!API_KEY) throw new Error("LIVEBLOCKS_SECRET_KEY not set in environment variables");

const liveblocks = new Liveblocks({
  secret: API_KEY,
});

export const POST = async (req: NextRequest) => {
  try {
    const { room } = await req.json(); // Parse request body

    if (!room) {
      return NextResponse.json({ error: "Missing room parameter" }, { status: 400 });
    }

    const user = {
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
    console.log('this is the token i gotback: ', token)
    // **Ensure correct token response format**
    // return NextResponse.json({ token: body.token }, { status });
    return NextResponse.json({ token, status });
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
