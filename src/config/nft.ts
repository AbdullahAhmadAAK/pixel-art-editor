export const NFT_CONFIG = {
  name: "Quest Seekers",
  description:
    "This premium NFT is reserved exclusively for the participants of Quests and early testnet users of B3. This NFT cannot be traded or bought, it is only awarded.",
  external_url: "https://b3.fun",
  image: "ipfs://QmXgcMxeWB7yz4uB6sTCGnrdNszUbjbTE2XcskUqwhZLrA",
  contract: "0xEa85a1357534b329B0e933812b71c27E7B6e5e66",
  animation_url: null,
  publicImage:
    "https://f393c7eb287696dc4db76d980cc68328.ipfscdn.io/ipfs/bafybeiek2yspjqeo6zrl7x2uaerc24dyza4qpvawmzndb4arxzp47ttwr4",
  allowlist: {
    type: "redis",
    redisKey: "quest-seekers-allowlist",
    maxPerWallet: 1,
  },
};

// Keep in-memory allowlist as fallback
export const ALLOWLIST = [
  "0x1216de6853e2c2cAEd6F5B0C2791D2E4a765D954",
  // ... rest of the addresses ...
].map((address) => address.toLowerCase());
