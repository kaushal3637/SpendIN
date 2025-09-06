'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronDown, Wallet, LogOut, Network } from 'lucide-react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useWallet } from '@/context/WalletContext'
import { chains, getChainById } from '@/lib/chains'

const navigation = [
  { name: 'Home', href: '#hero', current: true },
  { name: 'Features', href: '#features', current: false },
  { name: 'How It Works', href: '#how-it-works', current: false },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const [showNetworkSelector, setShowNetworkSelector] = useState(false)

  // Privy hooks
  const { ready, authenticated, user, login, logout } = usePrivy()

  // Wallet context
  const { wallets: privyWallets } = useWallets()
  const { selectedChain, setSelectedChain, connectedChain } = useWallet()
  const wallet = privyWallets[0]

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      // Calculate offset for mobile to account for navbar and centering
      const isMobile = window.innerWidth < 640
      const navbarHeight = 64 // h-16 = 64px
      const offset = isMobile ? navbarHeight + 20 : 0 // Extra 20px for mobile spacing

      const elementPosition = element.offsetTop - offset
      const offsetPosition = elementPosition

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
    setIsOpen(false) // Close mobile menu
  }

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = navigation.map(nav => nav.href.replace('#', ''))
      const scrollPosition = window.scrollY + 150 // Increased threshold for better detection
      const isMobile = window.innerWidth < 640
      const navbarOffset = isMobile ? 84 : 100 // Account for navbar height

      sections.forEach((section) => {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          const adjustedOffsetTop = offsetTop - navbarOffset

          if (scrollPosition >= adjustedOffsetTop && scrollPosition < adjustedOffsetTop + offsetHeight) {
            setActiveSection(section)
          }
        }
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close wallet dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (walletDropdownOpen && !target.closest('[data-wallet-dropdown]') && !target.closest('.mobile-wallet-dropdown')) {
        setWalletDropdownOpen(false)
        setShowNetworkSelector(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [walletDropdownOpen])

  // Set default chain if none selected
  useEffect(() => {
    if (!selectedChain && wallet?.chainId) {
      const chainId = parseInt(wallet.chainId.split(":")[1])
      setSelectedChain(chainId)
    }
  }, [selectedChain, wallet, setSelectedChain])

  const handleChainSwitch = async (chainId: number) => {
    try {
      if (wallet) {
        await wallet.switchChain(chainId)
        setSelectedChain(chainId)
        setShowNetworkSelector(false)
      }
    } catch (error) {
      console.error("Failed to switch chain:", error)
    }
  }

  const handleNavClick = (href: string) => {
    const sectionId = href.replace('#', '')
    scrollToSection(sectionId)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">StableUPI</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeSection === item.href.replace('#', '')
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Wallet Connection */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {ready ? (
                authenticated ? (
                  <div className="relative" data-wallet-dropdown>
                    <button
                      onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors duration-200"
                    >
                      <Wallet className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {user?.wallet?.address
                          ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
                          : 'Connected'
                        }
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {/* Wallet Dropdown */}
                    {walletDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-emerald-100 py-1 z-50">
                        <div className="px-4 py-2 border-b border-emerald-100">
                          <p className="text-sm text-slate-600">Connected Wallet</p>
                          <p className="text-xs text-slate-500 font-mono">
                            {user?.wallet?.address?.slice(0, 10)}...{user?.wallet?.address?.slice(-8)}
                          </p>
                        </div>

                        {/* Current Network */}
                        <div className="px-4 py-2 border-b border-emerald-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Network className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm text-slate-600">Network</span>
                            </div>
                            <button
                              onClick={() => setShowNetworkSelector(!showNetworkSelector)}
                              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              {showNetworkSelector ? 'Cancel' : 'Switch'}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${connectedChain === selectedChain ? 'bg-green-500' : 'bg-gray-400'
                              }`} />
                            <span className="text-sm text-slate-900">
                              {getChainById(selectedChain || 1)?.name || 'Unknown'}
                            </span>
                          </div>
                        </div>

                        {/* Network Selector */}
                        {showNetworkSelector && (
                          <div className="border-b border-emerald-100">
                            <div className="px-4 py-2">
                              <p className="text-xs text-slate-500 mb-2">Select Network:</p>
                              <div className="space-y-1">
                                {chains.map((chain) => {
                                  const isSelected = selectedChain === chain.id
                                  const isConnected = connectedChain === chain.id

                                  return (
                                    <button
                                      key={chain.id}
                                      onClick={() => handleChainSwitch(chain.id)}
                                      className={`w-full flex items-center justify-between p-2 rounded text-left text-sm transition-colors ${isSelected
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'hover:bg-gray-50 text-slate-700'
                                        }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'
                                          }`} />
                                        <span>{chain.name}</span>
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {chain.testnet ? 'Testnet' : 'Mainnet'}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            logout()
                            setWalletDropdownOpen(false)
                            setShowNetworkSelector(false)
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors duration-200"
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
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
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

          {/* Mobile Layout */}
          <div className="md:hidden flex items-center gap-3">
            <div className="flex-shrink-0">
              {ready ? (
                authenticated ? (
                  <div className="relative">
                    {/* Connected - Show wallet button with network indicator */}
                    <button
                      onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                      className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      title="Wallet Options"
                    >
                      <Wallet className="w-4 h-4" />
                      <div className={`w-2 h-2 rounded-full ml-1 ${connectedChain === selectedChain ? 'bg-green-400' : 'bg-yellow-400'
                        }`} />
                    </button>

                    {/* Mobile Wallet Dropdown */}
                    {walletDropdownOpen && (
                      <div className="mobile-wallet-dropdown absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-emerald-100 py-2 z-[9999] max-h-[80vh] overflow-y-auto">
                        <div className="px-4 py-2 border-b border-emerald-100">
                          <p className="text-sm text-slate-600">Connected Wallet</p>
                          <p className="text-xs text-slate-500 font-mono">
                            {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
                          </p>
                        </div>

                        {/* Network Section */}
                        <div className="px-4 py-2 border-b border-emerald-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Network className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm text-slate-600">Network</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {chains.map((chain) => {
                              const isSelected = selectedChain === chain.id
                              const isConnected = connectedChain === chain.id

                              return (
                                <button
                                  key={chain.id}
                                  onClick={() => {
                                    handleChainSwitch(chain.id)
                                    setWalletDropdownOpen(false)
                                  }}
                                  className={`w-full flex items-center justify-between p-2 rounded text-left text-sm transition-colors ${isSelected
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'hover:bg-gray-50 text-slate-700'
                                    }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'
                                      }`} />
                                    <span className="text-xs">{chain.name}</span>
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {chain.testnet ? 'Test' : 'Main'}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            logout()
                            setWalletDropdownOpen(false)
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors duration-200"
                        >
                          <LogOut className="w-4 h-4" />
                          Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Not connected - Show connect button
                  <button
                    onClick={login}
                    className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    title="Connect Wallet"
                  >
                    <Wallet className="w-4 h-4" />
                  </button>
                )
              ) : (
                <div className="flex items-center gap-1 px-3 py-2 bg-slate-200 text-slate-500 rounded-full">
                  <Wallet className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors duration-200"
            >
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-emerald-100">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${activeSection === item.href.replace('#', '')
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
