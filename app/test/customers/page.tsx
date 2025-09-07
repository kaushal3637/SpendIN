'use client'

import { useState } from 'react'
import { Plus, CheckCircle, AlertCircle, X } from 'lucide-react'

export default function BeneficiaryManagementPage() {
  const [isLoading, setIsLoading] = useState(false)

  // Form state for beneficiary addition
  const [beneficiaryData, setBeneficiaryData] = useState({
    beneficiary_id: '',
    beneficiary_name: '',
    vpa: '',
    bank_account_number: '',
    bank_ifsc: ''
  })

  const [addResult, setAddResult] = useState<{
    success: boolean;
    message: string;
    beneficiary?: { beneficiary_id: string; beneficiary_status?: string };
    error?: string;
  } | null>(null)

  const addBeneficiary = async () => {
    // Reset previous result
    setAddResult(null)

    // Validate required fields
    if (!beneficiaryData.beneficiary_id || !beneficiaryData.beneficiary_name) {
      setAddResult({
        success: false,
        message: 'Beneficiary ID and Name are required',
        error: 'Missing required fields'
      })
      return
    }

    // Validate that at least one payment method is provided
    if (!beneficiaryData.vpa && (!beneficiaryData.bank_account_number || !beneficiaryData.bank_ifsc)) {
      setAddResult({
        success: false,
        message: 'Either UPI ID (VPA) or Bank Account + IFSC must be provided',
        error: 'Missing payment method'
      })
      return
    }

    setIsLoading(true)
    try {
      const requestBody = {
        beneficiary_id: beneficiaryData.beneficiary_id,
        beneficiary_name: beneficiaryData.beneficiary_name,
        beneficiary_instrument_details: {
          ...(beneficiaryData.vpa && { vpa: beneficiaryData.vpa }),
          ...(beneficiaryData.bank_account_number && {
            bank_account_number: beneficiaryData.bank_account_number
          }),
          ...(beneficiaryData.bank_ifsc && {
            bank_ifsc: beneficiaryData.bank_ifsc
          })
        }
      }

      console.log('Adding beneficiary:', requestBody)

      const response = await fetch('/api/cashfree-beneficiary/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add beneficiary')
      }

      const data = await response.json()

      setAddResult({
        success: true,
        message: `Beneficiary added successfully!\nBeneficiary ID: ${data.beneficiary?.beneficiary_id}\nStatus: ${data.beneficiary?.beneficiary_status || 'Success'}`,
        beneficiary: data.beneficiary
      })

      // Reset form on success
      setBeneficiaryData({
        beneficiary_id: '',
        beneficiary_name: '',
        vpa: '',
        bank_account_number: '',
        bank_ifsc: ''
      })

    } catch (error) {
      console.error('Error adding beneficiary:', error)
      setAddResult({
        success: false,
        message: `Failed to add beneficiary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
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
            Add beneficiaries to your Cashfree Payments account for seamless payout testing.
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
              {/* Beneficiary ID */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <label className="text-sm sm:text-base font-semibold text-slate-700">
                    Beneficiary ID <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded self-start sm:self-auto">Required</span>
                </div>
                <input
                  type="text"
                  placeholder="ABCDEFG12345"
                  value={beneficiaryData.beneficiary_id}
                  onChange={(e) => setBeneficiaryData({ ...beneficiaryData, beneficiary_id: e.target.value })}
                  className="w-full px-3 sm:px-4 py-3 sm:py-3 text-base border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors touch-manipulation min-h-[48px]"
                  disabled={isLoading}
                  maxLength={50}
                />
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Unique identifier for this beneficiary. Use alphanumeric characters only.
                </p>
              </div>

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
                  placeholder="Test Beneficiary"
                  value={beneficiaryData.beneficiary_name}
                  onChange={(e) => setBeneficiaryData({ ...beneficiaryData, beneficiary_name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-3 sm:py-3 text-base border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors touch-manipulation min-h-[48px]"
                  disabled={isLoading}
                  maxLength={100}
                />
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Full name of the beneficiary. Maximum 25 characters, alphabets and spaces only.
                </p>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                {/* UPI Section */}
                <div className="border border-slate-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                    <h4 className="text-sm sm:text-base font-semibold text-slate-700 flex items-center">
                      UPI ID <span className="text-red-500 ml-1">*</span>
                    </h4>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded self-start sm:self-auto">Required</span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="testbeneficiary@icici"
                      value={beneficiaryData.vpa}
                      onChange={(e) => setBeneficiaryData({ ...beneficiaryData, vpa: e.target.value })}
                      className="w-full px-3 sm:px-4 py-3 sm:py-3 text-base border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors touch-manipulation min-h-[48px]"
                      disabled={isLoading}
                      maxLength={50}
                    />
                    <p className="text-xs sm:text-sm text-slate-500">
                      Valid characters: alphanumeric, period (.), hyphen (-), underscore (_), at (@).
                    </p>
                  </div>
                </div>

                {/* Bank Transfer Section */}
                <div className="border border-slate-200 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-sm sm:text-base font-semibold text-slate-700 flex items-center">
                      Bank Transfer <span className="text-red-500 ml-1">*</span>
                    </h4>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded self-start sm:self-auto">Required</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        placeholder="1234567890"
                        value={beneficiaryData.bank_account_number}
                        onChange={(e) => setBeneficiaryData({ ...beneficiaryData, bank_account_number: e.target.value })}
                        className="w-full px-3 sm:px-4 py-3 sm:py-3 text-base border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors touch-manipulation min-h-[48px]"
                        disabled={isLoading}
                        maxLength={18}
                        minLength={9}
                      />
                      <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        9-18 digit account number
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">
                        Bank IFSC Code
                      </label>
                      <input
                        type="text"
                        placeholder="ICIC0000001"
                        value={beneficiaryData.bank_ifsc}
                        onChange={(e) => setBeneficiaryData({ ...beneficiaryData, bank_ifsc: e.target.value })}
                        className="w-full px-3 sm:px-4 py-3 sm:py-3 text-base border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors touch-manipulation min-h-[48px]"
                        disabled={isLoading}
                        maxLength={11}
                        minLength={11}
                      />
                      <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        11-character IFSC code
                      </p>
                    </div>
                  </div>

                  {(beneficiaryData.bank_account_number || beneficiaryData.bank_ifsc) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-start">
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-xs sm:text-sm text-amber-800">
                            <strong>Note:</strong> Both Bank Account Number and IFSC are required if you provide either one.
                            The IFSC must be in the standard format (first 4 alphabets, 5th character &apos;0&apos;, last 6 numerals).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Beneficiary Button */}
              <button
                onClick={addBeneficiary}
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

          {/* Instructions & Results */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Results Display */}
            {addResult && (
              <div className={`rounded-xl shadow-lg border p-3 sm:p-4 md:p-6 ${addResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start">
                  {addResult.success ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className={`text-sm sm:text-base md:text-lg font-semibold mb-2 ${addResult.success ? 'text-green-900' : 'text-red-900'}`}>
                      {addResult.success ? 'Beneficiary Added Successfully!' : 'Error Adding Beneficiary'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setAddResult(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4 md:p-6">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600 flex-shrink-0" />
                Complete Setup Guide
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4 mt-0.5 flex-shrink-0">
                    <span className="text-emerald-700 font-bold text-xs">1</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Enter Beneficiary Details</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Provide a unique Beneficiary ID and the full name. The ID should contain only alphanumeric characters,
                      underscore (_), pipe (|), or dot (.) and will be used to identify this beneficiary in future transactions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4 mt-0.5 flex-shrink-0">
                    <span className="text-emerald-700 font-bold text-xs">2</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Choose Payment Method</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Select one payment method: Either provide a UPI VPA address or complete both Bank Account Number and IFSC code.
                      At least one payment method is required for beneficiary creation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4 mt-0.5 flex-shrink-0">
                    <span className="text-emerald-700 font-bold text-xs">3</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Validate & Submit</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Review all entered information, then click &quot;Add Beneficiary&quot; to register with Cashfree.
                      The system will validate the data and provide feedback on the registration status.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4 mt-0.5 flex-shrink-0">
                    <span className="text-emerald-700 font-bold text-xs">4</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Use in Payouts</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Once successfully registered, use the Beneficiary ID in your payout API calls.
                      The beneficiary will be available for instant transfers through Cashfree&apos;s network.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-amber-50 rounded-xl shadow-lg border border-amber-200 p-3 sm:p-4 md:p-6">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-amber-900 mb-3 sm:mb-4 flex items-center">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                Important Notes
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-amber-200 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-amber-800 font-bold text-xs">!</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                    <strong>Beneficiary ID Uniqueness:</strong> Each beneficiary ID must be unique across your Cashfree account.
                    Use descriptive IDs for better organization.
                  </p>
                </div>

                <div className="flex items-start">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-amber-200 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-amber-800 font-bold text-xs">!</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                    <strong>Bank Details Validation:</strong> Ensure bank account numbers and IFSC codes are accurate.
                    Incorrect details may cause payout failures.
                  </p>
                </div>

                <div className="flex items-start">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-amber-200 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-amber-800 font-bold text-xs">!</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                    <strong>Test Environment:</strong> This interface uses Cashfree&apos;s sandbox environment.
                    Switch to production credentials for live transactions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Spacer for full height utilization */}
          <div className="flex-grow min-h-[2rem] sm:min-h-[3rem] md:min-h-[4rem]"></div>
        </div>
      </div>
    </div>
  )
}