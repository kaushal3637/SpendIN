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

            <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50">
                {/* Header */}
                <div className={`transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Scanner Section */}
                    <div className="px-4 py-6">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-medium text-slate-800 mb-2">
                                Scan QR Code
                            </h2>
                            <p className="text-sm text-slate-600">
                                {isWalletConnected
                                    ? "Point your camera at the QR code to pay"
                                    : "Connect wallet to start scanning"
                                }
                            </p>
                        </div>

                        {/* QR Scanner Frame */}
                        <div className="relative mx-auto mb-6 w-full">
                            <QrScanner
                                ref={qrScannerRef}
                                isWalletConnected={isWalletConnected}
                                onConnectWallet={login}
                                onQrDetected={useCallback((qrData: string, parsedData: ParsedQrResponse) => {
                                    console.log('QR Code detected:', qrData)
                                    setParsedData(parsedData)
                                    // Directly show modal without any delay
                                    setShowModal(true)
                                }, [setParsedData, setShowModal])}
                                onError={useCallback(() => {
                                    toast.error('QR scanning error')
                                }, [])}
                                onScanningStateChange={useCallback((state: ScanningState) => {
                                    updateScanningState(state)
                                }, [updateScanningState])}
                                className="w-full"
                            />
                        </div>


                    </div>

                    {/* Payment Success */}
                    {paymentResult?.success && !showConversionModal && (
                        <div className="px-4 mb-4">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-green-900">Payment Successful!</h3>
                                        <p className="text-sm text-green-700">Transaction completed</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Refund Message */}
                    {paymentResult?.status === 'refunded' && !showConversionModal && (
                        <div className="mb-4 sm:mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg sm:rounded-xl p-4 mx-2 sm:mx-0 shadow-lg">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <AlertCircle className="w-8 h-8 text-orange-600" />
                                <h3 className="text-xl sm:text-2xl font-bold text-orange-900">
                                    Payment Refunded
                                </h3>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-orange-800 font-medium">
                                    {paymentResult.error || 'UPI payout failed; USDC refunded'}
                                </p>
                                {paymentResult.refund && (
                                    <div className="text-center space-y-1">
                                        <p className="text-sm text-orange-700">
                                            Refund Amount: {paymentResult.refund.amount} USDC
                                        </p>
                                        {paymentResult.refund.fee && (
                                            <p className="text-xs text-orange-600">
                                                Fee Deducted: {paymentResult.refund.fee} USDC
                                            </p>
                                        )}
                                        {paymentResult.refund.transactionHash && (
                                            <p className="text-xs text-orange-600">
                                                Refund TX: {paymentResult.refund.transactionHash.slice(0, 10)}...
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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
                    let txHash: string | undefined
                    let userAddress: string | undefined
                    
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
                        userAddress = await signer.getAddress()
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
                            networkFee: conversionResult!.networkFee.toString(),
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
                        txHash = receipt?.transactionHash
                        const wasSuccess = !!(receipt?.success && txHash)

                        console.log('Payment receipt:', receipt)

                        // Check if the response indicates a refund was processed
                        if (receipt?.status === 'refunded') {
                            console.log('Backend processed refund:', receipt.refund)
                            setPaymentResult({
                                success: false,
                                status: 'refunded',
                                error: 'UPI payout failed; USDC refunded',
                                refund: receipt.refund
                            })
                            setShowConversionModal(false)
                            return
                        }

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
                        console.error('Payment processing error:', error)
                        
                        // If USDC transaction succeeded but something else failed, attempt manual refund
                        if (txHash && conversionResult && userAddress) {
                            console.log('Attempting manual refund due to payment processing error...')
                            try {
                                const refundAmountUsdc = (conversionResult.totalUsdcAmount - conversionResult.networkFee).toFixed(6)
                                const refundResp = await fetch(`${BACKEND_URL}/api/payments/refund`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY! },
                                    body: JSON.stringify({
                                        chainId: connectedChain,
                                        to: userAddress,
                                        amount: refundAmountUsdc,
                                        from: userAddress,
                                        txHash: txHash,
                                        networkFee: conversionResult.networkFee.toFixed(6),
                                        totalPaid: conversionResult.totalUsdcAmount.toFixed(6),
                                        reason: 'payment_processing_error'
                                    })
                                })
                                
                                if (refundResp.ok) {
                                    const refundData = await refundResp.json()
                                    console.log('Manual refund successful:', refundData)
                                    setPaymentResult({
                                        success: false,
                                        status: 'refunded',
                                        error: 'Payment failed but USDC refunded',
                                        refund: {
                                            amount: refundAmountUsdc,
                                            transactionHash: refundData.data?.transactionHash,
                                            to: userAddress
                                        }
                                    })
                                } else {
                                    const refundError = await refundResp.json().catch(() => ({}))
                                    console.error('Manual refund failed:', refundError)
                                    setPaymentResult({
                                        success: false,
                                        error: `Payment failed and refund failed: ${refundError.error || 'Unknown error'}`,
                                        status: 'failed'
                                    })
                                }
                            } catch (refundErr) {
                                console.error('Manual refund error:', refundErr)
                                setPaymentResult({
                                    success: false,
                                    error: error instanceof Error ? error.message : 'Payment failed and refund error',
                                    status: 'failed'
                                })
                            }
                        } else {
                            setPaymentResult({
                                success: false,
                                error: error instanceof Error ? error.message : 'Payment failed',
                                status: 'failed'
                            })
                        }
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
        <div>
            <button
                onClick={() => setShowHistory((s) => !s)}
                disabled={!addr}
                className="w-full py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
                View Transaction History
            </button>
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
