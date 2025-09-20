'use client'

import { useState } from "react";
import { QrCode } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { generateQRCode } from "@/api-helpers/qr-generate"
import { QRCodeResponse } from "@/types/api-helpers/qr-generation";

export default function QRCodeForm() {

    const [isError, setIsError] = useState('')
    const [qrCodeData, setQrCodeData] = useState({
        beneficiaryId: '',
        amount: '',
        purpose: '',
        remarks: ''
    })

    const [qrResult, setQrResult] = useState<QRCodeResponse | null>(null)

    const [isGeneratingQr, setIsGeneratingQr] = useState(false)

    const generateQrCode = async () => {
        // Reset previous result
        setQrResult(null)

        // Validate required fields
        if (!qrCodeData.beneficiaryId) {
            setIsError('Beneficiary ID is required')
            toast.error(`${isError}`)
            return
        }

        setIsGeneratingQr(true)

        try {

            const requestData = {
                beneficiaryId: qrCodeData.beneficiaryId,
                amount: qrCodeData.amount ? parseFloat(qrCodeData.amount) : undefined,
                purpose: qrCodeData.purpose || undefined,
                remarks: qrCodeData.remarks || undefined,
            };

            const result = await generateQRCode(requestData);

            setQrResult(result);

            toast.success('QR code generated successfully')

            // Reset form on success (keep beneficiary ID for convenience)
            setQrCodeData(prev => ({
                ...prev,
                amount: '',
                purpose: '',
                remarks: ''
            }))
        } catch (error) {
            toast.error("Fail to generate QR Code")
            setQrResult({
                success: false,
                message: `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error: error instanceof Error ? error.message : 'Unknown error'
            })
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
                {/* Beneficiary ID */}
                <div>
                    <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-2">
                        Beneficiary ID
                    </label>
                    <input
                        type="text"
                        placeholder="SPENDIN1234"
                        value={qrCodeData.beneficiaryId}
                        onChange={(e) => setQrCodeData({ ...qrCodeData, beneficiaryId: e.target.value })}
                        className="w-full px-3 sm:px-4 py-3 sm:py-3 text-base border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors touch-manipulation min-h-[48px]"
                        disabled={isGeneratingQr}
                    />
                </div>

                {/* Fields */}
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
                    disabled={isGeneratingQr || !qrCodeData.beneficiaryId.trim()}
                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 sm:px-6 py-4 sm:py-4 rounded-lg font-semibold text-base hover:from-teal-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[56px]"
                >
                    {isGeneratingQr ? (
                        <div className="flex items-center justify-center">
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
                            <span className="text-sm sm:text-base ml-2">Generating QR Code...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            <QrCode className="w-5 h-5 inline mr-2 flex-shrink-0" />
                            <span className="text-sm sm:text-base">Generate QR Code</span>
                        </div>
                    )}
                </button>
            </div>
            {qrResult && (
                <>
                    {qrResult.success && qrResult.qrCode && qrResult.qrCode.qrCodeUrl && (
                        <div className="space-y-4">
                            <div className="text-center text-gray-800 font-bold underline">QR Code Result</div>
                            {/* QR Code Display */}
                            <div className=" flex justify-center bg-white p-4">
                                <Image
                                    src={qrResult.qrCode.qrCodeUrl}
                                    alt="UPI QR Code"
                                    width={224}
                                    height={224}
                                    className="w-48 sm:w-56 h-70"
                                    unoptimized={true}
                                />
                            </div>
                        </div>
                    )}
                    {qrResult.success === false && (
                        <p>QR Code Generation Failed</p>
                    )}
                </>
            )}

        </div>
    )
}