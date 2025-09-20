'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, RotateCcw, History, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PaymentStatusModalProps {
  isOpen: boolean
  onClose: () => void
  isSuccess: boolean
  transactionHash?: string
  amount: number
  merchantName: string
  usdcAmount: number
  inrAmount: number
  errorMessage?: string
  chainId?: number
  onScanAgain: () => void
  onViewHistory: () => void
}

export default function PaymentStatusModal({
  isOpen,
  onClose,
  isSuccess,
  transactionHash,
  amount,
  merchantName,
  usdcAmount,
  inrAmount,
  errorMessage,
  chainId,
  onScanAgain,
  onViewHistory
}: PaymentStatusModalProps) {
  const [showContent, setShowContent] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      // Delay content animation
      setTimeout(() => setShowContent(true), 300)
    } else {
      setShowContent(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const getBlockExplorerUrl = (txHash: string, chainId?: number) => {
    const baseUrls = {
      421614: 'https://sepolia.arbiscan.io', // Arbitrum Sepolia
      42161: 'https://arbiscan.io', // Arbitrum One
    }

    const baseUrl = baseUrls[chainId as keyof typeof baseUrls] || 'https://sepolia.arbiscan.io'
    return `${baseUrl}/tx/${txHash}`
  }

  const handleViewTransaction = () => {
    if (transactionHash) {
      const explorerUrl = getBlockExplorerUrl(transactionHash, chainId)
      window.open(explorerUrl, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col h-screen">
      {/* Success/Failure Animation */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 overflow-y-auto">
        {/* Minimal Animated Icon */}
        <div className="relative mb-4 sm:mb-6">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center ${
            isSuccess 
              ? 'bg-emerald-500' 
              : 'bg-red-500'
          }`}>
            {isSuccess ? (
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            ) : (
              <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className={`text-center mb-6 sm:mb-8 transition-all duration-500 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${
            isSuccess ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </h1>
          {!isSuccess && errorMessage && (
            <p className="text-gray-300 text-sm max-w-md px-4">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Payment Details - Only show for success */}
        {isSuccess && (
          <div className={`w-full max-w-sm space-y-3 sm:space-y-4 transition-all duration-700 delay-200 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            {/* Merchant with Amounts */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400 mb-1">Paid to</p>
                  <p className="font-semibold text-white text-base sm:text-lg truncate">{merchantName}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/20 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
              </div>
              
              {/* Amounts */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Amount</span>
                  <span className="text-xl sm:text-2xl font-bold text-white">₹{amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">USDC</span>
                  <span className="text-sm text-gray-300">{usdcAmount.toFixed(6)}</span>
                </div>
              </div>
            </div>

            {/* Transaction Hash */}
            {transactionHash && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400 mb-1">Transaction ID</p>
                    <p className="font-mono text-xs text-gray-300 truncate">
                      {transactionHash.slice(0, 6)}...{transactionHash.slice(-6)}
                    </p>
                  </div>
                  <button
                    onClick={handleViewTransaction}
                    className="ml-2 p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={onScanAgain}
                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-3 sm:p-4 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <div className="flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-medium text-sm sm:text-base">Scan Again</span>
                </div>
              </button>

              <button
                onClick={onViewHistory}
                className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-3 sm:p-4 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <div className="flex items-center justify-center gap-2">
                  <History className="w-4 h-4 text-white" />
                  <span className="text-white font-medium text-sm sm:text-base">Show Transaction</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Error Details - Only show for failure */}
        {!isSuccess && (
          <div className={`w-full max-w-sm transition-all duration-700 delay-200 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            {/* Action Buttons for Failure */}
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={onScanAgain}
                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-3 sm:p-4 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <div className="flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-medium text-sm sm:text-base">Scan Again</span>
                </div>
              </button>

              <button
                onClick={onViewHistory}
                className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-3 sm:p-4 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <div className="flex items-center justify-center gap-2">
                  <History className="w-4 h-4 text-white" />
                  <span className="text-white font-medium text-sm sm:text-base">Show Transaction</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
