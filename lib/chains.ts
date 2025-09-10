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
];

export const chainImages = {
  11155111: "/sepolia-logo.png",
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
    case 1: // Ethereum Mainnet
      return `https://etherscan.io/tx/${txHash}`;
    case 11155111: // Sepolia Testnet
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    case 42161: // Arbitrum One
      return `https://arbiscan.io/tx/${txHash}`;
    case 421614: // Arbitrum Sepolia
      return `https://sepolia.arbiscan.io/tx/${txHash}`;
    default:
      return "#";
  }
};
