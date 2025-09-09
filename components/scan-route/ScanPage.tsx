'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { QrCode, Wallet, CheckCircle, AlertCircle } from 'lucide-react'
import { ParsedQrResponse } from '@/types/upi.types'
import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth'
import { USDC_CONTRACT_ADDRESSES, TREASURY_ADDRESS } from '@/config/constant'
import { useWallet } from '@/context/WalletContext'
import { getChainInfo, isValidChainId } from '@/lib/chain-validation'
import { prepareUSDCMetaTransaction } from '@/lib/abstractionkit'
import { ethers } from 'ethers'
import Confetti from 'react-confetti'
import { ScanningState } from '@/types/qr-service.types'
import QrScanner from '@/components/scan-route/services/QrScanner'
import { QrScannerRef } from '@/types/qr-service.types'
import { checkUSDCBalance } from '@/lib/helpers/usdc-balance-checker'
import {
    handleCustomerPayout,
    convertInrToUsdc,
    updateTransactionWithPayment,
    loadTestData
} from '@/lib/helpers/api-data-validator'
import ConfirmationModal from '@/components/scan-route/pop-ups/ConfirmationModal'
import ConversionModal from '@/components/scan-route/pop-ups/ConversionModal'
import { useScanState } from '@/components/scan-route/hooks/useScanState'


export default function ScanPage() {
    const { authenticated } = usePrivy()
    const { wallets } = useWallets()
    const wallet = wallets[0]
    const { login } = useLogin()
    const isWalletConnected = authenticated
    const { connectedChain } = useWallet()

    const [isVisible, setIsVisible] = useState(false)
    const [usdcBalance, setUsdcBalance] = useState<string>('0')
    const [isCheckingBalance, setIsCheckingBalance] = useState(false)
    const [balanceError, setBalanceError] = useState<string | null>(null)

    // Use custom hook for scan state management
    const scanState = useScanState()

    // Extract commonly used values from scan state
    const {
        showModal,
        showConversionModal,
        parsedData,
        userAmount,
        conversionResult,
        paymentResult,
        payoutResult,
        beneficiaryDetails,
        isConverting,
        isProcessingPayment,
        paymentStep,
        isTestMode,
        scanningState,
        showConfetti,
        setShowModal,
        setShowConversionModal,
        setShowConfetti,
        setParsedData,
        setConversionResult,
        setPaymentResult,
        setPayoutResult,
        setBeneficiaryDetails,
        setStoredTransactionId,
        setIsConverting,
        setIsProcessingPayment,
        setPaymentStep,
        setIsTestMode,
        setScanningState,
        updateScanningState,
        resetScanState
    } = scanState

    const qrScannerRef = useRef<QrScannerRef>(null)

    // Function to check if scanned QR belongs to a test customer and trigger payout
    const handleCustomerPayoutWrapper = useCallback(async (upiId: string) => {
        setPayoutResult(null)
        const result = await handleCustomerPayout(upiId, userAmount)
        setPayoutResult(result)
    }, [userAmount, setPayoutResult])

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
    const resetScan = useCallback(() => {
        resetScanState()
    }, [resetScanState])

    // Function to update transaction with payment details
    // Updated to include chain validation and use chain ID from WalletContext
    const updateTransactionWithPaymentWrapper = async (
        transactionId: string,
        txnHash: string,
        isSuccess: boolean,
        walletAddress?: string
    ) => {
        return await updateTransactionWithPayment(transactionId, txnHash, isSuccess, walletAddress)
    }


    const convertInrToUsdcWrapper = async (inrAmount: number) => {
        try {
            setIsConverting(true)
            setConversionResult(null)

            const data = await convertInrToUsdc(inrAmount)
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
    const loadTestDataWrapper = async () => {
        try {
            const { beneficiary, testParsedData } = await loadTestData()

        // Store beneficiary details for display
            setBeneficiaryDetails(beneficiary || null)
            setParsedData(testParsedData)

            // Update scanning service state
            if (qrScannerRef.current) {
                qrScannerRef.current.reset()
                // Simulate scan result for testing
                setScanningState({
                    isScanning: false,
                    hasPermission: scanningState.hasPermission,
                    error: null,
                    scanResult: 'upi://pay?pa=merchant@paytm&pn=Test%20Merchant%20Store&am=850.00&cu=INR&mc=1234&tr=TXN123456789',
                    isLoading: false
                })
            }

        setIsTestMode(true)
        setShowModal(true)
        } catch (error) {
            console.error('Error loading test data:', error)
        }
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
                                            handleCustomerPayoutWrapper(parsedData.data.pa)
                                        }

                                        setShowModal(true)
                                    }, [beneficiaryDetails, userAmount, handleCustomerPayoutWrapper, setParsedData, setShowModal])}
                                    onError={useCallback((error: string) => {
                                        console.error('QR scanning error:', error)
                                        // Error state is now managed by QrScanner component
                                    }, [])}
                                    onScanningStateChange={useCallback((state: ScanningState) => {
                                        updateScanningState(state)
                                    }, [updateScanningState])}
                                />

                                        {/* Test Button for Development */}
                                        <div className="mt-4 text-center">
                                            <button
                                        onClick={loadTestDataWrapper}
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
                <ConfirmationModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onConfirm={async (finalAmount: number) => {
                        try {
                            await convertInrToUsdcWrapper(finalAmount)
                                            setShowModal(false)
                                            setShowConversionModal(true)
                                        } catch (err) {
                                            console.error('Conversion failed:', err)
                                            // Could show error toast here
                                        }
                                    }}
                    parsedData={parsedData}
                    userAmount={userAmount}
                    isConverting={isConverting}
                    isTestMode={isTestMode}
                    beneficiaryDetails={beneficiaryDetails}
                    connectedChain={connectedChain ?? undefined}
                    isValidChainId={isValidChainId}
                />
            </div>

            {/* Conversion Modal */}
            <ConversionModal
                isOpen={showConversionModal}
                onClose={() => {
                    setShowConversionModal(false)
                    setPaymentStep('')
                }}
                onPay={async () => {
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

                        // Store the transaction ID for future updates
                        if (storeResult.transactionId) {
                            setStoredTransactionId(storeResult.transactionId)
                        }

                        // Use the validated chain ID from wallet context
                        const chainId = connectedChain!

                        // Step 1: Proceed with EIP-7702 transaction
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
                            await updateTransactionWithPaymentWrapper(
                                storeResult.transactionId,
                                txHash || '',
                                wasSuccess,
                                walletAddress
                            )
                        }

                        // Step 2: Initiate Cashfree payout to beneficiary
                        console.log('Step 2: Initiating Cashfree payout to beneficiary...')
                        setPaymentStep('Sending INR to beneficiary via Cashfree...')

                        // Create clean, short remarks for Cashfree
                        const merchantName = parsedData!.data.pn || 'Merchant';
                        const cleanRemarks = `Pay ${merchantName.substring(0, 20)}`.replace(/[^a-zA-Z0-9\s]/g, '').trim();

                        // Determine the customer identifier to use
                        let customerIdentifier = beneficiaryDetails?.beneficiary_id

                        if (!customerIdentifier) {
                            customerIdentifier = parsedData?.data?.pa || 'success@upi'
                            console.log('No beneficiary details found, using UPI ID:', customerIdentifier)
                        }

                        const payoutData = {
                            customerId: customerIdentifier,
                            amount: parseFloat(finalAmount),
                            remarks: cleanRemarks,
                        }

                        console.log('Payout data:', payoutData)

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
                                    isSuccess: true
                                }),
                            })
                        }

                        // Payment completed successfully
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
                parsedData={parsedData}
                userAmount={userAmount}
                conversionResult={conversionResult}
                usdcBalance={usdcBalance}
                isCheckingBalance={isCheckingBalance}
                isProcessingPayment={isProcessingPayment}
                paymentStep={paymentStep}
                balanceError={balanceError}
                isTestMode={isTestMode}
                beneficiaryDetails={beneficiaryDetails}
                connectedChain={connectedChain ?? undefined}
                isValidChainId={isValidChainId}
            />
        </>
    )
}
