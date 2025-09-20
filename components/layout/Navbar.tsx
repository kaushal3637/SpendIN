"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Wallet, LogOut, Copy } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useWallet } from "@/context/WalletContext";
import { chains, getChainById } from "@/lib/chains";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);

  // Privy hooks
  const { ready, authenticated, user, login, logout } = usePrivy();

  // Wallet context
  const { wallets: privyWallets } = useWallets();
  const { selectedChain, setSelectedChain, connectedChain } = useWallet();
  const wallet = privyWallets[0];
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!user?.wallet?.address) return;
    navigator.clipboard.writeText(user.wallet.address);
    setCopied(true);

    // Reset copied after 2 seconds
    setTimeout(() => setCopied(false), 1000);
  };

  // Close wallet dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        walletDropdownOpen &&
        !target.closest("[data-wallet-dropdown]") &&
        !target.closest(".mobile-wallet-dropdown")
      ) {
        setWalletDropdownOpen(false);
        setShowNetworkSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [walletDropdownOpen]);

  // Set default chain if none selected (Arbitrum Sepolia)
  useEffect(() => {
    if (!selectedChain) {
      // Default to Arbitrum Sepolia (421614)
      setSelectedChain(421614);
    }
  }, [selectedChain, setSelectedChain]);

  const handleChainSwitch = async (chainId: number) => {
    try {
      if (wallet) {
        await wallet.switchChain(chainId);
        setSelectedChain(chainId);
        setShowNetworkSelector(false);
      }
    } catch (error) {
      console.error("Failed to switch chain:", error);
    }
  };

  return (
    <nav className="fixed top-3 z-50 backdrop-blur-sm border-b border-emerald-100 shadow-sm w-[90%] mx-auto rounded-xl">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center w-[80px] md:w-[180px] h-max">
              <Image
                src="/logo.svg"
                alt="SpendIN Logo"
                width={120}
                height={40}
                className="w-full h-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Wallet Connection */}
          <div className="block">
            {ready ? (
              authenticated ? (
                <div className="relative" data-wallet-dropdown>
                  <button
                    onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg text-xs sm:text-base"
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {user?.wallet?.address
                        ? `${user.wallet.address.slice(
                            0,
                            6
                          )}...${user.wallet.address.slice(-4)}`
                        : "Connected"}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Wallet Dropdown */}
                  {walletDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-emerald-100 py-1 z-50">
                      <div className="px-4 py-4 border-b border-emerald-100 flex gap-2">
                        <p className="text-xs text-slate-500 font-mono">
                          {user?.wallet?.address?.slice(0, 10)}...
                          {user?.wallet?.address?.slice(-8)}
                        </p>
                        <button
                           onClick={handleCopy}
                          className="flex gap-1 ml-2 text-emerald-500 hover:text-emerald-700 text-xs"
                        >
                          <Copy className="w-4 h-4"/>
                          {copied ? "Copied!" : ""}
                        </button>
                      </div>

                      {/* Current Network */}
                      <div className="px-4 py-4 border-b border-emerald-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">
                              Connected Network
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setShowNetworkSelector(!showNetworkSelector)
                            }
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            {showNetworkSelector ? "Cancel" : "Switch"}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1 p-2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              connectedChain === selectedChain
                                ? "bg-green-500 "
                                : "bg-gray-400"
                            }`}
                          />
                          <span className="text-sm text-slate-900">
                            {getChainById(selectedChain || 421614)?.name ||
                              "Unknown"}
                          </span>
                        </div>
                      </div>

                      {/* Network Selector */}
                      {showNetworkSelector && (
                        <div className="border-b border-emerald-100">
                          <div className="px-4 py-2">
                            <p className="text-xs text-slate-500 mb-2">
                              Select Network:
                            </p>
                            <div className="space-y-1">
                              {chains.map((chain) => {
                                const isSelected = selectedChain === chain.id;
                                const isConnected = connectedChain === chain.id;

                                return (
                                  <button
                                    key={chain.id}
                                    onClick={() => handleChainSwitch(chain.id)}
                                    className={`w-full flex items-center justify-between p-2 rounded text-left text-sm transition-colors ${
                                      isSelected
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "hover:bg-gray-50 text-slate-700"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-2 h-2 rounded-full ${
                                          isConnected
                                            ? "bg-green-500"
                                            : "bg-gray-400"
                                        }`}
                                      />
                                      <span>{chain.name}</span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      Testnet
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          logout();
                          setWalletDropdownOpen(false);
                          setShowNetworkSelector(false);
                        }}
                        className="w-[90%] mx-auto my-2 flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg text-xs sm:text-base"
                      >
                        <LogOut className="w-4 h-4" />
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={login}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg text-xs sm:text-base"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
              )
            ) : (
              <div className="flex items-center gap-2 px-6 py-2 bg-slate-200 text-slate-500 rounded-full">
                <Wallet className="w-4 h-4" />
                Loading...
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
