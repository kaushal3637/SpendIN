'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { addBeneficiary, validateBeneficiaryData } from '@/lib/apis/beneficiary'
import { BeneficiaryRequest } from '@/types/api-helper'

interface BeneficiaryFormProps {
  onSuccess?: () => void;
}

export default function BeneficiaryForm({ onSuccess }: BeneficiaryFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [beneficiaryData, setBeneficiaryData] = useState({
    name: '',
    vpa: ''
  })

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

      if (result.success) {
        toast.success("Beneficiary added successfully");
        // Reset form on success
        setBeneficiaryData({
          name: '',
          vpa: ''
        });
        onSuccess?.();
      }
    } catch {
      toast.error("Failed to add beneficiary");
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
  )
}
