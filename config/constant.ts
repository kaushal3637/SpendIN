export const DOMAIN_URL =
  process.env.NODE_ENV == "development"
    ? process.env.NEXT_PUBLIC_DEVELOPMENT_URL
    : process.env.NEXT_PUBLIC_PRODUCTION_URL;

export const MONGODB_URI =
  process.env.NODE_ENV == "development"
    ? process.env.DEVELOPMENT_MONGODB_URI
    : process.env.PRODUCTION_MONGODB_URI;

// USDC Contract Addresses
export const USDC_CONTRACT_ADDRESSES = {
  // Ethereum Sepolia Testnet
  11155111: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
  // Arbitrum Sepolia Testnet
  421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
} as const;

// Treasury Address
export const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "";

// Delegation Contract Address for EIP-7702 (Custom Contract - Fixes Silent Failures)
export const DELEGATION_CONTRACT_ADDRESS = "0x744e2450Be26E2CF390Acc8baA87Ab99DF4C3746";

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
export const DEFAULT_JSON_RPC_NODE_PROVIDER = "https://ethereum-sepolia-rpc.publicnode.com";

// Chain-specific configuration
export const CHAIN_CONFIG: Record<number, { bundler: string; paymaster: string; rpc: string }> = {
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

// Cashfree Payout API Configuration
export const CASHFREE_CONFIG = {
  // Test mode configuration
  TEST: {
    APP_ID: process.env.CASHFREE_APP_ID || "TEST_APP_ID",
    SECRET_KEY: process.env.CASHFREE_SECRET_KEY || "TEST_SECRET_KEY",
    BASE_URL: "https://sandbox.cashfree.com",
    CLIENT_ID: process.env.CASHFREE_CLIENT_ID || "TEST_CLIENT_ID",
    CLIENT_SECRET: process.env.CASHFREE_CLIENT_SECRET || "TEST_CLIENT_SECRET",
    TOKEN: process.env.CASHFREE_TOKEN || "",
    FUNDSOURCE_ID: process.env.CASHFREE_FUNDSOURCE_ID || "CASHFREE_DEFAULT",
  },
  // Production configuration
  PRODUCTION: {
    APP_ID: process.env.CASHFREE_APP_ID_PROD || "",
    SECRET_KEY: process.env.CASHFREE_SECRET_KEY_PROD || "",
    BASE_URL: "https://api.cashfree.com",
    CLIENT_ID: process.env.CASHFREE_CLIENT_ID_PROD || "",
    CLIENT_SECRET: process.env.CASHFREE_CLIENT_SECRET_PROD || "",
    TOKEN: process.env.CASHFREE_TOKEN_PROD || "",
    FUNDSOURCE_ID: process.env.CASHFREE_FUNDSOURCE_ID_PROD || "",
  },
};

// Get current Cashfree configuration based on environment
export const getCashfreeConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return isProduction ? CASHFREE_CONFIG.PRODUCTION : CASHFREE_CONFIG.TEST;
};
