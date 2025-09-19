// Valid chain IDs for StableUPI transactions
export const VALID_CHAIN_IDS = [421614, 42161] as const;

// Type for valid chain IDs
export type ValidChainId = (typeof VALID_CHAIN_IDS)[number];

// Chain information interface
export interface ChainInfo {
  id: ValidChainId;
  name: string;
  symbol: string;
  isTestnet: boolean;
}

// Chain information mapping
export const CHAIN_INFO: Record<ValidChainId, ChainInfo> = {
  421614: {
    id: 421614,
    name: "Arbitrum Sepolia",
    symbol: "ETH",
    isTestnet: true,
  },
  42161: {
    id: 42161,
    name: "Arbitrum One",
    symbol: "ETH",
    isTestnet: false,
  },
};

/**
 * Validates if a chain ID is supported by StableUPI
 */
export function isValidChainId(chainId: number): chainId is ValidChainId {
  return VALID_CHAIN_IDS.includes(chainId as ValidChainId);
}

/**
 * Gets chain information for a valid chain ID
 */
export function getChainInfo(chainId: number): ChainInfo | null {
  if (isValidChainId(chainId)) {
    return CHAIN_INFO[chainId];
  }
  return null;
}

/**
 * Gets all supported chains information
 */
export function getSupportedChains(): ChainInfo[] {
  return VALID_CHAIN_IDS.map((id) => CHAIN_INFO[id]);
}
