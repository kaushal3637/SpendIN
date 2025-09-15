'use client'

import { useState } from 'react'
import { Plus, CheckCircle, AlertCircle, X, QrCode, Download, Copy } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { addBeneficiary, validateBeneficiaryData } from '@/lib/apis/beneficiary'
import { BeneficiaryRequest } from '@/types/api-helper'
import { BACKEND_URL, API_KEY } from '@/config/constant'
import Instruction from '@/components/beneficiary-route/Instruction'

export default function BeneficiaryPage() {
  const [isLoading, setIsLoading] = useState(false)

  const [beneficiaryData, setBeneficiaryData] = useState({
    name: '',
    vpa: ''
  })

  // QR Code generation state
  const [qrCodeData, setQrCodeData] = useState({
    vpa: '',
    amount: '',
    purpose: '',
    remarks: ''
  })

  const [qrResult, setQrResult] = useState<{
    success: boolean;
    message: string;
    qrCode?: {
      qrCodeId: string;
      qrCodeUrl: string;
      qrCodeString: string;
      upiString: string;
      amount?: number;
      purpose?: string;
      createdAt: string;
    };
    error?: string;
  } | null>(null)

  const [isGeneratingQr, setIsGeneratingQr] = useState(false)

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
      return
    }

    // Basic VPA validation
    const vpaPattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
    if (!vpaPattern.test(qrCodeData.vpa)) {
      setQrResult({
        success: false,
        message: 'Please enter a valid UPI ID (e.g., user@bank)',
        error: 'Invalid VPA format'
      })
      return
    }

    setIsGeneratingQr(true)
    try {
      const requestBody = {
        vpa: qrCodeData.vpa.trim().toLowerCase(),
        amount: qrCodeData.amount ? parseFloat(qrCodeData.amount) : undefined,
        purpose: qrCodeData.purpose || undefined,
        remarks: qrCodeData.remarks || undefined,
      }

      console.log('Generating QR code via backend:', requestBody)

      const response = await fetch(`${BACKEND_URL}/api/phonepe/qr/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY!
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate QR code')
      }

      const data = await response.json()

      console.log('QR code response:', data)
      console.log('QR code data:', data.data)

      setQrResult({
        success: true,
        message: data.message || "QR code generated successfully",
        qrCode: data.data // Backend returns the QR code data structure
      })

      // Reset form on success (keep VPA for convenience)
      setQrCodeData(prev => ({
        ...prev,
        amount: '',
        purpose: '',
        remarks: ''
      }))

    } catch (error) {
      console.error('Error generating QR code:', error)
      setQrResult({
        success: false,
        message: `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsGeneratingQr(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
      alert('Copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('Failed to copy to clipboard')
    }
  }

  const downloadQrCode = (qrCodeUrl: string, qrCodeId: string) => {
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `qr-code-${qrCodeId}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
                    onChange={(e) => setQrCodeData({ ...qrCodeData, amount: e.target.value })}
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

          {/* Instructions & Results */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* QR Code Results Display */}
            {qrResult && (
              <div className="rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4 md:p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900">
                    QR Code Generation Results
                  </h3>
                  <button
                    onClick={() => setQrResult(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {qrResult.success && qrResult.qrCode && qrResult.qrCode.qrCodeUrl ? (
                  <div className="space-y-4">
                    {/* Debug info */}
                    <div className="text-xs bg-gray-100 p-2 rounded">
                      <strong>Debug:</strong> QR Code loaded successfully<br />
                      URL: {qrResult.qrCode.qrCodeUrl}<br />
                      ID: {qrResult.qrCode.qrCodeId}
                    </div>
                    {/* QR Code Display */}
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-lg border-2 border-slate-200">
                        <Image
                          src={qrResult.qrCode.qrCodeUrl}
                          alt="UPI QR Code"
                          width={224}
                          height={224}
                          className="w-48 h-48 sm:w-56 sm:h-56"
                          unoptimized={true}
                        />
                      </div>
                    </div>

                    {/* QR Code Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-slate-900">QR Code Details</h4>
                        <div className="text-sm space-y-1">
                          <p><strong>ID:</strong> {qrResult.qrCode.qrCodeId}</p>
                          <p><strong>Created:</strong> {new Date(qrResult.qrCode.createdAt).toLocaleString()}</p>
                          {qrResult.qrCode.amount && (
                            <p><strong>Amount:</strong> ₹{qrResult.qrCode.amount.toFixed(2)}</p>
                          )}
                          {qrResult.qrCode.purpose && (
                            <p><strong>Purpose:</strong> {qrResult.qrCode.purpose}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-slate-900">UPI String</h4>
                        <div className="bg-slate-100 p-2 rounded text-xs font-mono break-all">
                          {qrResult.qrCode.upiString}
                        </div>
                        <button
                          onClick={() => copyToClipboard(qrResult.qrCode!.upiString)}
                          className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Copy UPI String
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => downloadQrCode(qrResult.qrCode!.qrCodeUrl, qrResult.qrCode!.qrCodeId)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download QR Code
                      </button>
                      <button
                        onClick={() => copyToClipboard(qrResult.qrCode!.qrCodeUrl)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Image URL
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <p className="text-red-700 font-medium">QR Code Generation Failed</p>
                      <p className="text-red-600 text-sm mt-1">{qrResult.error}</p>
                      {/* Debug info for troubleshooting */}
                      <div className="text-xs bg-red-50 p-2 rounded mt-4 text-left">
                        <strong>Debug Info:</strong><br />
                        Success: {String(qrResult.success)}<br />
                        Has QR Code: {String(!!qrResult.qrCode)}<br />
                        Has URL: {String(!!qrResult.qrCode?.qrCodeUrl)}<br />
                        Message: {qrResult.message}
                      </div>
                    </div>
                  </div>
                )}

                {/* Overall Status */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-center">
                    {qrResult.success ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-teal-600 mr-2" />
                        <span className="text-sm font-medium text-teal-800">QR Code Generated Successfully</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-red-800">QR Code Generation Failed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Instruction />

          </div>
          {/* Spacer for full height utilization */}
          <div className="flex-grow min-h-[2rem] sm:min-h-[3rem] md:min-h-[4rem]"></div>
        </div>
      </div>
    </div>
  )
}