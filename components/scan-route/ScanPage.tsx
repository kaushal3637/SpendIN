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
                                onError={useCallback((error: string) => {
                                    console.error('QR scanning error:', error)
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
                                {paymentResult.transactionHash && (
                                    <div className="text-xs text-green-700 font-mono bg-green-100 px-2 py-1 rounded mb-3">
                                        {paymentResult.transactionHash.substring(0, 12)}...{paymentResult.transactionHash.substring(paymentResult.transactionHash.length - 8)}
                                    </div>
                                )}
                                <button
                                    onClick={resetScan}
                                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Scan Another QR
                                </button>
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
                        } catch (err) {
                            console.error('Conversion failed:', err)
                            // Could show error toast here
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
                                    chainId: connectedChain,
                                    to: userAddress,
                                    amount: conversionResult!.totalUsdcAmount,
                                    from: TREASURY_ADDRESS,
                                    txHash: txHash,
                                    networkFee: conversionResult!.networkFee,
                                    totalPaid: conversionResult!.totalUsdcAmount,
                                    reason: 'upi_payout_failed',
                                });
                                const refundAmountUsdc = (conversionResult!.totalUsdcAmount - conversionResult!.networkFee).toFixed(6)
                                const refundResp = await fetch(`${BACKEND_URL}/api/payments/refund`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY! },
                                    body: JSON.stringify({ 
                                        chainId: connectedChain,
                                        to: TREASURY_ADDRESS,
                                        amount: refundAmountUsdc,
                                        from: userAddress,
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
