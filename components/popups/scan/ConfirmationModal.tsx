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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4">
      <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-sm md:max-w-md lg:max-w-lg max-h-[96vh] sm:max-h-[92vh] md:max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-slate-200">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900">
            Confirm Payment Details
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 md:space-y-4">
          {/* QR Type */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-slate-900">QR Type</span>
            </div>
            <p className="text-slate-600 capitalize">
              {parsedData.qrType.replace('_', ' ')}
            </p>
          </div>

          {/* Account Details */}
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-slate-900">Payee UPI ID</span>
              </div>
              <p className="text-slate-600 font-mono">
                {parsedData.data.pa}
              </p>
            </div>

            {parsedData.data.pn && (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-slate-900">Payee Name</span>
                </div>
                <p className="text-slate-600">
                  {parsedData.data.pn}
                </p>
              </div>
            )}

            {/* Amount Section */}
            <div className={`rounded-lg p-4 ${(!isCurrencySupported(parsedData.data.cu) ||
              (parsedData.data.am && !isAmountValid(parsedData.data.am)) ||
              (!parsedData.data.am && userAmount && !isAmountValid(userAmount)))
              ? 'bg-red-50 border border-red-200'
              : 'bg-slate-50'
              }`}>
              <div className="flex items-center gap-2 mb-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-slate-900">Amount</span>
                {(!isCurrencySupported(parsedData.data.cu) ||
                  (parsedData.data.am && !isAmountValid(parsedData.data.am)) ||
                  (!parsedData.data.am && userAmount && !isAmountValid(userAmount))) && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
              </div>
              {parsedData.data.am ? (
                // Display amount from QR
                <div>
                  <p className={`${isCurrencySupported(parsedData.data.cu) && isAmountValid(parsedData.data.am)
                    ? 'text-slate-600'
                    : 'text-red-700'
                    }`}>
                    {parsedData.data.am} {parsedData.data.cu || 'INR'}
                  </p>
                  {getCurrencyError(parsedData.data.cu) && (
                    <p className="text-xs text-red-600 mt-1">
                      {getCurrencyError(parsedData.data.cu)}
                    </p>
                  )}
                  {parsedData.data.am && !isAmountValid(parsedData.data.am) && (
                    <p className="text-xs text-red-600 mt-1">
                      {getAmountError(parsedData.data.am)}
                    </p>
                  )}
                </div>
              ) : (
                // Input field for amount when not specified in QR
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
                    <input
                      type="number"
                      value={userAmount}
                      onChange={(e) => {
                        // Only allow changes if there's no amount in QR data
                        if (!parsedData.data.am) {
                          setUserAmount(e.target.value)
                        }
                      }}
                      readOnly={!!parsedData.data.am}
                      placeholder="Enter amount (max ₹25,000)"
                      className={`w-full pl-8 pr-3 py-3 sm:py-2 text-base sm:text-sm border border-slate-300 rounded-lg sm:rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 touch-manipulation ${
                        parsedData.data.am 
                          ? 'text-slate-500 bg-slate-50' 
                          : 'text-slate-900 bg-white'
                      }`}
                      min="1"
                      max="25000"
                      step="0.01"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500">Currency: INR (Indian Rupees)</p>
                    <p className="text-xs text-slate-500">Max: ₹25,000</p>
                  </div>
                  {getCurrencyError(parsedData.data.cu) && (
                    <p className="text-xs text-red-600 mt-1">
                      {getCurrencyError(parsedData.data.cu)}
                    </p>
                  )}
                  {userAmount && !isAmountValid(userAmount) && (
                    <p className="text-xs text-red-600 mt-1">
                      {getAmountError(userAmount)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Validation Status */}
          <div className={`rounded-lg p-4 ${parsedData && parsedData.isValid &&
            parsedData.data && isCurrencySupported(parsedData.data.cu) &&
            (parsedData.data.am ? isAmountValid(parsedData.data.am) : true) &&
            (!parsedData.data.am && userAmount ? isAmountValid(userAmount) : true)
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
            }`}>
            <div className="flex items-center gap-2">
              {parsedData && parsedData.isValid &&
                parsedData.data && isCurrencySupported(parsedData.data.cu) &&
                (parsedData.data.am ? isAmountValid(parsedData.data.am) : true) &&
                (!parsedData.data.am && userAmount ? isAmountValid(userAmount) : true) ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${parsedData && parsedData.isValid &&
                parsedData.data && isCurrencySupported(parsedData.data.cu) &&
                (parsedData.data.am ? isAmountValid(parsedData.data.am) : true) &&
                (!parsedData.data.am && userAmount ? isAmountValid(userAmount) : true)
                ? 'text-green-900'
                : 'text-red-900'
                }`}>
                {parsedData && parsedData.isValid &&
                  parsedData.data && isCurrencySupported(parsedData.data.cu) &&
                  (parsedData.data.am ? isAmountValid(parsedData.data.am) : true) &&
                  (!parsedData.data.am && userAmount ? isAmountValid(userAmount) : true)
                  ? 'Valid QR Code'
                  : 'Invalid QR Code'}
              </span>
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
            onClick={() => onConfirm(finalAmount)}
            className="w-full sm:flex-1 px-4 py-3 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed touch-manipulation min-h-[44px] text-sm sm:text-base"
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
                  className="animate-spin h-4 w-4 text-white"
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
                <span className="ml-2">Converting...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirm
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
