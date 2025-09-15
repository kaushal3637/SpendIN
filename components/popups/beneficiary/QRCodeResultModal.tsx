'use client'

import { useState } from 'react'
import { X, Copy, AlertCircle, QrCode, Share } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { QRCodeResponse } from '@/types/api-helper'

interface QRCodeResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrResult: QRCodeResponse | null;
}

export default function QRCodeResultModal({ isOpen, onClose, qrResult }: QRCodeResultModalProps) {
  const [imageLoading, setImageLoading] = useState(true);

  if (!isOpen || !qrResult) return null;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  // Extract QR code data from nested structure
  const qrCodeData = qrResult.data?.data;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${qrResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              {qrResult.success ? (
                <QrCode className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                QR Code Result
              </h2>
              <p className="text-sm text-gray-600">
                {qrResult.success ? 'Successfully generated' : 'Generation failed'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {qrResult.success && qrCodeData ? (
            <div className="space-y-6">

              {/* QR Code Display */}
              <div className="flex justify-center">
                <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-lg">
                  <div className="relative">
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                      </div>
                    )}
                    <Image
                      src={qrCodeData.qrCodeUrl}
                      alt="UPI QR Code"
                      width={256}
                      height={256}
                      className="w-64 h-64"
                      unoptimized={true}
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageLoading(false);
                        toast.error('Failed to load QR code image');
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* QR Code Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">QR Code Details</h3>
                  <div className="space-y-3">
                    {qrCodeData.amount && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm font-semibold text-green-600">
                          ₹{qrCodeData.amount.toFixed(2)}
                        </div>
                      </div>
                    )}

                    {qrCodeData.purpose && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Purpose</label>
                        <div className="mt-1 p-3 bg-gray-50 text-gray-700 rounded-lg text-sm">
                          {qrCodeData.purpose}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - UPI String */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">UPI String</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Complete Payment String
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <div className="font-mono text-xs break-all text-gray-800 max-h-32 overflow-y-auto">
                          {qrCodeData.upiString}
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(qrCodeData.upiString, 'UPI String')}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Payment String
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => window.open(qrCodeData.qrCodeUrl, '_blank')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <Share className="w-5 h-5" />
                  Open QR Image
                </button>
              </div>
            </div>
          ) : (
            /* Error State */
            <div className="space-y-6">
              <div className="flex items-center space-x-2 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800 font-medium">{qrResult.message}</p>
              </div>

              {qrResult.error && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Error Details:</h4>
                  <p className="text-sm text-gray-700">{qrResult.error}</p>
                </div>
              )}

              <div className="flex justify-center pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
