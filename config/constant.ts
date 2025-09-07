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

// Delegation Contract Address for EIP-7702
export const DELEGATION_CONTRACT_ADDRESS =
  "0x00000000000000447e69651d841bD8D104Bed493";

// Backend API Configuration
export const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";
export const BACKEND_API_KEY = process.env.NEXT_PUBLIC_BACKEND_API_KEY || "";

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
  },
  // Production configuration
  PRODUCTION: {
    APP_ID: process.env.CASHFREE_APP_ID_PROD || "",
    SECRET_KEY: process.env.CASHFREE_SECRET_KEY_PROD || "",
    BASE_URL: "https://api.cashfree.com",
    CLIENT_ID: process.env.CASHFREE_CLIENT_ID_PROD || "",
    CLIENT_SECRET: process.env.CASHFREE_CLIENT_SECRET_PROD || "",
    TOKEN: process.env.CASHFREE_TOKEN_PROD || "",
  },
};

// Get current Cashfree configuration based on environment
export const getCashfreeConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return isProduction ? CASHFREE_CONFIG.PRODUCTION : CASHFREE_CONFIG.TEST;
};
