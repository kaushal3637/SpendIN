'use client'

import { useState } from 'react'
import { Plus, QrCode } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { addBeneficiary, validateBeneficiaryData, generateQRCode } from '@/lib/apis/beneficiary'
import { BeneficiaryRequest, QRCodeResponse } from '@/types/api-helper'
import Instruction from '@/components/beneficiary-route/Instruction'
import QRCodeResultPopup from '@/components/popups/beneficiary/QRCodeResultModal'

export default function BeneficiaryPage() {
  const [isLoading, setIsLoading] = useState(false)

  const [beneficiaryData, setBeneficiaryData] = useState({
    name: '',
    vpa: ''
  })

  // QR Code generation state
  const [qrCodeData, setQrCodeData] = useState({
    vpa: '',
    amount: 0,
    purpose: '',
    remarks: ''
  })

  const [qrResult, setQrResult] = useState<QRCodeResponse | null>(null)
  const [isGeneratingQr, setIsGeneratingQr] = useState(false)
  const [showQrPopup, setShowQrPopup] = useState(false)

  // To Add and validate beneficiary data
  const handleAddBeneficiary = async () => {

    const validation = validateBeneficiaryData(beneficiaryData);

    if (!validation.isValid) {
      toast.error("Please add valid data");
      return;
    }

    setIsLoading(true)

    try {
      const requestData: BeneficiaryRequest = {
        name: beneficiaryData.name.trim(),
        vpa: beneficiaryData.vpa.trim().toLowerCase()
      }

      const result = await addBeneficiary(requestData)

      // Reset form on success
      if (result.success) {
        toast.success("Beneficiary added successfully");
      }
    } catch {

      toast.error("Failed to add beneficiary");
    } finally {
      setIsLoading(false)
    }
  }

  const generateQrCode = async () => {
    // Reset previous result
    setQrResult(null)

    // Validate required fields
    if (!qrCodeData.vpa.trim()) {
      setQrResult({
        success: false,
        message: 'UPI ID is required to generate QR code',
        error: 'Missing UPI ID'
      })
      setShowQrPopup(true)
      return
    }

    // Basic VPA validation
    const vpaPattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
    if (!vpaPattern.test(qrCodeData.vpa)) {
      setQrResult({
        success: false,
        message: 'Please enter a valid UPI ID',
        error: 'Invalid VPA format'
      })
      setShowQrPopup(true)
      return
    }

    setIsGeneratingQr(true)
    try {
      const response = await generateQRCode(qrCodeData);

      setQrResult(response)

      // Show popup
      setShowQrPopup(true)

      // Reset form on success (keep VPA for convenience)
      setQrCodeData(prev => ({
        ...prev,
        amount: 0,
        purpose: '',
        remarks: ''
      }))

    } catch (error) {
      setQrResult({
        success: false,
        message: `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      // Show popup even for errors
      setShowQrPopup(true)
    } finally {
      setIsGeneratingQr(false)
    }
  }


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex-1 w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900">Add Beneficiary</h1>
          </div>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto px-2 leading-relaxed">
            Add beneficiaries to your PhonePe Business account for seamless payout testing.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6 md:space-y-8 flex-1 flex flex-col">
          {/* Beneficiary Form */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex-1 flex flex-col">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center">
                Add New Beneficiary
              </h2>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 flex-1">
              {/* Beneficiary Name */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <label className="text-sm sm:text-base font-semibold text-slate-700">
                    Beneficiary Name <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded self-start sm:self-auto">Required</span>
                </div>
                <input
                  type="text"
                  placeholder="Test Merchant"
                  value={beneficiaryData.name}
                  onChange={(e) => setBeneficiaryData({ ...beneficiaryData, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-3 sm:py-3 text-base border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors touch-manipulation min-h-[48px]"
                  disabled={isLoading}
                  maxLength={100}
                />
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Full name of the beneficiary. Maximum 100 characters, alphabets and spaces only.
                </p>
              </div>

              {/* UPI ID */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <label className="text-sm sm:text-base font-semibold text-slate-700">
                    UPI ID <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded self-start sm:self-auto">Required</span>
                </div>
                <input
                  type="text"
                  placeholder="merchant@paytm"
                  value={beneficiaryData.vpa}
                  onChange={(e) => setBeneficiaryData({ ...beneficiaryData, vpa: e.target.value.toLowerCase() })}
                  className="w-full px-3 sm:px-4 py-3 sm:py-3 text-base border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors touch-manipulation min-h-[48px]"
                  disabled={isLoading}
                  maxLength={256}
                />
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Valid UPI ID format: user@bank (e.g., merchant@paytm, user@ybl, customer@okaxis)
                </p>
              </div>

              {/* Add Beneficiary Button */}
              <button
                onClick={handleAddBeneficiary}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 sm:px-6 py-4 sm:py-4 rounded-lg font-semibold text-base hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[56px]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 flex-shrink-0"></div>
                    <span className="text-sm sm:text-base">Adding Beneficiary...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Plus className="w-5 h-5 inline mr-2 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Add Beneficiary</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* QR Code Generation Section */}
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

          {/* Instructions */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <Instruction />
          </div>
          {/* Spacer for full height utilization */}
          <div className="flex-grow min-h-[2rem] sm:min-h-[3rem] md:min-h-[4rem]"></div>
        </div>
      </div>

      {/* QR Code Result Popup */}
      <QRCodeResultPopup
        isOpen={showQrPopup}
        onClose={() => setShowQrPopup(false)}
        qrResult={qrResult}
      />
    </div>
  )
}