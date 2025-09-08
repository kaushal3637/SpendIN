'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { QrCode, Wallet, CheckCircle, AlertCircle, X, Check, Banknote, ArrowBigRight, DollarSign } from 'lucide-react'
import { ParsedQrResponse } from '@/types/upi.types'
import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth'
import { USDC_CONTRACT_ADDRESSES, TREASURY_ADDRESS } from '@/config/constant'
import { prepareUSDCMetaTransaction } from '@/lib/abstractionkit'
import { useWallet } from '@/context/WalletContext'
import { isValidChainId, getChainInfo } from '@/lib/chain-validation'
import { ethers } from 'ethers'
import Confetti from 'react-confetti'
import { ScanningState } from '@/types/qr-service.types'
import QrScanner from '@/components/scan-route/services/QrScanner'
import { QrScannerRef } from '@/types/qr-service.types'
import { checkUSDCBalance } from '@/lib/helpers/usdc-balance-checker'


export default function ScanPage() {
    const { authenticated } = usePrivy()
    const { wallets } = useWallets()
    const wallet = wallets[0]
    const { login } = useLogin()
    const isWalletConnected = authenticated
    const { connectedChain } = useWallet()

    const [isVisible, setIsVisible] = useState(false)
    const [parsedData, setParsedData] = useState<ParsedQrResponse | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [userAmount, setUserAmount] = useState<string>('')
    const [isConverting, setIsConverting] = useState(false)
    const [conversionResult, setConversionResult] = useState<{
        usdAmount: number;
        usdcAmount: number;
        exchangeRate: number;
        lastUpdated: string;
        networkFee: number;
        networkName: string;
        totalUsdcAmount: number;
    } | null>(null)
    const [showConversionModal, setShowConversionModal] = useState(false)
    const [showReason, setShowReason] = useState(false)
    const [storedTransactionId, setStoredTransactionId] = useState<string | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars
    const [usdcBalance, setUsdcBalance] = useState<string>('0')
    const [isCheckingBalance, setIsCheckingBalance] = useState(false)
    const [balanceError, setBalanceError] = useState<string | null>(null)
    const [isProcessingPayment, setIsProcessingPayment] = useState(false)
    const [paymentStep, setPaymentStep] = useState<string>('')
    const [isTestMode, setIsTestMode] = useState(false)
    const [paymentResult, setPaymentResult] = useState<{
        success: boolean;
        transactionHash?: string;
        upiPaymentId?: string;
        error?: string;
        status: string;
    } | null>(null)
    const [payoutResult, setPayoutResult] = useState<{
        success: boolean;
        payout?: {
            transferId: string;
            amount: number;
            status: string;
            message: string;
        };
        error?: string;
    } | null>(null)
    const [beneficiaryDetails, setBeneficiaryDetails] = useState<{
        beneficiary_id?: string;
        beneficiary_name?: string;
        beneficiary_email?: string;
        beneficiary_phone?: string;
        beneficiary_instrument_details?: {
            vpa?: string;
            bank_account_number?: string;
            bank_ifsc?: string;
        };
        beneficiary_contact_details?: {
            beneficiary_email?: string;
            beneficiary_phone?: string;
        };
    } | null>(null)
    const [showConfetti, setShowConfetti] = useState(false)

    // QR Service State
    const [scanningState, setScanningState] = useState<ScanningState>({
        isScanning: false,
        hasPermission: null,
        error: null,
        scanResult: null,
        isLoading: false
    })

    const qrScannerRef = useRef<QrScannerRef>(null)

    // Function to check if scanned QR belongs to a test customer and trigger payout
    const handleCustomerPayout = useCallback(async (upiId: string) => {
        try {
            setPayoutResult(null)

            // Extract customer identifier from UPI ID (for test customers)
            // This is a simplified approach - in production you'd have a proper lookup
            const customerIdentifier = upiId.split('@')[0]

            // Try to find customer by UPI ID or name
            const response = await fetch('/api/payouts/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerId: customerIdentifier, // This might need adjustment based on your customer ID format
                    amount: parseFloat(userAmount),
                    remarks: `Auto payout triggered by QR scan - ${upiId}`,
                }),
            })

            const data = await response.json()
            setPayoutResult(data)

            if (data.success) {
                console.log('Auto payout successful:', data.payout.transferId)
            } else {
                console.error('Auto payout failed:', data.error || data.payout.message)
            }

        } catch (error) {
            console.error('Error processing auto payout:', error)
            setPayoutResult({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    }, [userAmount])

    // Initialize component
    useEffect(() => {
        setIsVisible(true)
    }, [])

    // Force re-render when validation state changes
    useEffect(() => {
        // This ensures the component re-renders when parsedData or userAmount changes
        // which should update the disabled state of the confirm button
    }, [parsedData, userAmount])

    // QR Service Methods
    const resetScan = () => {
        // Reset QR scanner component
        if (qrScannerRef.current) {
            qrScannerRef.current.reset()
        }

        // Reset component state
        setParsedData(null)
        setShowModal(false)
        setUserAmount('')
        setConversionResult(null)
        setShowConversionModal(false)
        setShowReason(false)
        setPayoutResult(null)
        setBeneficiaryDetails(null)
        setShowConfetti(false)
        setPaymentResult(null)
        setStoredTransactionId(null)
    }

    // Function to update transaction with payment details
    // Updated to include chain validation and use chain ID from WalletContext
    const updateTransactionWithPayment = async (
        transactionId: string,
        txnHash: string,
        isSuccess: boolean,
        walletAddress?: string
    ) => {
        try {
            const response = await fetch('/api/update-upi-transaction', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transactionId,
                    txnHash,
                    isSuccess,
                    walletAddress
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update transaction')
            }

            const result = await response.json()
            console.log('Transaction updated successfully:', result)
            return true
        } catch (error) {
            console.error('Error updating transaction:', error)
            return false
        }
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
                body: JSON.stringify({
                    amount: inrAmount,
                    chainId: 421614 // Default to Arbitrum Sepolia, can be made dynamic later
                }),
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

    // Check USDC balance using helper function
    const checkUSDCBalanceLocal = useCallback(async (requiredAmount: number) => {
        if (!wallet || !conversionResult) return false

        try {
            setIsCheckingBalance(true)
            setBalanceError(null)

            // Use the helper function to check balance
            const result = await checkUSDCBalance(wallet, requiredAmount, connectedChain || undefined)

            // Update local state with the result
            setUsdcBalance(result.balance)
            if (result.error) {
                setBalanceError(result.error)
            }

            return result.hasSufficientBalance

        } catch (error) {
            console.error('Error checking USDC balance:', error)
            setBalanceError(error instanceof Error ? error.message : 'Failed to check USDC balance')
            return false
        } finally {
            setIsCheckingBalance(false)
        }
    }, [wallet, conversionResult, connectedChain])

    // Function to load test data for development
    const loadTestData = async () => {
        console.log('Loading test data...')

        // Use the beneficiary with UPI ID from your dashboard
        const beneficiaryId = '1492218328b3o0m39jsCfkjeyFVBKdreP1'

        // Fetch beneficiary details from Cashfree
        const response = await fetch(`/api/cashfree-beneficiary/${beneficiaryId}`)
        if (!response.ok) {
            throw new Error('Failed to fetch beneficiary details')
        }

        const beneficiaryData = await response.json()
        const beneficiary = beneficiaryData.beneficiary

        // Store beneficiary details for display
        setBeneficiaryDetails(beneficiary)

        // Get UPI ID from beneficiary instrument details
        const upiId = beneficiary?.beneficiary_instrument_details?.vpa || 'success@upi'

        // Create test QR data using the beneficiary's UPI ID
        const testParsedData: ParsedQrResponse = {
            qrType: 'dynamic_merchant',
            isValid: true,
            data: {
                pa: upiId,
                pn: beneficiary?.beneficiary_name || 'Test Bene',
                am: '10.00', // Test amount
                cu: 'INR',
                mc: '1234',
                tr: `TXN${Date.now()}`
            }
        }

        // Generate QR string
        const qrString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(testParsedData.data.pn || 'Test Bene')}&am=${testParsedData.data.am}&cu=${testParsedData.data.cu}&mc=${testParsedData.data.mc}&tr=${testParsedData.data.tr}` // eslint-disable-line @typescript-eslint/no-unused-vars

        setParsedData(testParsedData)

        // Update scanning service state
        if (qrScannerRef.current) {
            qrScannerRef.current.reset()
            // Simulate scan result for testing
            setScanningState(prev => ({
                ...prev,
                scanResult: 'upi://pay?pa=merchant@paytm&pn=Test%20Merchant%20Store&am=850.00&cu=INR&mc=1234&tr=TXN123456789',
                error: null
            }))
        }

        setIsTestMode(true)
        setShowModal(true)
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

    // Check USDC balance when conversion modal opens
    useEffect(() => {
        if (showConversionModal && conversionResult && wallet) {
            checkUSDCBalanceLocal(conversionResult.totalUsdcAmount)
        }
    }, [showConversionModal, conversionResult, wallet, checkUSDCBalanceLocal])

    return (
        <>
            {/* Confetti Animation */}
            {showConfetti && (
                <Confetti
                    width={window.innerWidth}
                    height={window.innerHeight}
                    recycle={false}
                    numberOfPieces={500}
                    gravity={0.3}
                />
            )}

            <div className="min-h-screen bg-transparent">

                <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                    {/* Main Content */}
                    <div className="flex items-center justify-center px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12 min-h-[calc(100vh-4rem)]">
                        <div className="w-full max-w-[90vw] sm:max-w-sm md:max-w-md lg:max-w-2xl mx-auto text-center">
                            {/* Header */}
                            <div className="mb-6 sm:mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 mb-4 sm:mb-6">
                                    <QrCode className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                </div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 mb-3 sm:mb-4 leading-tight">
                                    Pay Smarter with QR
                                </h1>
                                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-xs sm:max-w-sm md:max-w-xl mx-auto px-2 sm:px-4 leading-relaxed">
                                    {isWalletConnected
                                        ? "Scan the payer's QR to start payment."
                                        : "Connect your wallet to start scanning QR codes for payment."
                                    }
                                </p>

                                {/* Chain Status Indicator */}
                                {isWalletConnected && connectedChain && (
                                    <div className="mt-4 text-center">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isValidChainId(connectedChain)
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {isValidChainId(connectedChain) ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span>{getChainInfo(connectedChain)?.name} Network</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>Unsupported Network (ID: {connectedChain})</span>
                                                </>
                                            )}
                                        </div>
                                        {!isValidChainId(connectedChain) && (
                                            <p className="text-xs text-red-600 mt-1">
                                                Please switch to Arbitrum Sepolia or Sepolia network
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* QR Scanner */}
                            <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-12">
                                <QrScanner
                                    ref={qrScannerRef}
                                    isWalletConnected={isWalletConnected}
                                    onConnectWallet={login}
                                    onQrDetected={useCallback((qrData: string, parsedData: ParsedQrResponse) => {
                                        console.log('QR Code detected:', qrData)
                                        setParsedData(parsedData)

                                        // Log current beneficiary details state
                                        console.log('Current beneficiaryDetails state:', beneficiaryDetails)
                                        console.log('Parsed QR data UPI ID:', parsedData.data?.pa)

                                        // Check if this is a customer QR
                                        if (parsedData.data && userAmount) {
                                            handleCustomerPayout(parsedData.data.pa)
                                        }

                                        setShowModal(true)
                                    }, [beneficiaryDetails, userAmount, handleCustomerPayout])}
                                    onError={useCallback((error: string) => {
                                        console.error('QR scanning error:', error)
                                        // Error state is now managed by QrScanner component
                                    }, [])}
                                    onScanningStateChange={useCallback((state: ScanningState) => {
                                        setScanningState(prevState => {
                                            // Only update if state has actually changed to prevent unnecessary re-renders
                                            if (
                                                prevState.isScanning !== state.isScanning ||
                                                prevState.hasPermission !== state.hasPermission ||
                                                prevState.error !== state.error ||
                                                prevState.scanResult !== state.scanResult ||
                                                prevState.isLoading !== state.isLoading
                                            ) {
                                                return state
                                            }
                                            return prevState
                                        })
                                    }, [])}
                                />

                                {/* Test Button for Development */}
                                <div className="mt-4 text-center">
                                    <button
                                        onClick={loadTestData}
                                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors text-sm mx-auto"
                                        disabled={!isWalletConnected}
                                    >
                                        <QrCode className="w-4 h-4" />
                                        Load Cashfree Beneficiary
                                    </button>
                                    <p className="text-xs text-slate-500 mt-2">
                                        For development: Load verified Cashfree beneficiary with UPI ID
                                    </p>
                                </div>
                            </div>

                            {/* Payout Status */}
                            {payoutResult && (
                                <div className={`mb-4 sm:mb-6 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border p-3 sm:p-4 mx-2 sm:mx-0 ${payoutResult.success ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                                    }`}>
                                    <div className="flex items-center justify-center gap-3 mb-2">
                                        {payoutResult.success ? (
                                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                                        )}
                                        <h3 className={`text-base sm:text-lg font-semibold ${payoutResult.success ? 'text-green-900' : 'text-red-900'
                                            }`}>
                                            {payoutResult.success ? 'Auto Payout Successful!' : 'Auto Payout Failed'}
                                        </h3>
                                    </div>
                                    <div className="text-center space-y-1">
                                        {payoutResult.payout && (
                                            <>
                                                <p className={`text-sm ${payoutResult.success ? 'text-green-700' : 'text-red-700'}`}>
                                                    {payoutResult.payout.message}
                                                </p>
                                                {payoutResult.payout.transferId && (
                                                    <p className="text-xs text-gray-600 font-mono">
                                                        Transfer ID: {payoutResult.payout.transferId}
                                                    </p>
                                                )}
                                                {payoutResult.payout.amount && (
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Amount: ₹{payoutResult.payout.amount}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                        {payoutResult.error && (
                                            <p className="text-sm text-red-700">
                                                {payoutResult.error}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Payment Success Message */}
                            {paymentResult?.success && !showConversionModal && (
                                <div className="mb-4 sm:mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg sm:rounded-xl p-4 mx-2 sm:mx-0 shadow-lg">
                                    <div className="flex items-center justify-center gap-3 mb-2">
                                        <CheckCircle className="w-8 h-8 text-green-600 animate-pulse" />
                                        <h3 className="text-xl sm:text-2xl font-bold text-green-900">
                                            Payment Completed Successfully! 🎉
                                        </h3>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-green-800 font-medium">
                                            Your payment has been processed and INR has been sent to the merchant.
                                        </p>
                                        {paymentResult.transactionHash && (
                                            <p className="text-xs text-green-700 font-mono bg-green-100 px-2 py-1 rounded">
                                                TX: {paymentResult.transactionHash.substring(0, 10)}...{paymentResult.transactionHash.substring(paymentResult.transactionHash.length - 8)}
                                            </p>
                                        )}
                                        <button
                                            onClick={resetScan}
                                            className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                        >
                                            Scan Another QR
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Next Steps */}
                            <div className="bg-white/50 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 border border-emerald-100 mx-2 sm:mx-0">
                                {scanningState.scanResult ? (
                                    <>
                                        <div className="flex items-center justify-center gap-3">
                                            <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
                                            <h3 className="text-lg sm:text-xl font-semibold text-slate-900">
                                                QR Scanned Successfully!
                                            </h3>
                                        </div>
                                        {userAmount && (
                                            <p className="text-sm text-slate-600 mt-2">
                                                Auto payout {payoutResult ? (payoutResult.success ? 'completed' : 'failed') : 'processing'}...
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-center gap-3">
                                            <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 mb-2" />
                                            <h3 className="text-lg sm:text-xl font-semibold text-slate-900">
                                                Connect Wallet
                                            </h3>
                                        </div>
                                        <p className="text-sm sm:text-base text-slate-600 mb-4 text-center">
                                            Connect your wallet to start scanning QR codes for payment.
                                        </p>
                                        <hr className="my-4 text-slate-200" />
                                        <div className="flex items-center justify-center gap-3">
                                            <QrCode className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 mb-2" />
                                            <h3 className="text-lg sm:text-xl font-semibold text-slate-900">
                                                Ready to Scan
                                            </h3>
                                        </div>
                                        <p className="text-sm sm:text-base text-slate-600 mb-1 text-center">
                                            Position your camera at the QR code to begin payment process.
                                        </p>
                                        <div className="text-center">
                                            <p className="text-xs sm:text-sm text-slate-500">
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4">
                        <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-sm md:max-w-md lg:max-w-lg max-h-[96vh] sm:max-h-[92vh] md:max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-slate-200">
                                <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900">
                                    Confirm Payment Details
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 md:space-y-4">
                                {/* QR Type */}
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <QrCode className="w-5 h-5 text-emerald-600" />
                                        <span className="font-medium text-slate-900">QR Type</span>
                                        {isTestMode && (
                                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                                                TEST MODE
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-600 capitalize">
                                        {parsedData.qrType.replace('_', ' ')}
                                        {isTestMode && (
                                            <span className="text-orange-600 text-sm ml-2">(Test Data)</span>
                                        )}
                                    </p>
                                </div>

                                {/* Cashfree Beneficiary Details (only shown in test mode) */}
                                {isTestMode && beneficiaryDetails && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">💰</span>
                                            </div>
                                            <span className="font-medium text-blue-900">Cashfree Beneficiary Details</span>
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                                VERIFIED
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-blue-700">Beneficiary ID:</span>
                                                <span className="font-mono text-blue-900 text-xs">{beneficiaryDetails.beneficiary_id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-blue-700">Name:</span>
                                                <span className="font-medium text-blue-900">{beneficiaryDetails.beneficiary_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-blue-700">Email:</span>
                                                <span className="text-blue-900">{beneficiaryDetails.beneficiary_email}</span>
                                            </div>
                                            {beneficiaryDetails.beneficiary_instrument_details?.vpa && (
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700">UPI ID:</span>
                                                    <span className="font-mono text-blue-900">{beneficiaryDetails.beneficiary_instrument_details.vpa}</span>
                                                </div>
                                            )}
                                            {beneficiaryDetails.beneficiary_instrument_details?.bank_account_number && (
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700">Bank Account:</span>
                                                    <span className="font-mono text-blue-900 text-xs">
                                                        {beneficiaryDetails.beneficiary_instrument_details.bank_account_number} / {beneficiaryDetails.beneficiary_instrument_details.bank_ifsc}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

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
                                                        className="w-full pl-8 pr-3 py-3 sm:py-2 text-base sm:text-sm text-slate-500 border border-slate-300 rounded-lg sm:rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 touch-manipulation"
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
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 border-t border-slate-200">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-full sm:flex-1 px-4 py-3 sm:py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors touch-manipulation min-h-[44px] text-sm sm:text-base"
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
                                            setShowReason(false) // Reset to collapsed state
                                            setShowConversionModal(true)
                                        } catch (err) {
                                            console.error('Conversion failed:', err)
                                            // Could show error toast here
                                        }
                                    }}
                                    className="w-full sm:flex-1 px-4 py-3 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed touch-manipulation min-h-[44px] text-sm sm:text-base"
                                    disabled={
                                        !parsedData ||
                                        !parsedData.isValid ||
                                        !parsedData.data ||
                                        !isCurrencySupported(parsedData.data.cu) ||
                                        (parsedData.data.am && !isAmountValid(parsedData.data.am)) ||
                                        (!parsedData.data.am && (!userAmount.trim() || !isAmountValid(userAmount))) ||
                                        isConverting ||
                                        !connectedChain ||
                                        !isValidChainId(connectedChain)
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4">
                    <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-sm md:max-w-md lg:max-w-lg max-h-[96vh] sm:max-h-[92vh] md:max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-slate-200">
                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900">
                                Payment Conversion
                            </h3>
                            <button
                                onClick={() => {
                                    setShowConversionModal(false)
                                    setPaymentStep('')
                                }}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-3 sm:p-4 md:p-6">
                            {/* Payment Flow Info */}
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-emerald-800">
                                    <span className="text-emerald-600">💱</span>
                                    <span className="font-medium">You pay in USDC • Merchant receives in INR</span>
                                </div>
                            </div>


                            {/* Unified Payment Details Container */}
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                {/* Currency Conversion Section */}
                                <div className="p-4 bg-gradient-to-r from-emerald-50/30 to-teal-50/30">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">$</span>
                                        </div>
                                        <span className="font-semibold text-emerald-900">Currency Conversion Details</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-mono text-emerald-900 font-semibold text-lg">{parseFloat(parsedData!.data.am || userAmount).toFixed(2)} ₹</span>
                                            <span className="text-emerald-700 font-medium"><ArrowBigRight className="w-4 h-4" /></span>
                                            <span className="font-mono text-emerald-900 font-bold text-xl">{conversionResult!.usdcAmount.toFixed(6)} $</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-emerald-700 text-sm">Exchange Rate:</span>
                                            <span className="font-mono text-emerald-900 text-sm">1 $ = {(1 / conversionResult!.exchangeRate).toFixed(2)} ₹</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Horizontal Separator */}
                                <div className="h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></div>

                                {/* Network Service Fee Section */}
                                <div className="p-4 bg-gradient-to-r from-teal-50/30 to-emerald-50/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">⚡</span>
                                        </div>
                                        <span className="font-semibold text-teal-900">Network Service Fee</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-teal-700 font-medium">Service Fee:</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-teal-900 font-semibold text-lg">{conversionResult!.networkFee.toFixed(2)} USDC</span>
                                                <button
                                                    onClick={() => setShowReason(prev => !prev)}
                                                    className="flex items-center justify-center w-6 h-6 bg-teal-100 hover:bg-teal-200 rounded-full transition-all duration-200 group hover:scale-105 shadow-sm"
                                                    title={showReason ? "Hide details" : "Show details"}
                                                >
                                                    <svg
                                                        className={`w-3 h-3 text-teal-600 transition-transform duration-300 ${showReason ? 'rotate-180' : ''}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expandable Reason Section */}
                                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showReason ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                                            <div className="p-4 bg-gradient-to-r from-white/80 to-teal-50/80 rounded-lg border border-teal-200 shadow-sm">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <span className="text-teal-600 text-sm">💡</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-teal-900 mb-1">What&apos;s included in this fee?</h4>
                                                        <p className="text-sm text-teal-800 leading-relaxed">
                                                            This covers your <span className="font-semibold">ETH gas sponsorship</span> and upgrades your wallet to <span className="font-semibold">EIP-7702 compatible format</span> for seamless Web3 payments on <span className="font-semibold text-teal-700">{conversionResult!.networkName}</span>.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Horizontal Separator */}
                                <div className="h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent"></div>

                                {/* Payment Summary Section */}
                                <div className="p-4">
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
                                        {isTestMode && beneficiaryDetails && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-emerald-700">Beneficiary ID:</span>
                                                    <span className="font-mono text-emerald-900 text-xs">{beneficiaryDetails.beneficiary_id}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-emerald-700">Beneficiary Email:</span>
                                                    <span className="text-emerald-900 text-xs">{beneficiaryDetails.beneficiary_email}</span>
                                                </div>
                                            </>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-emerald-700">Your USDC Balance:</span>
                                            <span className={`font-medium ${parseFloat(usdcBalance) < conversionResult!.totalUsdcAmount ? 'text-red-600' : 'text-emerald-900'}`}>
                                                {isCheckingBalance ? 'Checking...' : `${parseFloat(usdcBalance).toFixed(2)} USDC`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-emerald-700">Payment Amount:</span>
                                            <span className="font-medium text-emerald-900">{conversionResult!.usdcAmount.toFixed(2)} USDC</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-emerald-700">Service Fee:</span>
                                            <span className="font-medium text-emerald-900">{conversionResult!.networkFee.toFixed(2)} USDC</span>
                                        </div>
                                        <div className="flex justify-between border-t border-emerald-200 pt-2 mt-2">
                                            <span className="text-emerald-700 font-semibold">You Pay:</span>
                                            <span className="font-bold text-emerald-900 text-lg">{conversionResult!.totalUsdcAmount.toFixed(2)} USDC</span>
                                        </div>
                                        <div className="flex justify-between border-t border-emerald-200 pt-2 mt-2">
                                            <span className="text-emerald-700 font-semibold">Merchant Receives:</span>
                                            <span className="font-bold text-emerald-900 text-lg">₹{parseFloat(parsedData!.data.am || userAmount).toFixed(2)}</span>
                                        </div>
                                        {balanceError && (
                                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-red-700 text-xs">{balanceError}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 border-t border-slate-200">
                            <button
                                onClick={() => {
                                    setShowConversionModal(false)
                                    setPaymentStep('')
                                }}
                                className="w-full sm:flex-1 px-4 py-3 sm:py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors touch-manipulation min-h-[44px] text-sm sm:text-base"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        setIsProcessingPayment(true)
                                        setPaymentStep('Initiating payment...')
                                        setPaymentResult(null)

                                        // Check USDC balance before proceeding
                                        const hasSufficientBalance = await checkUSDCBalanceLocal(conversionResult!.totalUsdcAmount)

                                        if (!hasSufficientBalance) {
                                            setPaymentResult({
                                                success: false,
                                                error: 'Insufficient USDC balance',
                                                status: 'failed'
                                            })
                                            return
                                        }

                                        // Validate chain ID before proceeding
                                        if (!connectedChain) {
                                            throw new Error('No connected chain found. Please ensure your wallet is connected to a supported network.')
                                        }

                                        if (!isValidChainId(connectedChain)) {
                                            const chainInfo = getChainInfo(connectedChain)
                                            throw new Error(`Unsupported network: ${chainInfo?.name || 'Unknown'} (Chain ID: ${connectedChain}). Please switch to a supported network.`)
                                        }

                                        // Store transaction in database first
                                        const finalAmount = parsedData!.data.am || userAmount
                                        const storeTransactionData = {
                                            upiId: parsedData!.data.pa,
                                            merchantName: parsedData!.data.pn || 'Unknown Merchant',
                                            totalUsdToPay: conversionResult!.totalUsdcAmount,
                                            inrAmount: finalAmount,
                                            walletAddress: undefined, // Will be updated after payment
                                            txnHash: undefined, // Will be updated after payment
                                            chainId: connectedChain, // Include validated chain ID
                                            isSuccess: false // Default to false, will be updated after payment
                                        }

                                        console.log('Storing transaction in database with chain validation...')
                                        console.log('Chain ID:', connectedChain)
                                        console.log('Chain Info:', getChainInfo(connectedChain))

                                        const storeResponse = await fetch('/api/store-upi-transaction', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify(storeTransactionData),
                                        })

                                        if (!storeResponse.ok) {
                                            const errorData = await storeResponse.json()
                                            console.error('Store transaction error:', errorData)

                                            // Handle specific chain validation errors
                                            if (errorData.validChains) {
                                                const validChains = (errorData.validChains as Array<{ name: string }>).map((c) => c.name).join(', ')
                                                throw new Error(`Chain validation failed. Supported networks: ${validChains}`)
                                            }

                                            throw new Error(errorData.error || 'Failed to store transaction')
                                        }

                                        const storeResult = await storeResponse.json()
                                        console.log('Transaction stored successfully:', storeResult)
                                        console.log('Transaction ID:', storeResult.transactionId)
                                        console.log('Chain used:', storeResult.chain)

                                        // Store the transaction ID for future updates
                                        if (storeResult.transactionId) {
                                            setStoredTransactionId(storeResult.transactionId)
                                        }

                                        // Use the validated chain ID from wallet context
                                        const chainId = connectedChain!


                                        // Step 1: Now proceed with EIP-7702 transaction
                                        console.log('Step 1: Proceeding with EIP-7702 transaction...')
                                        setPaymentStep('Processing blockchain transaction...')


                                        // Use new client-side flow with user's wallet
                                        const provider = await wallet!.getEthereumProvider()
                                        const ethersProvider = new ethers.BrowserProvider(provider)
                                        const signer = await ethersProvider.getSigner()
                                        const usdcAddress = USDC_CONTRACT_ADDRESSES[chainId as keyof typeof USDC_CONTRACT_ADDRESSES]

                                        const prepared = await prepareUSDCMetaTransaction({
                                            recipient: TREASURY_ADDRESS,
                                            usdcAddress,
                                            amountUsdc: conversionResult!.totalUsdcAmount.toString(),
                                            userSigner: signer,
                                            chainId: chainId,
                                            backendApiKey: process.env.NEXT_PUBLIC_BACKEND_API_KEY || "your-api-key-here",
                                            backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
                                            upiMerchantDetails: {
                                                pa: parsedData?.data?.pa || "merchant@upi",
                                                pn: parsedData?.data?.pn || "Merchant",
                                                am: (conversionResult!.totalUsdcAmount * 83).toFixed(2), // Convert USDC to INR
                                                cu: "INR",
                                                mc: parsedData?.data?.mc || "1234",
                                                tr: parsedData?.data?.tr || `TXN_${Date.now()}`
                                            }
                                        })

                                        const receipt = await prepared.send()
                                        const txHash = receipt?.transactionHash
                                        const wasSuccess = !!(receipt?.success && txHash)

                                        setPaymentResult({
                                            success: wasSuccess,
                                            status: wasSuccess ? 'completed' : 'failed',
                                            transactionHash: txHash,
                                        })

                                        // Update transaction in database with payment results
                                        if (storeResult.transactionId) {
                                            const walletAddress = await signer.getAddress()
                                            await updateTransactionWithPayment(
                                                storeResult.transactionId,
                                                txHash || '',
                                                wasSuccess,
                                                walletAddress
                                            )
                                        }

                                        // Step 2: Initiate Cashfree payout to beneficiary first
                                        console.log('Step 2: Initiating Cashfree payout to beneficiary...')
                                        setPaymentStep('Sending INR to beneficiary via Cashfree...')

                                        // Create clean, short remarks for Cashfree (max ~50 chars, no special chars)
                                        const merchantName = parsedData!.data.pn || 'Merchant';
                                        const cleanRemarks = `Pay ${merchantName.substring(0, 20)}`.replace(/[^a-zA-Z0-9\s]/g, '').trim();

                                        // Determine the customer identifier to use
                                        let customerIdentifier = beneficiaryDetails?.beneficiary_id

                                        if (!customerIdentifier) {
                                            // If we don't have beneficiary details, use the UPI ID from parsed QR data
                                            // The payout API will handle the lookup
                                            customerIdentifier = parsedData?.data?.pa || 'success@upi'
                                            console.log('No beneficiary details found, using UPI ID:', customerIdentifier)
                                        }

                                        const payoutData = {
                                            customerId: customerIdentifier,
                                            amount: parseFloat(finalAmount),
                                            remarks: cleanRemarks,
                                            fundsourceId: undefined, // Optional - will use default from config
                                        }

                                        console.log('🚀 Payout data being sent:')
                                        console.log('- beneficiaryDetails:', beneficiaryDetails)
                                        console.log('- beneficiary_id:', beneficiaryDetails?.beneficiary_id)
                                        console.log('- final customerId:', payoutData.customerId)

                                        console.log('Original merchant name:', merchantName)
                                        console.log('Clean remarks:', cleanRemarks)
                                        console.log('Payout data:', payoutData)
                                        console.log('Beneficiary details:', beneficiaryDetails)
                                        console.log('Final amount:', finalAmount)

                                        const payoutResponse = await fetch('/api/payouts/initiate', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify(payoutData),
                                        })

                                        if (!payoutResponse.ok) {
                                            let payoutError = { error: 'Unknown error', details: '' }
                                            try {
                                                payoutError = await payoutResponse.json()
                                            } catch (parseError) {
                                                console.error('Failed to parse payout error response:', parseError)
                                            }
                                            console.error('Cashfree payout failed:', payoutError)
                                            console.error('Response status:', payoutResponse.status)
                                            console.error('Response statusText:', payoutResponse.statusText)
                                            throw new Error(payoutError.error || payoutError.details || 'Failed to initiate payout')
                                        }

                                        const payoutResult = await payoutResponse.json()
                                        console.log('Cashfree payout initiated:', payoutResult)

                                        if (!payoutResult.success) {
                                            throw new Error(payoutResult.error || 'Payout initiation failed')
                                        }

                                        // Update transaction with payout details
                                        if (storeResult.transactionId) {
                                            await fetch('/api/update-upi-transaction', {
                                                method: 'PUT',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({
                                                    transactionId: storeResult.transactionId,
                                                    payoutTransferId: payoutResult.payout?.transferId,
                                                    payoutStatus: payoutResult.payout?.status,
                                                    isSuccess: true // Both EIP-7702 and payout completed successfully
                                                }),
                                            })
                                        }

                                        // Payment completed successfully - close modal and show confetti
                                        setShowConversionModal(false)
                                        setShowConfetti(true)
                                        setPaymentStep('')

                                        // Hide confetti after 5 seconds
                                        setTimeout(() => {
                                            setShowConfetti(false)
                                        }, 5000)

                                    } catch (error) {
                                        console.error('Payment processing error:', error)
                                        setPaymentResult({
                                            success: false,
                                            error: error instanceof Error ? error.message : 'Payment processing failed',
                                            status: 'failed'
                                        })
                                        setPaymentStep('')
                                    } finally {
                                        setIsProcessingPayment(false)
                                    }
                                }}
                                disabled={
                                    isCheckingBalance ||
                                    isProcessingPayment ||
                                    parseFloat(usdcBalance) < conversionResult!.totalUsdcAmount ||
                                    !connectedChain ||
                                    !isValidChainId(connectedChain)
                                }
                                className={`w-full sm:flex-1 px-4 py-3 sm:py-2 rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation min-h-[44px] text-sm sm:text-base ${isCheckingBalance || isProcessingPayment
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : parseFloat(usdcBalance) < conversionResult!.totalUsdcAmount
                                        ? 'bg-red-500 text-white cursor-not-allowed'
                                        : !connectedChain || !isValidChainId(connectedChain)
                                            ? 'bg-orange-500 text-white cursor-not-allowed'
                                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    }`}
                            >
                                {isCheckingBalance ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Checking Balance...
                                    </>
                                ) : parseFloat(usdcBalance) < conversionResult!.totalUsdcAmount ? (
                                    <>
                                        <AlertCircle className="w-4 h-4" />
                                        Insufficient USDC
                                    </>
                                ) : !connectedChain || !isValidChainId(connectedChain) ? (
                                    <>
                                        <AlertCircle className="w-4 h-4" />
                                        Unsupported Network
                                    </>
                                ) : (
                                    <>
                                        <DollarSign className="w-4 h-4" />
                                        {paymentStep || 'Pay Now'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
