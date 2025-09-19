import { Chain } from "viem";

export const chains: Chain[] = [
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
  {
    id: 42161,
    name: "Arbitrum One",
    nativeCurrency: {
      decimals: 18,
      name: "Ethereum",
      symbol: "ETH",
    },
    rpcUrls: {
      default: {
        http: ["	https://arb1.arbitrum.io/rpc"],
      },
      public: {
        http: ["https://arb1.arbitrum.io/rpc"],
      },
    },
    blockExplorers: {
      default: { name: "Arbiscan", url: "https://arbiscan.io" },
    },
  },
];

export const chainImages = {
  42161: "/arbitrum-logo.png",
  421614: "/arbitrum-sepolia-logo.png",
};

export const getChainById = (chainId: number) => {
  return chains.find((chain) => chain.id === chainId);
};

export const getChainImage = (chainId: number) => {
  return (
    chainImages[chainId as keyof typeof chainImages] || "/default-chain.png"
  );
};

// Helper function to get blockchain explorer URL
export const getExplorerUrl = (
  chainId: number | null | undefined,
  txHash: string
): string => {
  if (!chainId) return "#";

  switch (chainId) {
    case 42161: // Arbitrum One
      return `https://arbiscan.io/tx/${txHash}`;
    case 421614: // Arbitrum Sepolia
      return `https://sepolia.arbiscan.io/tx/${txHash}`;
    default:
      return "#";
  }
};
