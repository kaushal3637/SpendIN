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
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-900/80 via-teal-900/60 to-emerald-800/70 backdrop-blur-sm flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl shadow-2xl w-full max-w-md mx-auto max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Review Payment
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-3 flex-1 overflow-y-auto">
          {/* Currency Conversion - Prominent Display */}
          <div className="text-center mb-4">
            <div className="bg-emerald-50 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">₹{parseFloat(parsedData!.data.am || userAmount).toFixed(2)}</div>
                  <div className="text-xs text-slate-500">INR Amount</div>
                </div>
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <ArrowBigRight className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-emerald-600">${conversionResult!.usdcAmount.toFixed(2)}</div>
                  <div className="text-xs text-slate-500">USDC</div>
                </div>
              </div>
              <div className="text-xs text-emerald-700">
                Rate: 1 USD = ₹{(1 / conversionResult!.exchangeRate).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-slate-900">Payment Breakdown</h4>
            
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Payment Amount</span>
                <span className="font-medium text-slate-900">${conversionResult!.usdcAmount.toFixed(2)} USDC</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-slate-600">Network Fee</span>
                  <button
                    onClick={() => setShowReason(prev => !prev)}
                    className="w-4 h-4 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg className={`w-2 h-2 text-slate-600 transition-transform ${showReason ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <span className="font-medium text-slate-900">${conversionResult!.networkFee.toFixed(2)} USDC</span>
              </div>

              {/* Expandable Fee Details */}
              {showReason && (
                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-800">
                    Covers gas sponsorship on {conversionResult!.networkName}
                  </p>
                </div>
              )}
              
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                <span className="font-medium text-slate-900">Total</span>
                <span className="font-bold text-lg text-slate-900">${conversionResult!.totalUsdcAmount.toFixed(2)} USDC</span>
              </div>
            </div>
          </div>

          {/* Balance Check */}
          <div className="mb-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Your USDC Balance</span>
              <span className={`font-medium ${parseFloat(usdcBalance) < conversionResult!.totalUsdcAmount ? 'text-red-600' : 'text-green-600'}`}>
                {isCheckingBalance ? 'Checking...' : `$${parseFloat(usdcBalance).toFixed(2)} USDC`}
              </span>
            </div>
            {hasInsufficientBalance && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">Insufficient USDC balance for this transaction</p>
              </div>
            )}
          </div>

          {/* Transaction Details */}
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-slate-900">Transaction Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">To</span>
                <span className="font-medium text-slate-900">{parsedData!.data.pn || 'Merchant'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">UPI ID</span>
                <span className="font-mono text-slate-900 text-xs">{parsedData!.data.pa}</span>
              </div>
              {parsedData!.data.tr && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Reference</span>
                  <span className="font-mono text-slate-900 text-xs">{parsedData!.data.tr}</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Messages */}
          {balanceError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{balanceError}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={onPay}
            disabled={
              isCheckingBalance ||
              isProcessingPayment ||
              hasInsufficientBalance ||
              isNetworkInvalid
            }
            className={`w-full py-3 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium ${
              isCheckingBalance || isProcessingPayment
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
                <svg
                  className="animate-spin h-4 w-4 text-white mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Checking Balance...
              </>
            ) : isProcessingPayment ? (
              <>
               <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                {paymentStep || 'Processing...'}
              </>
            ) : hasInsufficientBalance ? (
              <>
                <AlertCircle className="w-5 h-5" />
                Insufficient USDC
              </>
            ) : isNetworkInvalid ? (
              <>
                <AlertCircle className="w-5 h-5" />
                Unsupported Network
              </>
            ) : (
              <>
                Pay ${conversionResult!.totalUsdcAmount.toFixed(2)} USDC
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
