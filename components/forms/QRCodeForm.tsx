'use client'

import { useState } from 'react'
import { QrCode } from 'lucide-react'
import { generateQRCode } from '@/lib/apis/beneficiary'
import { QRCodeResponse } from '@/types/api-helper'

interface QRCodeFormProps {
  onQRGenerated: (result: QRCodeResponse) => void;
}

export default function QRCodeForm({ onQRGenerated }: QRCodeFormProps) {
  const [isGeneratingQr, setIsGeneratingQr] = useState(false)

  // QR Code generation state
  const [qrCodeData, setQrCodeData] = useState({
    vpa: '',
    amount: 0,
    purpose: '',
    remarks: ''
  })

  const generateQrCode = async () => {
    // Validate required fields
    if (!qrCodeData.vpa.trim()) {
      const errorResult: QRCodeResponse = {
        success: false,
        message: 'UPI ID is required to generate QR code',
        error: 'Missing UPI ID'
      }
      onQRGenerated(errorResult)
      return
    }

    // Basic VPA validation
    const vpaPattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
    if (!vpaPattern.test(qrCodeData.vpa)) {
      const errorResult: QRCodeResponse = {
        success: false,
        message: 'Please enter a valid UPI ID',
        error: 'Invalid VPA format'
      }
      onQRGenerated(errorResult)
      return
    }

    setIsGeneratingQr(true)
    try {
      const response = await generateQRCode(qrCodeData);
      onQRGenerated(response)

      // Reset form on success (keep VPA for convenience)
      if (response.success) {
        setQrCodeData(prev => ({
          ...prev,
          amount: 0,
          purpose: '',
          remarks: ''
        }))
      }

    } catch (error) {
      const errorResult: QRCodeResponse = {
        success: false,
        message: `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      onQRGenerated(errorResult)
    } finally {
      setIsGeneratingQr(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center">
          <QrCode className="w-5 h-5 mr-2" />
          Generate UPI QR Code
        </h2>
      </div>

      <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
        {/* UPI ID */}
        <div>
          <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-2">
            UPI ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="merchant@paytm"
            value={qrCodeData.vpa}
            onChange={(e) => setQrCodeData({ ...qrCodeData, vpa: e.target.value.toLowerCase() })}
            className="w-full px-3 sm:px-4 py-3 sm:py-3 text-base border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors touch-manipulation min-h-[48px]"
            disabled={isGeneratingQr}
            maxLength={256}
          />
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Enter the UPI ID for which you want to generate a QR code
          </p>
        </div>

        {/* Optional Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              placeholder="100.00"
              value={qrCodeData.amount}
              onChange={(e) => setQrCodeData({ ...qrCodeData, amount: e.target.valueAsNumber })}
              className="w-full px-3 sm:px-4 py-3 sm:py-3 text-base border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors touch-manipulation min-h-[48px]"
              disabled={isGeneratingQr}
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-2">
              Purpose
            </label>
            <input
              type="text"
              placeholder="Payment for services"
              value={qrCodeData.purpose}
              onChange={(e) => setQrCodeData({ ...qrCodeData, purpose: e.target.value })}
              className="w-full px-3 sm:px-4 py-3 sm:py-3 text-base border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors touch-manipulation min-h-[48px]"
              disabled={isGeneratingQr}
              maxLength={50}
            />
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-2">
            Remarks
          </label>
          <input
            type="text"
            placeholder="Transaction reference or notes"
            value={qrCodeData.remarks}
            onChange={(e) => setQrCodeData({ ...qrCodeData, remarks: e.target.value })}
            className="w-full px-3 sm:px-4 py-3 sm:py-3 text-base border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors touch-manipulation min-h-[48px]"
            disabled={isGeneratingQr}
            maxLength={100}
          />
        </div>

        {/* Generate QR Code Button */}
        <button
          onClick={generateQrCode}
          disabled={isGeneratingQr || !qrCodeData.vpa.trim()}
          className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 sm:px-6 py-4 sm:py-4 rounded-lg font-semibold text-base hover:from-teal-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[56px]"
        >
          {isGeneratingQr ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 flex-shrink-0"></div>
              <span className="text-sm sm:text-base">Generating QR Code...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <QrCode className="w-5 h-5 inline mr-2 flex-shrink-0" />
              <span className="text-sm sm:text-base">Generate QR Code</span>
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
