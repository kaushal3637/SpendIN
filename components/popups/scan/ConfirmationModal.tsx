'use client'

import React from 'react'
import { QrCode, Wallet, CheckCircle, AlertCircle, X, Check, Banknote } from 'lucide-react'
import { isCurrencySupported, isAmountValid, getCurrencyError, getAmountError } from '@/lib/helpers/api-data-validator'
import { ConfirmationModalProps } from '@/types/popups/ConfirmationModal'

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  parsedData,
  userAmount,
  setUserAmount,
  isConverting,
  isTestMode,
  beneficiaryDetails,
  connectedChain,
  isValidChainId
}: ConfirmationModalProps) {

  if (!isOpen || !parsedData || !parsedData.data) return null

  const finalAmount = parseFloat(parsedData.data.am || userAmount)

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-900/80 via-teal-900/60 to-emerald-800/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-sm mx-auto max-h-[96vh] overflow-y-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Pay
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Payee Info */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="text-lg font-medium text-slate-900 mb-1">
              {parsedData.data.pn || 'Merchant'}
            </h4>
            <p className="text-sm text-slate-500 font-mono">
              {parsedData.data.pa}
            </p>
          </div>

          {/* Amount Input */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-2">
              {parsedData.data.am ? (
                // Display fixed amount from QR
                <div className="flex items-baseline">
                  <span className="text-2xl font-light text-slate-600 mr-1">₹</span>
                  <span className="text-4xl font-light text-slate-900">
                    {parseFloat(parsedData.data.am).toLocaleString('en-IN')}
                  </span>
                </div>
              ) : (
                // Editable amount input with INR symbol inside
                  <div className="relative">
                    <input
                    type="text"
                    value={userAmount ? `₹${userAmount}` : '₹'}
                      onChange={(e) => {
                      // Remove ₹ symbol and any non-numeric characters except decimal point
                      const value = e.target.value.replace('₹', '').replace(/[^0-9.]/g, '')
                      // Ensure only one decimal point
                      const parts = value.split('.')
                      if (parts.length > 2) {
                        return // Don't update if more than one decimal point
                      }
                      setUserAmount(value)
                    }}
                    onFocus={(e) => {
                      // Move cursor to end when focused
                      setTimeout(() => e.target.setSelectionRange(e.target.value.length, e.target.value.length), 0)
                    }}
                    onKeyDown={(e) => {
                      // Prevent deleting the ₹ symbol
                      const target = e.target as HTMLInputElement
                      if ((e.key === 'Backspace' || e.key === 'Delete') && target.selectionStart !== null && target.selectionStart <= 1) {
                        e.preventDefault()
                      }
                    }}
                    placeholder="₹0"
                    className="text-4xl font-light text-slate-900 bg-transparent border-none outline-none text-center w-64 placeholder-slate-400"
                    autoFocus
                    />
                  </div>
              )}
                  </div>
            
            {/* Amount constraints */}
            {!parsedData.data.am && (
              <p className="text-xs text-slate-500">
                Enter amount between ₹1 - ₹25,000
                    </p>
                  )}

            {/* Error messages */}
                  {userAmount && !isAmountValid(userAmount) && (
                    <p className="text-xs text-red-600 mt-1">
                      {getAmountError(userAmount)}
                    </p>
                  )}
                </div>

          {/* Transaction Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-600">Payment to</span>
              <span className="text-sm font-medium text-slate-900">
                {parsedData.data.pn || 'Merchant'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-slate-600">UPI ID</span>
              <span className="text-sm font-mono text-slate-900">
                {parsedData.data.pa}
              </span>
            </div>
            {parsedData.data.tr && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">Reference</span>
                <span className="text-xs font-mono text-slate-900">
                  {parsedData.data.tr}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={() => onConfirm(finalAmount)}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            disabled={
              !parsedData ||
              !parsedData.isValid ||
              !parsedData.data ||
              !isCurrencySupported(parsedData.data.cu) ||
              (parsedData.data.am && !isAmountValid(parsedData.data.am)) ||
              (!parsedData.data.am && (!userAmount.trim() || !isAmountValid(userAmount))) ||
              isConverting ||
              !connectedChain ||
              !isValidChainId?.(connectedChain)
            }
          >
            {isConverting ? (
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
                Processing...
              </>
            ) : (
              <>
                Pay ₹{finalAmount ? parseFloat(finalAmount.toString()).toLocaleString('en-IN') : '0'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
