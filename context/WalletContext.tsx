import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useWallets } from "@privy-io/react-auth";
import { checkAndAllowlistWallet } from "@/api-helpers/allowlist";

interface WalletContextType {
  walletData: Record<string, unknown> | null;
  setWalletData: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>;
  selectedChain: number | null;
  setSelectedChain: React.Dispatch<React.SetStateAction<number | null>>;
  connectedChain: number | null;
  setConnectedChain: React.Dispatch<React.SetStateAction<number | null>>;
  isWalletAllowed: boolean | null;
  isAllowlistChecking: boolean;
  allowlistError: string | null;
  lastCheckedAddress: string | null;
  ensureAllowlist: (walletAddress: string | undefined | null) => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [walletData, setWalletData] = useState<Record<string, unknown> | null>(null);
  const [selectedChain, setSelectedChain] = useState<number | null>(null);
  const [connectedChain, setConnectedChain] = useState<number | null>(null);
  const { wallets } = useWallets();
  const [isWalletAllowed, setIsWalletAllowed] = useState<boolean | null>(null);
  const [isAllowlistChecking, setIsAllowlistChecking] = useState<boolean>(false);
  const [allowlistError, setAllowlistError] = useState<string | null>(null);
  const [lastCheckedAddress, setLastCheckedAddress] = useState<string | null>(null);

  // Set the initial selected chain when the wallet changes
  useEffect(() => {
    const wallet = wallets[0];
    if (wallet?.chainId) {
      const chainId = parseInt(wallet.chainId.split(":")[1]);
      setSelectedChain(chainId);
      setConnectedChain(chainId);
    }
  }, [wallets]);

  // Update connected chain when wallet chain changes
  useEffect(() => {
    const wallet = wallets[0];
    if (wallet?.chainId) {
      const chainId = parseInt(wallet.chainId.split(":")[1]);
      setConnectedChain(chainId);
    }
  }, [wallets]);

  const ensureAllowlist = async (walletAddress: string | undefined | null): Promise<boolean> => {
    if (!walletAddress) return false;
    if (lastCheckedAddress === walletAddress && isWalletAllowed !== null) {
      return !!isWalletAllowed;
    }
    try {
      setIsAllowlistChecking(true);
      setAllowlistError(null);
      const result = await checkAndAllowlistWallet(walletAddress);
      setIsWalletAllowed(result.allowed);
      setLastCheckedAddress(walletAddress);
      return result.allowed;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Allowlist check failed";
      setAllowlistError(message);
      setIsWalletAllowed(false);
      setLastCheckedAddress(walletAddress);
      return false;
    } finally {
      setIsAllowlistChecking(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletData,
        setWalletData,
        selectedChain,
        setSelectedChain,
        connectedChain,
        setConnectedChain,
        isWalletAllowed,
        isAllowlistChecking,
        allowlistError,
        lastCheckedAddress,
        ensureAllowlist
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
