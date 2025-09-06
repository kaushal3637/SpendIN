import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useWallets } from "@privy-io/react-auth";
import { chains, getChainById } from "@/lib/chains";

interface ChainButtonsProps {
  className?: string;
  showHeader?: boolean;
  compact?: boolean;
}

// Individual Chain Button Component
function ChainButtonComponent({
  chain,
  isSelected,
  isConnected,
  onClick,
  disabled = false,
  compact = false
}: {
  chain: typeof chains[0];
  isSelected: boolean;
  isConnected: boolean;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative ${compact ? 'p-3' : 'p-4'} rounded-lg border-2 transition-all duration-200 ${isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : isConnected
            ? 'border-green-500 bg-green-50'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {/* Status Indicators */}
      <div className="absolute top-2 right-2 flex gap-1">
        {isConnected && (
          <div className="w-2 h-2 bg-green-500 rounded-full" title="Connected"></div>
        )}
        {isSelected && (
          <div className="w-2 h-2 bg-blue-500 rounded-full" title="Selected"></div>
        )}
      </div>

      {/* Chain Info */}
      <div className="text-center">
        <div className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : isConnected ? 'text-green-700' : 'text-gray-900'
          }`}>
          {chain.name}
        </div>
        <div className="text-xs mt-1 text-blue-600">
          Testnet
        </div>
      </div>

      {/* Selection Checkmark */}
      {isSelected && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}

// Main Chain Buttons Component
export default function ChainButtons({
  className = "",
  showHeader = true,
  compact = false
}: ChainButtonsProps) {
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const { selectedChain, setSelectedChain, connectedChain } = useWallet();
  const [chainSwitchError, setChainSwitchError] = useState("");

  const handleChainSwitch = async (chainId: number) => {
    if (!wallet) {
      setChainSwitchError("No wallet available for chain switching");
      return;
    }

    try {
      setChainSwitchError("");

      // Detect if we're on a mobile device
      const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        try {
          // Mobile wallets often require user interaction and may take longer
          // Convert chain ID to hex format as expected by wallets
          const chainIdHex = `0x${chainId.toString(16)}` as `0x${string}`
          const switchPromise = wallet.switchChain(chainIdHex);
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Chain switch timeout - please check your wallet app')), 30000);
          });

          await Promise.race([switchPromise, timeoutPromise]);
          setSelectedChain(chainId);
        } catch (mobileError: unknown) {
          const error = mobileError as Error & { code?: number };

          if (error?.message?.includes('User rejected') || error?.code === 4001) {
            setChainSwitchError("Chain switch cancelled by user.");
          } else if (error?.message?.includes('timeout')) {
            setChainSwitchError("Chain switch timed out. Please check your wallet app and try again.");
          } else if (error?.message?.includes('Unsupported') || error?.message?.includes('not supported')) {
            setChainSwitchError(`This network may not be supported by your mobile wallet. Please try a different network.`);
          } else {
            setChainSwitchError("Failed to switch network on mobile. Please try again.");
          }
          return;
        }
      } else {
        // Desktop switching
        // Convert chain ID to hex format as expected by wallets
        const chainIdHex = `0x${chainId.toString(16)}` as `0x${string}`
        await wallet.switchChain(chainIdHex);
        setSelectedChain(chainId);
      }
    } catch (error: unknown) {
      console.error("Failed to switch chain:", error);
      const err = error as Error & { code?: number };

      if (err?.message?.includes('User rejected') || err?.code === 4001) {
        setChainSwitchError("Chain switch cancelled by user.");
      } else {
        setChainSwitchError("Failed to switch chain. Please try again.");
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Chain Selection Header */}
      {showHeader && (
        <div className="mb-3">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Switch Network</h3>

          {/* Current Network Status */}
          <div className="text-xs text-gray-600 mb-3">
            {connectedChain ? (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Connected to {getChainById(connectedChain)?.name}
              </span>
            ) : (
              <span className="text-gray-500">No wallet connected</span>
            )}
          </div>
        </div>
      )}

      {/* Chain Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {chains.map((chain) => {
          const isSelected = selectedChain === chain.id;
          const isConnected = connectedChain === chain.id;

          return (
            <ChainButtonComponent
              key={chain.id}
              chain={chain}
              isSelected={isSelected}
              isConnected={isConnected}
              onClick={() => handleChainSwitch(chain.id)}
              disabled={!wallet}
              compact={compact}
            />
          );
        })}
      </div>

      {/* Error Message */}
      {chainSwitchError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{chainSwitchError}</p>
        </div>
      )}
    </div>
  );
}

// Export individual components for flexibility
export { ChainButtonComponent as ChainButton };
