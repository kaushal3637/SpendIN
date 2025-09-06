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
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  // Arbitrum Sepolia Testnet
  421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
} as const;

// Treasury Address
export const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "";

// Backend API Configuration
export const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";
export const BACKEND_API_KEY = process.env.NEXT_PUBLIC_BACKEND_API_KEY || "";
