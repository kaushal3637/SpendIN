export const DOMAIN_URL =
  (process.env.NODE_ENV == "development"
    ? process.env.NEXT_PUBLIC_DEVELOPMENT_URL
    : process.env.NEXT_PUBLIC_PRODUCTION_URL) || "https://localhost:3000";

// USDC Contract Addresses (only Arbitrum Sepolia and Arbitrum One)
export const USDC_CONTRACT_ADDRESSES = {
  // Arbitrum Sepolia Testnet
  421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  // Arbitrum Mainnet (Arbitrum One)
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Native USDC on Arbitrum
} as const;

export const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY!;

export const BACKEND_URL =
  (process.env.NODE_ENV == "development"
    ? process.env.NEXT_PUBLIC_DEVELOPMENT_BACKEND_URL
    : process.env.NEXT_PUBLIC_PRODUCTION_BACKEND_URL) ||
  // Safe default for local backend server
  "http://localhost:3001";

export const API_KEY =
  process.env.NODE_ENV == "development"
    ? process.env.NEXT_PUBLIC_DEVELOPMENT_API_KEY!
    : process.env.NEXT_PUBLIC_PRODUCTION_API_KEY!;

export const PRIVY_APP_ID = 
  process.env.NODE_ENV == "development" 
    ? process.env.NEXT_PUBLIC_DEVELOPMENT_PRIVY_APP_ID!
    : process.env.NEXT_PUBLIC_PRODUCTION_PRIVY_APP_ID!;

export const getTreasuryAddress = (chainId: number): string =>
{
  if (chainId === 421614) {
    return process.env.NEXT_PUBLIC_TESTNET_TREASURY_ADDRESS!;
  } else {
    return process.env.NEXT_PUBLIC_MAINNET_TREASURY_ADDRESS!;
  }
};

export const get7702AccountAddress = (chainId: number): string =>
{
  if (chainId === 421614) {
    return process.env.NEXT_PUBLIC_TESTNET_7702_ACCOUNT_ADDRESS!;
  } else {
    return process.env.NEXT_PUBLIC_MAINNET_7702_ACCOUNT_ADDRESS!;
  }
};

export const getUSDCAddress = (chainId: number): string =>
{
  return USDC_CONTRACT_ADDRESSES[chainId as keyof typeof USDC_CONTRACT_ADDRESSES];
};