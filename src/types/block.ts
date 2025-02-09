export interface Block {
  height: number;
  hash: string;
  timestamp: string;
  chainId: number;
  transactionCount: number;
  miner: string;
  size: number;
  gasUsed: string;
  gasLimit: string;
  networkUtilization?: number;
}

export interface BlocksResponse {
  items: Block[];
  chainId: number;
} 