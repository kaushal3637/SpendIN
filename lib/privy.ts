import { PrivyClientConfig } from "@privy-io/react-auth";

// Privy configuration
export const privyConfig: PrivyClientConfig = {
  loginMethods: ["wallet"],
  appearance: {
    theme: "light",
    accentColor: "#059669", // Emerald-600
    logo: "/logo.png",
  },
  embeddedWallets: {
    createOnLogin: "users-without-wallets",
  },
  // Configure the chains you want to support
  supportedChains: [
    {
      id: 421614, // Arbitrum Sepolia Testnet
      name: "Arbitrum Sepolia",
      nativeCurrency: {
        name: "Sepolia Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [
            process.env.ARBITRUM_SEPOLIA_RPC_URL ||
              "https://sepolia-rollup.arbitrum.io/rpc",
          ],
        },
      },
      blockExplorers: {
        default: {
          name: "Arbiscan",
          url: "https://sepolia.arbiscan.io",
        },
      },
    },
    {
      id: 11155111, // Sepolia Testnet
      name: "Sepolia",
      nativeCurrency: {
        name: "Sepolia Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [process.env.SEPOLIA_RPC_URL || "https://1rpc.io/sepolia"],
        },
      },
      blockExplorers: {
        default: {
          name: "Etherscan",
          url: "https://sepolia.etherscan.io",
        },
      },
    },
  ],
  defaultChain: {
    id: 421614, // Arbitrum Sepolia Testnet
    name: "Arbitrum Sepolia",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [
          process.env.ARBITRUM_SEPOLIA_RPC_URL ||
            "https://sepolia-rollup.arbitrum.io/rpc",
        ],
      },
    },
    blockExplorers: {
      default: {
        name: "Arbiscan",
        url: "https://sepolia.arbiscan.io",
      },
    },
  },
};

export const PRIVY_APP_ID =
  process.env.NEXT_PUBLIC_PRIVY_APP_ID || "your-privy-app-id";
