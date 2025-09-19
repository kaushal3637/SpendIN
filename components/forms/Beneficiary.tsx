'use client'

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import {
    addBeneficiary,
    getEmptyBeneficiaryData,
} from "@/api-helpers/beneficiary";
import { BeneficiaryAPIError, BeneficiaryRequest } from "@/types/api-helpers/beneficiary";

export default function Beneficiary() {
    const [isLoading, setIsLoading] = useState(false);

    const [beneficiaryData, setBeneficiaryData] = useState<BeneficiaryRequest>(
        getEmptyBeneficiaryData()
    );

    const handleAddBeneficiary = async () => {
        setIsLoading(true)

        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const result = await addBeneficiary(beneficiaryData);

            toast.success("Beneficiary added successfully");

            // Reset form on success
            setBeneficiaryData(getEmptyBeneficiaryData());
        } catch (error) {
            const errorMessage = error instanceof BeneficiaryAPIError
                ? error.message
                : 'Failed to add beneficiary';

            toast.error(errorMessage);
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
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
                            placeholder="SPENDIN1234"
                            value={beneficiaryData.beneficiary_id}
                            onChange={(e) => setBeneficiaryData({ ...beneficiaryData, beneficiary_id: e.target.value })}
                            className="w-full px-3 sm:px-4 py-3 sm:py-3 text-base border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors touch-manipulation min-h-[48px]"
                            disabled={isLoading}
                            maxLength={50}
                        />
                        <p className="mt-1 text-xs sm:text-sm text-slate-500">
                            Use alphanumeric characters only.
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
                            placeholder="SpendIN ICICI"
                            value={beneficiaryData.beneficiary_name}
                            onChange={(e) => setBeneficiaryData({ ...beneficiaryData, beneficiary_name: e.target.value })}
                            className="w-full px-3 sm:px-4 py-3 sm:py-3 text-base border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors touch-manipulation min-h-[48px]"
                            disabled={isLoading}
                            maxLength={100}
                        />
                        <p className="mt-1 text-xs sm:text-sm text-slate-500">
                            Name of the beneficiary. Use alphabets and spaces only.
                        </p>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3 sm:space-y-4 md:space-y-6">
                        {/* UPI Section */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                            <h4 className="text-sm sm:text-base font-semibold text-slate-700 flex items-center">
                                UPI ID <span className="text-red-500 ml-1">*</span>
                            </h4>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded self-start sm:self-auto">Required</span>
                        </div>
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="spedninindia@icici"
                                value={beneficiaryData.vpa}
                                onChange={(e) => setBeneficiaryData({ ...beneficiaryData, vpa: e.target.value })}
                                className="w-full px-3 sm:px-4 py-3 sm:py-3 text-base border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors touch-manipulation min-h-[48px]"
                                disabled={isLoading}
                                maxLength={50}
                            />
                            <p className="text-xs sm:text-sm text-slate-500">
                                Use alphanumeric, period (.), hyphen (-), underscore (_) and at (@).
                            </p>
                        </div>

                        {/* Bank Transfer Section */}
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
                    </div>

                    {/* Add Beneficiary Button */}
                    <button
                        onClick={handleAddBeneficiary}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 sm:px-6 py-4 sm:py-4 rounded-lg font-semibold text-base hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[56px]"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
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
        </>
    )
}