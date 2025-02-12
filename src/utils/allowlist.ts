import Redis from "ioredis";
import { NFT_CONFIG } from "@/config/nft";

const redis = new Redis(process.env.REDIS_URL!);

export async function addToAllowlist(addresses: string[]): Promise<number> {
  if (NFT_CONFIG.allowlist.type !== "redis") {
    throw new Error("Allowlist is not configured to use Redis");
  }

  const normalizedAddresses = addresses.map((addr) => addr.toLowerCase());
  return await redis.sadd(
    NFT_CONFIG.allowlist.redisKey,
    ...normalizedAddresses
  );
}

export async function removeFromAllowlist(
  addresses: string[]
): Promise<number> {
  if (NFT_CONFIG.allowlist.type !== "redis") {
    throw new Error("Allowlist is not configured to use Redis");
  }

  const normalizedAddresses = addresses.map((addr) => addr.toLowerCase());
  return await redis.srem(
    NFT_CONFIG.allowlist.redisKey,
    ...normalizedAddresses
  );
}

export async function getAllowlistCount(): Promise<number> {
  if (NFT_CONFIG.allowlist.type !== "redis") {
    throw new Error("Allowlist is not configured to use Redis");
  }

  return await redis.scard(NFT_CONFIG.allowlist.redisKey);
}

export async function isInAllowlist(address: string): Promise<boolean> {
  if (NFT_CONFIG.allowlist.type !== "redis") {
    throw new Error("Allowlist is not configured to use Redis");
  }

  const result = await redis.sismember(
    NFT_CONFIG.allowlist.redisKey,
    address.toLowerCase()
  );
  return result === 1;
}
