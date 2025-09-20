'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { QrCode, CheckCircle, AlertCircle } from 'lucide-react'
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
import toast from 'react-hot-toast'

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
        setUserAmount,
        setConversionResult,
        setPaymentResult,
        setBeneficiaryDetails,
        setIsConverting,
        setIsProcessingPayment,
        setPaymentStep,
        setIsTestMode,
        setScanningState,
        updateScanningState,
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

    const convertInrToUsdcWrapper = async (inrAmount: number) => {
        try {
            setIsConverting(true)
            setConversionResult(null)

            const data = await convertInrToUsdc(inrAmount, connectedChain || 421614)
            setConversionResult(data)
            return data
        } catch (err) {
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
        } catch {
            toast.error('Failed to load test data')
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
                                        : "Connect your wallet to start payment."
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
                                                Please switch to Arbitrum Sepolia network
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
                                        setParsedData(parsedData)
                                        setShowModal(true)
                                    }, [setParsedData, setShowModal])}
                                    onError={useCallback(() => {
                                        toast.error('Failed to scan QR Code')
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
                                            Payment Successful!
                                        </h3>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-green-800 font-medium">
                                            Your payment has been processed successfully!
                                        </p>
                                        {paymentResult.transactionHash && (
                                            <div className="text-center">
                                                <p className="text-sm text-green-700">
                                                    USDC Payment Status: {paymentResult.transactionHash ? '✅ Completed' : '❌ Failed'}
                                                </p>
                                            </div>
                                        )}
                                        {paymentResult.upiPaymentId && (
                                            <div className="mt-2 text-center">
                                                <p className="text-sm text-green-700">
                                                    INR Payment Status: {paymentResult.upiPaymentStatus === 'RECEIVED' ? '✅ Completed' : paymentResult.upiPaymentStatus === 'PENDING' ? '⏳ Processing' : '❌ ' + paymentResult.upiPaymentStatus}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
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
                        } catch {
                            toast.error('Conversation failed')
                        }
                    }}
                    parsedData={parsedData}
                    userAmount={userAmount}
                    setUserAmount={setUserAmount}
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
                            throw new Error(`Unsupported network: ${chainInfo?.name || 'Unknown'} (Chain ID: ${connectedChain}). Please switch to arbitrum sepolia network.`)
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

                        // Store transaction details in database
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
                        } else {
                            console.warn('Failed to store transaction details');
                        }

                        // Note: INR payout is already processed as part of the USDC meta transaction flow
                        // No need for separate payout call to avoid duplicate processing
                        console.log('USDC transaction completed successfully. INR payout was processed automatically.')

                        // Update local state with results
                        setPaymentResult({
                            success: true,
                            status: 'completed',
                            transactionHash: txHash,
                            upiPaymentId: 'processed_via_meta_transaction',
                            upiPaymentStatus: 'RECEIVED',
                            upiPayoutDetails: {
                                transferId: 'processed_via_meta_transaction',
                                status: 'RECEIVED',
                                message: `Payment to ${parsedData?.data?.pn || "Merchant"}`,
                                amount: parseFloat(String(conversionResult!.inrAmount || userAmount))
                            }
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
                        setPaymentResult({
                            success: false,
                            error: error instanceof Error ? error.message : 'Payment data update failed',
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
