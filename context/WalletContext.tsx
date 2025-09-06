import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useWallets } from "@privy-io/react-auth";

interface WalletContextType {
  walletData: any;
  setWalletData: React.Dispatch<React.SetStateAction<any>>;
  selectedChain: number | null;
  setSelectedChain: React.Dispatch<React.SetStateAction<number | null>>;
  connectedChain: number | null;
  setConnectedChain: React.Dispatch<React.SetStateAction<number | null>>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [walletData, setWalletData] = useState<any>(null);
  const [selectedChain, setSelectedChain] = useState<number | null>(null);
  const [connectedChain, setConnectedChain] = useState<number | null>(null);
  const { wallets } = useWallets();

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

  return (
    <WalletContext.Provider
      value={{
        walletData,
        setWalletData,
        selectedChain,
        setSelectedChain,
        connectedChain,
        setConnectedChain
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
