// USDC Contract Addresses
export const USDC_CONTRACT_ADDRESSES = {
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
} as const;

// Delegation Contract Address for EIP-7702
export const DELEGATION_CONTRACT_ADDRESS =
  "0x744e2450Be26E2CF390Acc8baA87Ab99DF4C3746";

// Chain-specific configuration
export const CHAIN_CONFIG: Record<
  number,
  { rpc: string }
> = {
  42161: {
    rpc: "https://ethereum-sepolia-rpc.publicnode.com",
  },
  421614: {
    rpc: "https://sepolia-rollup.arbitrum.io/rpc",
  },
};


export const getRpcUrlForChain = (chainId: number): string =>
  CHAIN_CONFIG[chainId]?.rpc;

export const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY!;

export const BACKEND_URL =
  process.env.NODE_ENV == "development"
    ? process.env.NEXT_PUBLIC_DEVELOPMENT_BACKEND_URL!
    : process.env.NEXT_PUBLIC_PRODUCTION_BACKEND_URL!;

export const API_KEY =
  process.env.NODE_ENV == "development"
    ? process.env.NEXT_PUBLIC_DEVELOPMENT_API_KEY!
    : process.env.NEXT_PUBLIC_PRODUCTION_API_KEY!;

export const PRIVY_APP_ID =
  process.env.NODE_ENV == "development"
    ? process.env.NEXT_PUBLIC_DEVELOPMENT_PRIVY_APP_ID!
    : process.env.NEXT_PUBLIC_PRODUCTION_PRIVY_APP_ID!;

export const TREASURY_ADDRESS =
  process.env.NODE_ENV == "development"
    ? process.env.NEXT_PUBLIC_TESTNET_TREASURY_ADDRESS!
    : process.env.NEXT_PUBLIC_MAINNET_TREASURY_ADDRESS!;