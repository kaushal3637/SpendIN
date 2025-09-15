import React, { useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { QrCode, Camera, Play, Square, AlertCircle } from 'lucide-react'
import { QrScanningService } from '@/services/qr-service'
import { ScanningState } from '@/types/qr-service.types'
import { QrScannerRef, QrScannerProps } from '@/types/qr-service.types'

const QrScanner = forwardRef<QrScannerRef, QrScannerProps>(({
    isWalletConnected,
    onConnectWallet,
    onQrDetected,
    onError,
    onScanningStateChange,
    className = ""
}, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const qrServiceRef = useRef<QrScanningService | null>(null)
    const [scanningState, setScanningState] = React.useState<ScanningState>({
        isScanning: false,
        hasPermission: null,
        error: null,
        scanResult: null,
        isLoading: false
    })

    // Initialize QR service
    useEffect(() => {
        // Only create service if it doesn't exist
        if (!qrServiceRef.current) {
            qrServiceRef.current = new QrScanningService({
                onQrDetected,
                onError,
                onStateChange: (updates: Partial<ScanningState>) => {
                    setScanningState(prev => ({ ...prev, ...updates }))
                }
            })
        }

        return () => {
            if (qrServiceRef.current) {
                qrServiceRef.current.dispose()
                qrServiceRef.current = null
            }
        }
    }, [onQrDetected, onError])

    // Notify parent when scanning state changes
    React.useEffect(() => {
        if (onScanningStateChange && qrServiceRef.current) {
            onScanningStateChange(scanningState)
        }
    }, [scanningState, onScanningStateChange])

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        toggleScanning: async () => {
            if (qrServiceRef.current && videoRef.current) {
                await qrServiceRef.current.toggleScanning(videoRef.current)
            }
        },
        reset: () => {
            if (qrServiceRef.current) {
                qrServiceRef.current.reset()
            }
        },
        getScanningState: () => scanningState
    }))

    const handleScanAgain = async () => {
        if (qrServiceRef.current && videoRef.current) {
            await qrServiceRef.current.resetAndRestart(videoRef.current)
        }
    }

    return (
        <div className={`relative w-full max-w-[85vw] sm:max-w-sm md:max-w-md mx-auto ${className}`}>
            {/* Scanner Frame */}
            <div className="relative bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border-2 border-emerald-200 p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
                {/* Video Element for Camera Feed */}
                <div className={`relative bg-slate-900 rounded-lg overflow-hidden ${scanningState.isScanning ? 'border-2 border-emerald-300' : 'border-0'}`}>
                    <video
                        ref={videoRef}
                        className="w-full h-48 sm:h-56 md:h-64 lg:h-80 object-cover"
                        playsInline
                        muted
                        style={{
                            display: scanningState.isScanning ? 'block' : 'none'
                        }}
                    />

                    {/* Placeholder when not scanning */}
                    {!scanningState.isScanning && !scanningState.scanResult && !scanningState.error && (
                        <div className="w-full h-48 sm:h-56 md:h-64 lg:h-80 flex items-center justify-center bg-slate-50">
                            <div className="text-center p-4">
                                {!isWalletConnected ? (
                                    <>
                                        <Camera className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-blue-500 mx-auto mb-3 sm:mb-4" />
                                        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-700 mb-2">
                                            Wallet Required
                                        </h3>
                                        <p className="text-xs sm:text-sm md:text-base text-slate-500 px-2">
                                            Connect your wallet to start scanning QR codes
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Camera className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-slate-400 mx-auto mb-3 sm:mb-4" />
                                        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-700 mb-2">
                                            Camera Ready
                                        </h3>
                                        <p className="text-xs sm:text-sm md:text-base text-slate-500 px-2">
                                            Click start to begin scanning
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Scan Result Display - Overlay on top of video */}
                    {scanningState.scanResult && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 rounded-lg">
                            <div className="w-full max-h-full overflow-auto">
                                {scanningState.isLoading ? (
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                        <p className="text-slate-600">Processing QR data...</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">
                                            QR Code Scanned!
                                        </h3>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error Display - Overlay on top of video */}
                    {scanningState.error && (
                        <div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm flex items-center justify-center p-4 rounded-lg">
                            <div className="text-center">
                                <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-600 mx-auto mb-4" />
                                <h3 className="text-lg sm:text-xl font-semibold text-red-800 mb-2">
                                    Scanning Error
                                </h3>
                                <p className="text-sm sm:text-base text-red-700 mb-4">
                                    {scanningState.error}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Control Buttons */}
                <div className="mt-3 sm:mt-4 flex gap-2 sm:gap-3 justify-center px-2">
                    {!scanningState.scanResult && !scanningState.error && (
                        <button
                            onClick={async () => {
                                if (!isWalletConnected) {
                                    onConnectWallet()
                                } else if (scanningState.hasPermission === false) {
                                    // Request permission through service
                                    if (qrServiceRef.current) {
                                        await qrServiceRef.current.requestCameraPermission()
                                    }
                                } else {
                                    // Toggle scanning
                                    if (qrServiceRef.current && videoRef.current) {
                                        await qrServiceRef.current.toggleScanning(videoRef.current)
                                    }
                                }
                            }}
                            disabled={scanningState.hasPermission === false && isWalletConnected}
                            className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-2 rounded-full font-medium transition-all duration-200 text-sm sm:text-base touch-manipulation min-h-[44px] ${scanningState.isScanning
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : !isWalletConnected
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : scanningState.hasPermission === false
                                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                } disabled:bg-slate-400 disabled:cursor-not-allowed`}
                        >
                            {scanningState.isScanning ? (
                                <>
                                    <Square className="w-4 h-4" />
                                    Stop
                                </>
                            ) : !isWalletConnected ? (
                                <>
                                    <Camera className="w-4 h-4" />
                                    Connect Wallet
                                </>
                            ) : scanningState.hasPermission === false ? (
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

                    {(scanningState.scanResult || scanningState.error) && (
                        <button
                            onClick={handleScanAgain}
                            className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium transition-all duration-200 text-sm sm:text-base touch-manipulation min-h-[44px]"
                        >
                            <QrCode className="w-4 h-4" />
                            Scan Again
                        </button>
                    )}
                </div>

                {/* Permission Status */}
                <div className="mt-4 text-center">
                    {scanningState.hasPermission === false && (
                        <div className="space-y-2">
                            <p className="text-xs sm:text-sm text-red-600">
                                Camera access denied. Please allow camera access to continue.
                            </p>
                        </div>
                    )}
                    {scanningState.hasPermission === null && !scanningState.scanResult && !scanningState.error && (
                        <p className="text-xs sm:text-sm text-slate-500">
                            Camera access will be requested when you start scanning.
                        </p>
                    )}
                    {scanningState.hasPermission === true && !scanningState.scanResult && !scanningState.error && (
                        <p className="text-xs sm:text-sm text-green-600">
                            Camera access granted ✓
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
})

QrScanner.displayName = 'QrScanner'

export default QrScanner