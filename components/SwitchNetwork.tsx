import React, { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useWallets } from "@privy-io/react-auth";
import { chains, getChainById } from "@/lib/chains";

// Individual Chain Button Component
export function ChainButton({
  chain,
  isSelected,
  isConnected,
  onClick,
  disabled = false
}: {
  chain: typeof chains[0];
  isSelected: boolean;
  isConnected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation min-h-[80px] sm:min-h-[88px] flex flex-col justify-center ${isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : isConnected
            ? 'border-green-500 bg-green-50'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm active:scale-95'
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
        <div className={`text-sm sm:text-base font-semibold ${isSelected ? 'text-blue-700' : isConnected ? 'text-green-700' : 'text-gray-900'
          }`}>
          {chain.name}
        </div>
        <div className="text-xs sm:text-sm mt-1 text-blue-600">
          Testnet
        </div>
      </div>

      {/* Selection Checkmark */}
      {isSelected && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}

function SwitchNetwork() {
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const [chainSwitchError, setChainSwitchError] = useState("");
  const { selectedChain, setSelectedChain, connectedChain } = useWallet();

  // Set default chain if none selected
  useEffect(() => {
    if (!selectedChain && wallet?.chainId) {
      const chainId = parseInt(wallet.chainId.split(":")[1]);
      setSelectedChain(chainId);
    }
  }, [selectedChain, wallet, setSelectedChain]);

  const handleChainSwitch = async (chainId: number) => {
    try {
      setChainSwitchError("");
      await wallet.switchChain(chainId);
      setSelectedChain(chainId);
    } catch (error) {
      console.error("Failed to switch chain:", error);
      setChainSwitchError("Failed to switch chain. Please try again.");
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        {/* Chain Selection Header */}
        <div className="mb-4 sm:mb-6 text-center">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Switch Network</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Select a blockchain network to continue</p>

          {/* Current Network Status */}
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full text-xs sm:text-sm">
            {connectedChain ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Connected to {getChainById(connectedChain)?.name}</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-gray-500">No wallet connected</span>
              </>
            )}
          </div>
        </div>

        {/* Chain Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {chains.map((chain) => {
            const isSelected = selectedChain === chain.id;
            const isConnected = connectedChain === chain.id;

            return (
              <button
                key={chain.id}
                onClick={() => handleChainSwitch(chain.id)}
                disabled={!wallet}
                className={`relative p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation min-h-[80px] sm:min-h-[88px] flex flex-col justify-center ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                    : isConnected
                      ? 'border-green-500 bg-green-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm active:scale-95'
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
                  <div className={`text-sm sm:text-base font-semibold ${isSelected ? 'text-blue-700' : isConnected ? 'text-green-700' : 'text-gray-900'
                    }`}>
                    {chain.name}
                  </div>
                  <div className="text-xs sm:text-sm mt-1 text-blue-600">
                    Testnet
                  </div>
                </div>

                {/* Selection Checkmark */}
                {isSelected && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Error Message */}
        {chainSwitchError && (
          <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-700 text-sm sm:text-base">{chainSwitchError}</p>
          </div>
        )}

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            Need help? Make sure your wallet supports the selected network.
          </p>
        </div>

        {/* Spacer for full height utilization */}
        <div className="flex-grow min-h-[2rem] sm:min-h-[3rem] md:min-h-[4rem]"></div>
      </div>
    </div>
  );
}

export default SwitchNetwork;
