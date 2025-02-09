import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import Redis from "ioredis";
import { headers } from "next/headers";
import { verifyMessage } from "viem";

const airdropUri = process.env.MONGO_AIRDROP_DB!;
const sybilUri = process.env.MONGO_SYBIL_DB!;
const turnstileSecretKey =
  process.env.NEXT_PUBLIC_ENV === "local"
    ? "1x0000000000000000000000000000000AA"
    : process.env.CF_TURNSTILE_SECRET_KEY!;

// Rate limit configuration
const RATE_LIMIT = 2; // requests
const WINDOW_SIZE = 60; // seconds

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL!);

// Create separate clients for each database
const airdropClient = new MongoClient(airdropUri);
const sybilClient = new MongoClient(sybilUri);

async function verifyTurnstileToken(token: string) {
  const formData = new URLSearchParams();
  formData.append("secret", turnstileSecretKey);
  formData.append("response", token);

  const result = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    }
  );

  const outcome = await result.json();
  return outcome.success;
}

async function checkRateLimit(ip: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / WINDOW_SIZE);
  const key = `ratelimit:${ip}:${window}`;

  // Use multi to make this atomic
  const multi = redis.multi();
  multi.incr(key);
  multi.expire(key, WINDOW_SIZE);

  const results = await multi.exec();
  const currentCount = (results?.[0]?.[1] as number) || 0;

  const reset = (window + 1) * WINDOW_SIZE;
  const remaining = Math.max(0, RATE_LIMIT - currentCount);

  return {
    success: currentCount <= RATE_LIMIT,
    limit: RATE_LIMIT,
    remaining,
    reset,
  };
}

async function verifySignature(
  message: string,
  signature: string,
  address: string
): Promise<boolean> {
  try {
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    return isValid;
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const address = searchParams.get("address");
    const token = searchParams.get("token");
    const signature = searchParams.get("signature");
    const message = searchParams.get("message");

    // Update IP detection for Vercel
    const headersList = await headers();
    const ip =
      headersList.get("x-real-ip") ??
      headersList.get("x-forwarded-for")?.split(",")[0] ??
      "anonymous";

    // Check rate limit
    const { success, limit, remaining, reset } = await checkRateLimit(ip);

    if (!success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": (reset - Math.floor(Date.now() / 1000)).toString(),
          },
        }
      );
    }

    if (!query || !token || !signature || !message) {
      console.log("Missing required parameters");
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify the signature
    const expectedMessage = `Check B3 Airdrop for ${address}`;
    if (message !== expectedMessage) {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }
    const isValidSignature = await verifySignature(
      message,
      signature,
      address as `0x${string}`
    );

    if (!isValidSignature) {
      console.log("Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // Verify the turnstile token
    const isValid = await verifyTurnstileToken(token);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid turnstile token" },
        { status: 403 }
      );
    }

    // Connect to both databases
    await Promise.all([airdropClient.connect(), sybilClient.connect()]);

    const privyId = query;
    // Get references to both databases and collections
    const airdropDb = airdropClient.db("b3-feathers");
    const sybilDb = sybilClient.db("b3");
    const sybilsCollection = sybilDb.collection("sybils");

    // Bump
    // Get user points
    const userPoints = await airdropDb.collection("user-points").findOne(
      {
        $or: [
          { privyId },
          { walletAddress: address?.toLowerCase() },
          { "associatedWallets.walletAddress": address?.toLowerCase() },
          { "linkedAccounts.walletAddress": address?.toLowerCase() },
        ],
      },
      {
        projection: {
          xp: 1,
          bp: 1,
          username: 1,
          linkedAccounts: 1,
          associatedAccounts: 1,
        },
      }
    );

    // If no user points found, return a specific response
    if (!userPoints) {
      return NextResponse.json({
        exists: false,
        eligible: false,
        xp: 0,
        bp: 0,
        linkedAccountsCount: 0,
        associatedAccountsCount: 0,
      });
    }

    // Check if the username exists in sybils collection
    const sybilMatch = await sybilsCollection.findOne({
      username: userPoints.username,
    });

    // Return only the necessary data
    const simplifiedProfile = {
      exists: true,
      username: userPoints.username,
      address: userPoints.address,
      linkedAccountsCount: userPoints.linkedAccounts?.length || 0,
      associatedAccountsCount: userPoints.associatedAccounts?.length || 0,
      eligible: !sybilMatch,
      xp: userPoints.xp || 0,
      bp: userPoints.bp || 0,
    };

    return NextResponse.json(simplifiedProfile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // Close both database connections
    await Promise.all([airdropClient.close(), sybilClient.close()]);
  }
}
