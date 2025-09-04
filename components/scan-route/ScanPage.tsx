'use client'

import { useState, useEffect, useRef } from 'react'
import { QrCode, Camera, Wallet, CheckCircle, AlertCircle, Play, Square } from 'lucide-react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

export default function ScanPage() {
    const [isVisible, setIsVisible] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [scanResult, setScanResult] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)

    const videoRef = useRef<HTMLVideoElement>(null)
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

    useEffect(() => {
        setIsVisible(true)

        return () => {
            stopScanning()
        }
    }, [])

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
                setScanResult(result.getText())
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
        stopScanning()
    }

    return (
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
                                                    {scanResult}
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
        </div>
    )
}
