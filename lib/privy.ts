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
  },
};
