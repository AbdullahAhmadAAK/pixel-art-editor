import { defineChain } from 'viem';

export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockTime: number;
  isTestnet: boolean;
}

// Define chains using viem's defineChain for better type safety
export const b3Mainnet = defineChain({
  id: 8333,
  name: 'B3 Mainnet',
  network: 'b3',
  nativeCurrency: {
    name: 'B3',
    symbol: 'B3',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.b3.fun'] },
    public: { http: ['https://rpc.b3.fun'] },
  },
  blockExplorers: {
    default: {
      name: 'B3scan',
      url: 'https://explorer.b3.fun',
    },
  },
});

export const b3Testnet = defineChain({
  id: 1993,
  name: 'B3 Testnet',
  network: 'b3-testnet',
  nativeCurrency: {
    name: 'B3',
    symbol: 'B3',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.b3.fun'] },
    public: { http: ['https://testnet-rpc.b3.fun'] },
  },
  blockExplorers: {
    default: {
      name: 'B3scan Testnet',
      url: 'https://sepolia.explorer.b3.fun',
    },
  },
  testnet: true,
});

// Export chains array for our app's use
export const chains: ChainConfig[] = [
  {
    id: b3Mainnet.id,
    name: b3Mainnet.name,
    rpcUrl: b3Mainnet.rpcUrls.default.http[0],
    explorerUrl: b3Mainnet.blockExplorers.default.url,
    currency: {
      name: b3Mainnet.nativeCurrency.name,
      symbol: b3Mainnet.nativeCurrency.symbol,
      decimals: b3Mainnet.nativeCurrency.decimals,
    },
    blockTime: 14,
    isTestnet: false,
  },
  {
    id: b3Testnet.id,
    name: b3Testnet.name,
    rpcUrl: b3Testnet.rpcUrls.default.http[0],
    explorerUrl: b3Testnet.blockExplorers.default.url,
    currency: {
      name: b3Testnet.nativeCurrency.name,
      symbol: b3Testnet.nativeCurrency.symbol,
      decimals: b3Testnet.nativeCurrency.decimals,
    },
    blockTime: 14,
    isTestnet: true,
  },
];