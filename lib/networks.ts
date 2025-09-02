import { NetworkConfig } from "@/types/networkConfig.types";

// Network configurations
export const NETWORKS: Record<string, NetworkConfig> = {
  // Mainnet Networks
  ethereum: {
    chainId: 1,
    name: "Ethereum",
    rpcUrl: process.env.ETHEREUM_RPC_URL || "https://1rpc.io/eth",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    tokens: {
      usdc: {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        decimals: 6,
        symbol: "USDC",
      },
      weth: {
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        decimals: 18,
        symbol: "WETH",
      },
    },
    isTestnet: false,
  },

  arbitrum: {
    chainId: 42161,
    name: "Arbitrum One",
    rpcUrl: process.env.ARBITRUM_RPC_URL || "https://1rpc.io/arb",
    blockExplorer: "https://arbiscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    tokens: {
      usdc: {
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        decimals: 6,
        symbol: "USDC",
      },
      weth: {
        address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        decimals: 18,
        symbol: "WETH",
      },
    },
    isTestnet: false,
  },

  // Testnet Networks
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: process.env.SEPOLIA_RPC_URL || "https://1rpc.io/sepolia",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    tokens: {
      usdc: {
        address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
        decimals: 6,
        symbol: "USDC",
      },
    },
    isTestnet: true,
  },

  arbitrumSepolia: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl:
      process.env.ARBITRUM_SEPOLIA_RPC_URL ||
      "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorer: "https://sepolia.arbiscan.io",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    tokens: {
      usdc: {
        address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
        decimals: 6,
        symbol: "USDC",
      },
    },
    isTestnet: true,
  },
};

// Default network
export const DEFAULT_NETWORK = "sepolia";

// Helper functions
export function getNetworkConfig(networkName?: string): NetworkConfig {
  const network = networkName || process.env.DEFAULT_NETWORK || DEFAULT_NETWORK;

  if (!NETWORKS[network]) {
    throw new Error(
      `Network '${network}' not found. Available networks: ${Object.keys(
        NETWORKS
      ).join(", ")}`
    );
  }

  return NETWORKS[network];
}

export function getAllNetworks(): Record<string, NetworkConfig> {
  return NETWORKS;
}

export function getMainnetNetworks(): Record<string, NetworkConfig> {
  return Object.fromEntries(
    Object.entries(NETWORKS).filter(([, config]) => !config.isTestnet)
  );
}

export function getTestnetNetworks(): Record<string, NetworkConfig> {
  return Object.fromEntries(
    Object.entries(NETWORKS).filter(([, config]) => config.isTestnet)
  );
}

export function isValidNetwork(networkName: string): boolean {
  return networkName in NETWORKS;
}

// Export commonly used configurations
export const currentNetwork = getNetworkConfig();
export const mainnetNetworks = getMainnetNetworks();
export const testnetNetworks = getTestnetNetworks();
