'use client'

import { useState } from 'react'
import { X, AlertCircle, DollarSign, Banknote, ArrowBigRight } from 'lucide-react'
import { ConversionModalProps } from '@/types/popups/ConversionModal'

export default function ConversionModal({
  isOpen,
  onClose,
  onPay,
  parsedData,
  userAmount,
  conversionResult,
  usdcBalance,
  isCheckingBalance,
  isProcessingPayment,
  paymentStep,
  balanceError,
  // isTestMode,
  // beneficiaryDetails,
  connectedChain,
  isValidChainId
}: ConversionModalProps) {
  const [showReason, setShowReason] = useState(false)

  if (!isOpen || !parsedData || !conversionResult) return null

  const hasInsufficientBalance = parseFloat(usdcBalance) < conversionResult.totalUsdcAmount
  const isNetworkInvalid = !connectedChain || !isValidChainId?.(connectedChain)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4">
      <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-sm md:max-w-md lg:max-w-lg max-h-[96vh] sm:max-h-[92vh] md:max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-slate-200">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900">
            Payment Conversion
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-3 sm:p-4 md:p-6">
          {/* Payment Flow Info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-emerald-800">
              <span className="text-emerald-600">💱</span>
              <span className="font-medium">You pay in USDC • Merchant receives in INR</span>
            </div>
          </div>

          {/* Unified Payment Details Container */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {/* Currency Conversion Section */}
            <div className="p-4 bg-gradient-to-r from-emerald-50/30 to-teal-50/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">$</span>
                </div>
                <span className="font-semibold text-emerald-900">Currency Conversion Details</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-emerald-900 font-semibold text-lg">{parseFloat(parsedData!.data.am || userAmount).toFixed(2)} ₹</span>
                  <span className="text-emerald-700 font-medium"><ArrowBigRight className="w-4 h-4" /></span>
                  <span className="font-mono text-emerald-900 font-bold text-xl">{conversionResult!.usdcAmount.toFixed(6)} $</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-700 text-sm">Exchange Rate:</span>
                  <span className="font-mono text-emerald-900 text-sm">1 $ = {(1 / conversionResult!.exchangeRate).toFixed(2)} ₹</span>
                </div>
              </div>
            </div>

            {/* Horizontal Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></div>

            {/* Network Service Fee Section */}
            <div className="p-4 bg-gradient-to-r from-teal-50/30 to-emerald-50/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">⚡</span>
                </div>
                <span className="font-semibold text-teal-900">Network Service Fee</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-teal-700 font-medium">Service Fee:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-teal-900 font-semibold text-lg">{conversionResult!.networkFee.toFixed(2)} USDC</span>
                    <button
                      onClick={() => setShowReason(prev => !prev)}
                      className="flex items-center justify-center w-6 h-6 bg-teal-100 hover:bg-teal-200 rounded-full transition-all duration-200 group hover:scale-105 shadow-sm"
                      title={showReason ? "Hide details" : "Show details"}
                    >
                      <svg
                        className={`w-3 h-3 text-teal-600 transition-transform duration-300 ${showReason ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expandable Reason Section */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showReason ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 bg-gradient-to-r from-white/80 to-teal-50/80 rounded-lg border border-teal-200 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-teal-600 text-sm">💡</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-teal-900 mb-1">What&apos;s included in this fee?</h4>
                        <p className="text-sm text-teal-800 leading-relaxed">
                          This covers your <span className="font-semibold">ETH gas sponsorship</span> for seamless Web3 payments on <span className="font-semibold text-teal-700">{conversionResult!.networkName}</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Horizontal Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent"></div>

            {/* Payment Summary Section */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-emerald-900">Payment Summary</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-700">UPI ID:</span>
                  <span className="font-mono text-emerald-900">{parsedData!.data.pa}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700">Your USDC Balance:</span>
                  <span className={`font-medium ${parseFloat(usdcBalance) < conversionResult!.totalUsdcAmount ? 'text-red-600' : 'text-emerald-900'}`}>
                    {isCheckingBalance ? 'Checking...' : `${parseFloat(usdcBalance).toFixed(2)} USDC`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700">Payment Amount:</span>
                  <span className="font-medium text-emerald-900">{conversionResult!.usdcAmount.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700">Network Fee:</span>
                  <span className="font-medium text-emerald-900">{conversionResult!.networkFee.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 pt-2 mt-2">
                  <span className="text-emerald-700 font-semibold">You Pay:</span>
                  <span className="font-bold text-emerald-900 text-lg">{conversionResult!.totalUsdcAmount.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 pt-2 mt-2">
                  <span className="text-emerald-700 font-semibold">Merchant Receives:</span>
                  <span className="font-bold text-emerald-900 text-lg">₹{parseFloat(parsedData!.data.am || userAmount).toFixed(2)}</span>
                </div>
                {balanceError && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-xs">{balanceError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 px-4 py-3 sm:py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors touch-manipulation min-h-[44px] text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onPay}
            disabled={
              isCheckingBalance ||
              isProcessingPayment ||
              hasInsufficientBalance ||
              isNetworkInvalid
            }
            className={`w-full sm:flex-1 px-4 py-3 sm:py-2 rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation min-h-[44px] text-sm sm:text-base ${isCheckingBalance || isProcessingPayment
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : hasInsufficientBalance
                ? 'bg-red-500 text-white cursor-not-allowed'
                : isNetworkInvalid
                  ? 'bg-orange-500 text-white cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
          >
            {isCheckingBalance ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Checking Balance...
              </>
            ) : hasInsufficientBalance ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Insufficient USDC
              </>
            ) : isNetworkInvalid ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Unsupported Network
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                {paymentStep || 'Pay Now'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
