import { Chain } from "viem";

export const chains: Chain[] = [
  {
    id: 1,
    name: "Ethereum",
    nativeCurrency: {
      decimals: 18,
      name: "Ether",
      symbol: "ETH",
    },
    rpcUrls: {
      default: {
        http: ["https://1rpc.io/eth"],
      },
      public: {
        http: ["https://1rpc.io/eth"],
      },
    },
    blockExplorers: {
      default: { name: "Etherscan", url: "https://etherscan.io" },
    },
  },
  {
    id: 42161,
    name: "Arbitrum One",
    nativeCurrency: {
      decimals: 18,
      name: "Ether",
      symbol: "ETH",
    },
    rpcUrls: {
      default: {
        http: ["https://1rpc.io/arb"],
      },
      public: {
        http: ["https://1rpc.io/arb"],
      },
    },
    blockExplorers: {
      default: { name: "Arbiscan", url: "https://arbiscan.io" },
    },
  },
  {
    id: 11155111,
    name: "Sepolia",
    nativeCurrency: {
      decimals: 18,
      name: "Sepolia Ether",
      symbol: "ETH",
    },
    rpcUrls: {
      default: {
        http: ["https://1rpc.io/sepolia"],
      },
      public: {
        http: ["https://1rpc.io/sepolia"],
      },
    },
    blockExplorers: {
      default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
    },
  },
  {
    id: 421614,
    name: "Arbitrum Sepolia",
    nativeCurrency: {
      decimals: 18,
      name: "Sepolia Ether",
      symbol: "ETH",
    },
    rpcUrls: {
      default: {
        http: ["https://sepolia-rollup.arbitrum.io/rpc"],
      },
      public: {
        http: ["https://sepolia-rollup.arbitrum.io/rpc"],
      },
    },
    blockExplorers: {
      default: { name: "Arbiscan", url: "https://sepolia.arbiscan.io" },
    },
  },
];

export const chainImages = {
  1: "/ethereum-logo.png", // You'll need to add these images
  42161: "/arbitrum-logo.png",
  11155111: "/sepolia-logo.png",
  421614: "/arbitrum-sepolia-logo.png",
};

export const getChainById = (chainId: number) => {
  return chains.find(chain => chain.id === chainId);
};

export const getChainImage = (chainId: number) => {
  return chainImages[chainId as keyof typeof chainImages] || "/default-chain.png";
};
