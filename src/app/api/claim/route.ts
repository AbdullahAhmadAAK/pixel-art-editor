import { NextResponse } from "next/server";
import { NFT_CONFIG, ALLOWLIST } from "@/config/nft";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);
const SIMPLEHASH_API_KEY = process.env.SIMPLEHASH_API_KEY;

export async function POST(req: Request) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();

    if (!ALLOWLIST.includes(normalizedAddress)) {
      return NextResponse.json(
        { error: "Address is not in the allowlist" },
        { status: 403 }
      );
    }

    // Check if already claimed
    const claimed = await redis.get(`claimed:${normalizedAddress}`);
    if (claimed) {
      return NextResponse.json(
        { error: "NFT already claimed for this address" },
        { status: 400 }
      );
    }

    // Mint NFT via Engine API
    const mintResponse = await fetch(
      `${process.env.TW_ENGINE_URL}/contract/8333/${NFT_CONFIG.contract}/erc721/mint-to`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.TW_ENGINE_ACCESS_TOKEN}`,
          "X-Backend-Wallet-Address": process.env.TW_ENGINE_WALLET!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver: address,
          metadata: {
            name: NFT_CONFIG.name,
            description: NFT_CONFIG.description,
            external_url: NFT_CONFIG.external_url,
            image: NFT_CONFIG.image,
            animation_url: NFT_CONFIG.animation_url,
          },
        }),
      }
    );

    if (!mintResponse.ok) {
      const error = await mintResponse.text();
      return NextResponse.json(
        { error: `Minting failed: ${error}` },
        { status: mintResponse.status }
      );
    }

    const mintData = await mintResponse.json();

    // Record claim in Redis
    await redis.set(`claimed:${normalizedAddress}`, JSON.stringify(mintData));

    return NextResponse.json(mintData);
  } catch (error) {
    console.error("Claim error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "Wallet address is required" },
      { status: 400 }
    );
  }

  const normalizedAddress = address.toLowerCase();

  // First check if they're in allowlist
  if (!ALLOWLIST.includes(normalizedAddress)) {
    return NextResponse.json({ canClaim: false, status: "not_eligible" });
  }

  // Check if they've already claimed in Redis
  const claimed = await redis.get(`claimed:${normalizedAddress}`);
  if (claimed) {
    // Verify ownership via SimpleHash
    try {
      const response = await fetch(
        `https://api.simplehash.com/api/v0/nfts/owners_v2?chains=b3&wallet_addresses=${address}&contract_ids=b3.${NFT_CONFIG.contract}`,
        {
          headers: {
            "X-API-KEY": SIMPLEHASH_API_KEY!,
          },
        }
      );

      const data = await response.json();
      const hasNFT = data.nfts?.length > 0;

      if (hasNFT) {
        const nft = data.nfts[0];
        return NextResponse.json({
          canClaim: false,
          status: "claimed",
          tokenId: nft.token_id,
          txHash: JSON.parse(claimed).transactionHash,
        });
      }
    } catch (error) {
      console.error("SimpleHash API error:", error);
    }
  }

  return NextResponse.json({
    canClaim: !claimed,
    status: claimed ? "claimed" : "eligible",
  });
}
