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
import { convertInrToUsdc, loadTestData } from '@/lib/helpers/api-data-validator'
import ConfirmationModal from '@/components/popups/scan/ConfirmationModal'
import ConversionModal from '@/components/popups/scan/ConversionModal'
import { useScanState } from '@/hooks/useScanState'
import { BACKEND_URL, API_KEY } from '@/config/constant'
import TransactionHistory from '@/components/scan-route/TransactionHistory'

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
        setBeneficiaryDetails,
        setIsConverting,
        setIsProcessingPayment,
        setPaymentStep,
        setIsTestMode,
        setScanningState,
        updateScanningState,
        resetScanState
    } = scanState

    const qrScannerRef = useRef<QrScannerRef>(null)

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

    const convertInrToUsdcWrapper = async (inrAmount: number) => {
        try {
            setIsConverting(true)
            setConversionResult(null)

            const data = await convertInrToUsdc(inrAmount, connectedChain || 421614)
            console.log('Conversion result received:', data);
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

                                        setShowModal(true)
                                    }, [setParsedData, setShowModal, beneficiaryDetails])}
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
                                        Load Test Data
                                    </button>
                                    <p className="text-xs text-slate-500 mt-2">
                                        For development: Load test customer data
                                    </p>
                                    {/* View Transaction History Button */}
                                    <HistoryButton />
                                </div>
                            </div>

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
                                            Your payment has been processed successfully!
                                        </p>
                                        {paymentResult.transactionHash && (
                                            <div className="text-center">
                                                <p className="text-xs text-green-700 font-mono bg-green-100 px-2 py-1 rounded inline-block">
                                                    USDC TX: {paymentResult.transactionHash.substring(0, 10)}...{paymentResult.transactionHash.substring(paymentResult.transactionHash.length - 8)}
                                                </p>
                                                <a
                                                    href={`${BACKEND_URL}/api/payments/explorer/${connectedChain}/${paymentResult.transactionHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-block ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                                                >
                                                    🔗 View on Explorer
                                                </a>
                                            </div>
                                        )}
                                        {paymentResult.upiPaymentId && (
                                            <div className="mt-2 text-center">
                                                <p className="text-sm text-green-700">
                                                    INR payout: {paymentResult.upiPaymentStatus === 'SUCCESS' ? '✅ Completed' : paymentResult.upiPaymentStatus === 'PENDING' ? '⏳ Processing' : '❌ ' + paymentResult.upiPaymentStatus}
                                                </p>
                                                <p className="text-xs text-green-700 font-mono bg-green-100 px-2 py-1 rounded mt-1">
                                                    Transfer ID: {paymentResult.upiPaymentId}
                                                </p>
                                            </div>
                                        )}
                                        {paymentResult.upiPayoutDetails && (
                                            <p className="text-xs text-green-700 mt-1">
                                                Amount: ₹{paymentResult.upiPayoutDetails.amount}
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
                                                Ready to process payment...
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
                        setPaymentStep('Processing payment...')
                        setPaymentResult(null)

                        // Validate chain ID
                        if (!connectedChain) {
                            throw new Error('No connected chain found. Please ensure your wallet is connected to a supported network.')
                        }

                        if (!isValidChainId(connectedChain)) {
                            const chainInfo = getChainInfo(connectedChain)
                            throw new Error(`Unsupported network: ${chainInfo?.name || 'Unknown'} (Chain ID: ${connectedChain}). Please switch to a supported network.`)
                        }

                        // Prepare USDC meta transaction with user's wallet
                        const provider = await wallet!.getEthereumProvider()
                        const ethersProvider = new ethers.BrowserProvider(provider)
                        const signer = await ethersProvider.getSigner()
                        const userAddress = await signer.getAddress()
                        const usdcAddress = USDC_CONTRACT_ADDRESSES[connectedChain as keyof typeof USDC_CONTRACT_ADDRESSES]

                        // Prepare the meta transaction data (this will sign and prepare the transaction)
                        const prepared = await prepareUSDCMetaTransaction({
                            recipient: TREASURY_ADDRESS,
                            usdcAddress,
                            amountUsdc: conversionResult!.totalUsdcAmount.toString(),
                            userSigner: signer,
                            chainId: connectedChain,
                            backendApiKey: API_KEY!,
                            backendUrl: BACKEND_URL,
                            upiMerchantDetails: {
                                pa: parsedData?.data?.pa || "merchant@upi",
                                pn: parsedData?.data?.pn || "Merchant",
                                am: (conversionResult!.inrAmount || userAmount).toString(),
                                cu: "INR",
                                mc: parsedData?.data?.mc || "1234",
                                tr: parsedData?.data?.tr || `TXN_${Date.now()}`
                            }
                        })

                        // Execute the USDC transaction directly on frontend
                        const receipt = await prepared.send()
                        const txHash = receipt?.transactionHash
                        const wasSuccess = !!(receipt?.success && txHash)

                        if (!wasSuccess) {
                            throw new Error('USDC transaction failed')
                        }

                        console.log('USDC transaction successful:', txHash)

                        // Store transaction details in database
                        console.log('Storing transaction details...');
                        const storeResponse = await fetch(`${BACKEND_URL}/api/transactions/store`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-api-key': API_KEY!
                            },
                            body: JSON.stringify({
                                upiId: parsedData?.data?.pa || "merchant@upi",
                                merchantName: parsedData?.data?.pn || "Merchant",
                                totalUsdToPay: conversionResult!.totalUsdcAmount.toString(),
                                inrAmount: (conversionResult!.inrAmount || userAmount).toString(),
                                walletAddress: userAddress,
                                txnHash: txHash,
                                chainId: connectedChain,
                                isSuccess: true
                            }),
                        });

                        let storedTransactionId = null;
                        if (storeResponse.ok) {
                            const storeResult = await storeResponse.json();
                            storedTransactionId = storeResult.data?.transactionId;
                            console.log('Transaction stored successfully:', storedTransactionId);
                        } else {
                            console.warn('Failed to store transaction details');
                        }

                        // Now send transaction details to backend for INR payout processing
                        const payoutResponse = await fetch(`${BACKEND_URL}/api/payments/process-payout`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-API-Key': API_KEY!,
                            },
                            body: JSON.stringify({
                                transactionHash: txHash,
                                upiMerchantDetails: {
                                    pa: parsedData?.data?.pa || "merchant@upi",
                                    pn: parsedData?.data?.pn || "Merchant",
                                    am: (conversionResult!.inrAmount || userAmount).toString(),
                                    cu: "INR",
                                    mc: parsedData?.data?.mc || "1234",
                                    tr: parsedData?.data?.tr || `TXN_${Date.now()}`
                                },
                                chainId: connectedChain
                            }),
                        })

                        if (!payoutResponse.ok) {
                            const errorData = await payoutResponse.json()
                            console.warn('INR payout failed, but USDC transaction succeeded:', errorData.error)

                            // Trigger refund: refund amount = total paid - network fee at payment time
                            try {
                                console.log('Refund calculation:', {
                                    totalUsdcAmount: conversionResult!.totalUsdcAmount,
                                    networkFee: conversionResult!.networkFee,
                                    refundAmount: conversionResult!.totalUsdcAmount - conversionResult!.networkFee
                                });
                                const refundAmountUsdc = (conversionResult!.totalUsdcAmount - conversionResult!.networkFee).toFixed(6)
                                const refundResp = await fetch(`${BACKEND_URL}/api/payments/refund`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY! },
                                    body: JSON.stringify({ 
                                        chainId: connectedChain,
                                        to: userAddress,
                                        amount: refundAmountUsdc,
                                        from: TREASURY_ADDRESS,
                                        txHash: txHash,
                                        networkFee: conversionResult!.networkFee.toFixed(6),
                                        totalPaid: conversionResult!.totalUsdcAmount.toFixed(6),
                                        reason: 'upi_payout_failed'
                                    })
                                })
                                if (!refundResp.ok) {
                                    const rj = await refundResp.json().catch(() => ({}))
                                    console.error('Refund failed:', rj?.error || refundResp.statusText)
                                } else {
                                    const rj = await refundResp.json()
                                    console.log('Refund success:', rj)
                                }
                            } catch (rfErr) {
                                console.error('Error triggering refund:', rfErr)
                            }

                            // Continue without throwing since USDC was successful
                        }

                        const payoutResult = await payoutResponse.json()
                        console.log('INR payout result:', payoutResult)

                        // Update transaction with payout details if we have a stored transaction ID
                        if (storedTransactionId && payoutResult.success) {
                            console.log('Updating transaction with payout details...');
                            await fetch(`${BACKEND_URL}/api/transactions/update`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'x-api-key': API_KEY!
                                },
                                body: JSON.stringify({
                                    transactionId: storedTransactionId,
                                    payoutTransferId: payoutResult.data?.upiPaymentId,
                                    payoutStatus: payoutResult.data?.upiPaymentStatus,
                                    payoutAmount: payoutResult.data?.upiPayoutDetails?.amount,
                                    payoutRemarks: `Payout to ${parsedData?.data?.pn || "Merchant"}`,
                                    isSuccess: true,
                                    walletAddress: userAddress
                                }),
                            });
                        }

                        // Update local state with results
                        setPaymentResult({
                            success: true,
                            status: 'completed',
                            transactionHash: txHash,
                            upiPaymentId: payoutResult.data?.upiPaymentId,
                            upiPaymentStatus: payoutResult.data?.upiPaymentStatus,
                            upiPayoutDetails: payoutResult.data?.upiPayoutDetails
                        })

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

function HistoryButton() {
    const { wallets } = useWallets()
    const wallet = wallets[0]
    const [showHistory, setShowHistory] = useState(false)
    const [addr, setAddr] = useState<string | null>(null)

    useEffect(() => {
        const getAddress = async () => {
            try {
                if (!wallet) return
                const provider = await wallet.getEthereumProvider()
                const ethersProvider = new ethers.BrowserProvider(provider)
                const signer = await ethersProvider.getSigner()
                const a = await signer.getAddress()
                setAddr(a)
            } catch {
                setAddr(null)
            }
        }
        getAddress()
    }, [wallet])

    return (
        <div className="mt-4">
            <button
                onClick={() => setShowHistory((s) => !s)}
                disabled={!addr}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors text-sm"
            >
                View Transaction History
            </button>
            {!addr && (
                <div className="text-[11px] text-slate-500 mt-1">Connect wallet to view history</div>
            )}
            {showHistory && addr && (
                <div className="mt-3">
                    <TransactionHistory
                        walletAddress={addr}
                        backendUrl={BACKEND_URL}
                        apiKey={API_KEY!}
                        onClose={() => setShowHistory(false)}
                    />
                </div>
            )}
        </div>
    )
}
