'use client'

import { useState, useEffect, useRef } from 'react'
import { QrCode, Camera, Wallet, CheckCircle, AlertCircle, Play, Square, X, Check, Banknote } from 'lucide-react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { ParsedQrResponse } from '@/types/upi.types'

export default function ScanPage() {
    const [isVisible, setIsVisible] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [scanResult, setScanResult] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const [parsedData, setParsedData] = useState<ParsedQrResponse | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [userAmount, setUserAmount] = useState<string>('')
    const [isConverting, setIsConverting] = useState(false)
    const [conversionResult, setConversionResult] = useState<{
      usdAmount: number;
      usdcAmount: number;
      exchangeRate: number;
      lastUpdated: string;
    } | null>(null)
    const [showConversionModal, setShowConversionModal] = useState(false)

    const videoRef = useRef<HTMLVideoElement>(null)
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

    useEffect(() => {
        setIsVisible(true)

        return () => {
            stopScanning()
        }
    }, [])

    // Force re-render when validation state changes
    useEffect(() => {
        // This ensures the component re-renders when parsedData or userAmount changes
        // which should update the disabled state of the confirm button
    }, [parsedData, userAmount])

    const requestCameraPermission = async (): Promise<boolean> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            })

            stream.getTracks().forEach(track => track.stop())

            setHasPermission(true)
            return true
        } catch (err) {
            console.error('Camera permission denied:', err)
            setHasPermission(false)
            return false
        }
    }

    const parseQrData = async (qrString: string): Promise<ParsedQrResponse | null> => {
        try {
            const response = await fetch('/api/scans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ qrData: qrString }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to parse QR data')
            }

            const data = await response.json()
            return data
        } catch (err) {
            console.error('Error parsing QR data:', err)
            setError(`Failed to parse QR data: ${err instanceof Error ? err.message : 'Unknown error'}`)
            return null
        }
    }


    const startScanning = async () => {
        if (!videoRef.current) return

        setError(null)
        setScanResult(null)

        // First, request camera permission
        console.log('Requesting camera permission...')
        const permissionGranted = await requestCameraPermission()

        if (!permissionGranted) {
            setError('Camera permission is required to scan QR codes. Please allow camera access and try again.')
            return
        }

        console.log('Camera permission granted, starting scan...')

        try {
            // Initialize the code reader
            if (!codeReaderRef.current) {
                codeReaderRef.current = new BrowserMultiFormatReader()
                console.log('Code reader initialized')
            }

            // Get available video devices and find the back camera
            const videoInputDevices = await codeReaderRef.current.listVideoInputDevices()
            console.log('Available video devices:', videoInputDevices)

            if (videoInputDevices.length === 0) {
                throw new Error('No camera devices found')
            }

            // Find the back camera (environment facing)
            let selectedDevice = videoInputDevices.find(device =>
                device.label.toLowerCase().includes('back') ||
                device.label.toLowerCase().includes('rear') ||
                device.label.toLowerCase().includes('environment')
            )

            // If no back camera found, try to find one without "front" in the name
            if (!selectedDevice) {
                selectedDevice = videoInputDevices.find(device =>
                    !device.label.toLowerCase().includes('front') &&
                    !device.label.toLowerCase().includes('user')
                )
            }

            // Fallback to first device if we can't identify back camera
            if (!selectedDevice) {
                selectedDevice = videoInputDevices[0]
            }

            const selectedDeviceId = selectedDevice.deviceId
            console.log('Selected camera:', selectedDevice.label)
            console.log('All available cameras:', videoInputDevices.map(d => d.label))

            // Alternative approach: Use ZXing's built-in camera selection with facing mode
            console.log('Attempting to scan with selected camera...')

            // Try the selected camera first, fallback to auto-selection if it fails
            let result
            try {
                result = await codeReaderRef.current.decodeOnceFromVideoDevice(selectedDeviceId, videoRef.current)
            } catch (deviceError) {
                console.log('Selected camera failed, trying auto-selection:', deviceError)
                // Fallback to auto-selection (ZXing will choose best camera)
                result = await codeReaderRef.current.decodeOnceFromVideoDevice(undefined, videoRef.current)
            }

            if (result) {
                console.log('QR Code detected:', result.getText())
                setIsLoading(true)
                setScanResult(result.getText())

                // Parse the QR data using the API
                const parsed = await parseQrData(result.getText())
                setIsLoading(false)

                if (parsed) {
                    setParsedData(parsed)
                    setShowModal(true)
                }

                setIsScanning(false)
                stopScanning()
            }
        } catch (err) {
            if (err instanceof NotFoundException) {
                console.log('No QR code found, continuing to scan...')
                // Continue scanning if no QR code found
                if (isScanning) {
                    setTimeout(() => startScanning(), 500)
                }
            } else {
                console.error('QR scanning error:', err)
                setError(`Camera error: ${err instanceof Error ? err.message : 'Unknown error'}`)
                setIsScanning(false)
                stopScanning()
            }
        }
    }

    const stopScanning = () => {
        if (codeReaderRef.current) {
            codeReaderRef.current.reset()
            codeReaderRef.current = null
        }
        setIsScanning(false)
    }

    const toggleScanning = async () => {
        if (isScanning) {
            stopScanning()
        } else {
            // If permission was previously denied, try to request it again
            if (hasPermission === false) {
                setError(null)
                setScanResult(null)
                const permissionGranted = await requestCameraPermission()
                if (permissionGranted) {
                    setIsScanning(true)
                    await startScanning()
                }
            } else {
                setIsScanning(true)
                await startScanning()
            }
        }
    }

    const resetScan = () => {
        setScanResult(null)
        setError(null)
        setIsScanning(false)
        setParsedData(null)
        setShowModal(false)
        setIsLoading(false)
        setUserAmount('')
        setConversionResult(null)
        setShowConversionModal(false)
        stopScanning()
    }

    const convertInrToUsdc = async (inrAmount: number) => {
        try {
            setIsConverting(true)
            setConversionResult(null)

            const response = await fetch('/api/conversion/inr-to-usd', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount: inrAmount }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to convert currency')
            }

            const data = await response.json()
            setConversionResult(data)
            return data
        } catch (err) {
            console.error('Error converting INR to USDC:', err)
            throw err
        } finally {
            setIsConverting(false)
        }
    }

    // Check if currency is supported (only INR allowed)
    const isCurrencySupported = (currency?: string): boolean => {
        const normalizedCurrency = (currency || 'INR').toUpperCase()
        return normalizedCurrency === 'INR'
    }

    // Check if amount is valid (max 25000)
    const isAmountValid = (amount?: string): boolean => {
        if (!amount) return false
        const numAmount = parseFloat(amount)
        return !isNaN(numAmount) && numAmount > 0 && numAmount <= 25000
    }

    // Get currency validation error message
    const getCurrencyError = (currency?: string): string | null => {
        if (!isCurrencySupported(currency)) {
            return `Unsupported currency: ${currency || 'Unknown'}. This platform only supports INR (Indian Rupees).`
        }
        return null
    }

    // Get amount validation error message
    const getAmountError = (amount?: string): string | null => {
        if (!amount) return 'Amount is required'
        const numAmount = parseFloat(amount)
        if (isNaN(numAmount) || numAmount <= 0) return 'Amount must be a positive number'
        if (numAmount > 25000) return 'Amount cannot exceed ₹25,000'
        return null
    }


    return (
        <>
        <div className="min-h-screen bg-transparent">

            <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                {/* Main Content */}
                <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
                    <div className="max-w-2xl mx-auto text-center">
                        {/* Header */}
                        <div className="mb-6 sm:mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 mb-4 sm:mb-6">
                                <QrCode className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
                                Scan Merchant QR
                            </h1>
                            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-xl mx-auto px-4">
                                Scan the merchant&apos;s QR to start payment.
                            </p>
                        </div>

                        {/* QR Scanner */}
                        <div className="mb-8 sm:mb-12">
                            <div className="relative max-w-md mx-auto">
                                {/* Scanner Frame */}
                                <div className="relative bg-white rounded-2xl shadow-lg border-2 border-emerald-200 p-6 sm:p-8 overflow-hidden">
                                    {/* Video Element for Camera Feed */}
                                    <div className="relative bg-slate-900 rounded-lg overflow-hidden border-2 border-emerald-300">
                                        <video
                                            ref={videoRef}
                                            className={`w-full h-64 sm:h-80 object-cover ${!isScanning ? 'hidden' : ''}`}
                                            playsInline
                                            muted
                                        />

                                        {/* Placeholder when not scanning */}
                                        {!isScanning && !scanResult && !error && (
                                            <div className="w-full h-64 sm:h-80 flex items-center justify-center bg-slate-50">
                                                <div className="text-center">
                                                    <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-4" />
                                                    <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">
                                                        Camera Ready
                                                    </h3>
                                                    <p className="text-sm sm:text-base text-slate-500">
                                                        Click start to begin scanning
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Scan Result Display */}
                                        {scanResult && (
                                            <div className="absolute inset-0 bg-white flex items-center justify-center p-4">
                                                <div className="w-full h-full">
                                                    {isLoading ? (
                                                        <div className="text-center">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                                            <p className="text-slate-600">Processing QR data...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="text-left text-sm">
                                                            <p className="font-medium mb-2">Raw QR Data:</p>
                                                            <p className="text-slate-600 break-all">{scanResult}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Error Display */}
                                        {error && (
                                            <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
                                                <div className="text-center p-4">
                                                    <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-600 mx-auto mb-4" />
                                                    <h3 className="text-lg sm:text-xl font-semibold text-red-800 mb-2">
                                                        Scanning Error
                                                    </h3>
                                                    <p className="text-sm sm:text-base text-red-700">
                                                        {error}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Control Buttons */}
                                    <div className="mt-4 flex gap-3 justify-center">
                                        {!scanResult && !error && (
                                            <button
                                                onClick={toggleScanning}
                                                disabled={hasPermission === false}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${isScanning
                                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                                    : hasPermission === false
                                                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                    } disabled:bg-slate-400 disabled:cursor-not-allowed`}
                                            >
                                                {isScanning ? (
                                                    <>
                                                        <Square className="w-4 h-4" />
                                                        Stop
                                                    </>
                                                ) : hasPermission === false ? (
                                                    <>
                                                        <Camera className="w-4 h-4" />
                                                        Request Permission
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="w-4 h-4" />
                                                        Start Scan
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {(scanResult || error) && (
                                            <button
                                                onClick={resetScan}
                                                className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-full font-medium transition-all duration-200"
                                            >
                                                <QrCode className="w-4 h-4" />
                                                Scan Again
                                            </button>
                                        )}
                                    </div>

                                    {/* Permission Status */}
                                    <div className="mt-4 text-center">
                                        {hasPermission === false && (
                                            <div className="space-y-2">
                                                <p className="text-xs sm:text-sm text-red-600">
                                                    Camera access denied. Please allow camera access to continue.
                                                </p>
                                            </div>
                                        )}
                                        {hasPermission === null && (
                                            <p className="text-xs sm:text-sm text-slate-500">
                                                Camera access will be requested when you start scanning.
                                            </p>
                                        )}
                                        {hasPermission === true && (
                                            <p className="text-xs sm:text-sm text-green-600">
                                                Camera access granted ✓
                                            </p>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Next Steps */}
                        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-emerald-100">
                            {scanResult ? (
                                <>
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                        <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
                                        <h3 className="text-lg sm:text-xl font-semibold text-slate-900">
                                            QR Code Scanned Successfully!
                                        </h3>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                        <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                                        <h3 className="text-lg sm:text-xl font-semibold text-slate-900">
                                            Wallet Connection Required
                                        </h3>
                                    </div>
                                    <p className="text-sm sm:text-base text-slate-600 mb-6 text-center">
                                        Connect your Web3 wallet & scan the merchant&apos;s QR to proceed with payment.
                                    </p>
                                    <div className="text-center">
                                        <p className="text-xs sm:text-sm text-slate-500 mb-4">
                                            Make sure your camera is enabled and pointed at the QR code
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showModal && parsedData && parsedData.data && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h3 className="text-xl font-bold text-slate-900">
                                Confirm Payment Details
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-4">
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
                                                    onChange={(e) => setUserAmount(e.target.value)}
                                                    placeholder="Enter amount (max ₹25,000)"
                                                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    min="1"
                                                    max="25000"
                                                    step="0.01"
                                                    disabled={!isCurrencySupported(parsedData.data.cu)}
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
                                {/* Show other validation errors */}
                                {/* {parsedData.errors && parsedData.errors.length > 0 && (
                                    <ul className="mt-2 text-sm text-red-700 space-y-1">
                                        {parsedData.errors.map((error, index) => (
                                            <li key={index}>• {error}</li>
                                        ))}
                                    </ul>
                                )} */}
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 p-6 border-t border-slate-200">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                key={`confirm-${parsedData?.data?.cu || 'no-currency'}-${userAmount}`}
                                onClick={async () => {
                                    try {
                                        const finalAmount = parseFloat(parsedData!.data!.am || userAmount)
                                        await convertInrToUsdc(finalAmount)
                                        setShowModal(false)
                                        setShowConversionModal(true)
                                    } catch (err) {
                                        console.error('Conversion failed:', err)
                                        // Could show error toast here
                                    }
                                }}
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                disabled={
                                    !parsedData ||
                                    !parsedData.isValid ||
                                    !parsedData.data ||
                                    !isCurrencySupported(parsedData.data.cu) ||
                                    (parsedData.data.am && !isAmountValid(parsedData.data.am)) ||
                                    (!parsedData.data.am && (!userAmount.trim() || !isAmountValid(userAmount))) ||
                                    isConverting
                                }
                            >
                                {isConverting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Converting...
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
            )}
        </div>

        {/* Conversion Modal */}
        {showConversionModal && parsedData && conversionResult && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900">
                            Payment Conversion
                        </h3>
                        <button
                            onClick={() => setShowConversionModal(false)}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 space-y-6">
                        {/* Conversion Result */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">$</span>
                                </div>
                                <span className="font-semibold text-blue-900">Currency Conversion Complete</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-700 font-medium">INR Amount:</span>
                                    <span className="font-mono text-blue-900 font-semibold text-lg">₹{parseFloat(parsedData!.data.am || userAmount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-700 font-medium">USDC Amount:</span>
                                    <span className="font-mono text-blue-900 font-bold text-xl">{conversionResult!.usdcAmount.toFixed(6)} USDC</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-700 text-sm">Exchange Rate:</span>
                                    <span className="font-mono text-blue-900 text-sm">1 USD = ₹{(1 / conversionResult!.exchangeRate).toFixed(2)}</span>
                                </div>
                                <div className="text-xs text-blue-600 mt-3 pt-3 border-t border-blue-200">
                                    Last updated: {new Date(conversionResult!.lastUpdated).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Banknote className="w-5 h-5 text-emerald-600" />
                                <span className="font-medium text-emerald-900">Payment Summary</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-emerald-700">Merchant:</span>
                                    <span className="font-medium text-emerald-900">{parsedData!.data.pn || 'Unknown Merchant'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-emerald-700">UPI ID:</span>
                                    <span className="font-mono text-emerald-900">{parsedData!.data.pa}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-emerald-700">You Pay:</span>
                                    <span className="font-bold text-emerald-900">{conversionResult!.usdcAmount.toFixed(6)} USDC</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex gap-3 p-6 border-t border-slate-200">
                        <button
                            onClick={() => setShowConversionModal(false)}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                setShowConversionModal(false)
                                // Here you can add logic to proceed with the USDC payment
                                const finalAmount = parsedData!.data.am || userAmount
                                console.log('Payment confirmed with USDC data:', {
                                    ...parsedData,
                                    finalInrAmount: finalAmount,
                                    usdcAmount: conversionResult!.usdcAmount,
                                    exchangeRate: conversionResult!.exchangeRate
                                })
                            }}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Banknote className="w-4 h-4" />
                            Proceed with Payment
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}
