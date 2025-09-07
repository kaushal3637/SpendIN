import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // Only secrets that must be server-side
    CANDIDE_API_KEY: process.env.CANDIDE_API_KEY,
    // Client-side environment variables
    NEXT_PUBLIC_DELEGATION_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_DELEGATION_CONTRACT_ADDRESS,
    NEXT_PUBLIC_TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
  },
};

export default nextConfig;
