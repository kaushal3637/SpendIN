export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  tokens: {
    usdc: {
      address: string;
      decimals: number;
      symbol: string;
    };
    weth?: {
      address: string;
      decimals: number;
      symbol: string;
    };
  };
  isTestnet: boolean;
}
