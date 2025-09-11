export const DOMAIN_URL =
  process.env.NODE_ENV == "development"
    ? process.env.NEXT_PUBLIC_DEVELOPMENT_URL
    : process.env.NEXT_PUBLIC_PRODUCTION_URL;

// USDC Contract Addresses
export const USDC_CONTRACT_ADDRESSES = {
  // Ethereum Sepolia Testnet
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  // Arbitrum Sepolia Testnet
  421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
} as const;

// Delegation Contract Address for EIP-7702 (Custom Contract - Fixes Silent Failures)
export const DELEGATION_CONTRACT_ADDRESS =
  "0x744e2450Be26E2CF390Acc8baA87Ab99DF4C3746";

// Candide service endpoints (static, keyed by network)
export const CANDIDE_BUNDLER_URLS = {
  sepolia: "https://api.candide.dev/bundler/v3/sepolia",
  arbitrumSepolia: "https://api.candide.dev/bundler/v3/arbitrum-sepolia",
} as const;

export const CANDIDE_PAYMASTER_URLS = {
  sepolia: "https://api.candide.dev/paymaster/v3/sepolia",
  arbitrumSepolia: "https://api.candide.dev/paymaster/v3/arbitrum-sepolia",
} as const;

// Default selections
export const DEFAULT_NETWORK = "sepolia" as const; // change if needed
export const DEFAULT_BUNDLER_URL = CANDIDE_BUNDLER_URLS[DEFAULT_NETWORK];
export const DEFAULT_PAYMASTER_URL = CANDIDE_PAYMASTER_URLS[DEFAULT_NETWORK];

// Public RPCs (non-secret)
export const DEFAULT_JSON_RPC_NODE_PROVIDER =
  "https://ethereum-sepolia-rpc.publicnode.com";

// Chain-specific configuration
export const CHAIN_CONFIG: Record<
  number,
  { bundler: string; paymaster: string; rpc: string }
> = {
  11155111: {
    bundler: CANDIDE_BUNDLER_URLS.sepolia,
    paymaster: CANDIDE_PAYMASTER_URLS.sepolia,
    rpc: "https://ethereum-sepolia-rpc.publicnode.com",
  },
  421614: {
    bundler: CANDIDE_BUNDLER_URLS.arbitrumSepolia,
    paymaster: CANDIDE_PAYMASTER_URLS.arbitrumSepolia,
    rpc: "https://sepolia-rollup.arbitrum.io/rpc",
  },
};

export const getBundlerUrlForChain = (chainId: number): string =>
  CHAIN_CONFIG[chainId]?.bundler || DEFAULT_BUNDLER_URL;

export const getPaymasterUrlForChain = (chainId: number): string =>
  CHAIN_CONFIG[chainId]?.paymaster || DEFAULT_PAYMASTER_URL;

export const getRpcUrlForChain = (chainId: number): string =>
  CHAIN_CONFIG[chainId]?.rpc || DEFAULT_JSON_RPC_NODE_PROVIDER;

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
    ? process.env.NEXT_PUBLIC_DEVELOPMENT_TREASURY_ADDRESS!
    : process.env.NEXT_PUBLIC_PRODUCTION_TREASURY_ADDRESS!;