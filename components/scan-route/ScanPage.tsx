'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { QrCode, Wallet, CheckCircle, AlertCircle } from 'lucide-react'
import { ParsedQrResponse } from '@/types/upi.types'
import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth'
import { useWallet } from '@/context/WalletContext'
import { isValidChainId, getChainInfo } from '@/lib/chain-validation'
import Confetti from 'react-confetti'
import { ScanningState } from '@/types/qr-service.types'
import QrScanner from '@/components/scan-route/services/QrScanner'
import { QrScannerRef } from '@/types/qr-service.types'
import { checkUSDCBalance } from '@/lib/helpers/usdc-balance-checker'
import { convertInrToUsdc, loadTestData } from '@/lib/helpers/api-data-validator'
import ConfirmationModal from '@/components/popups/scan/ConfirmationModal'
import ConversionModal from '@/components/popups/scan/ConversionModal'
import { useScanState } from '@/hooks/useScanState'
import { usePaymentProcessing } from '@/hooks/usePaymentProcessing'
import { BACKEND_URL, API_KEY } from '@/config/constant'
import { ethers } from 'ethers'

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
    const [networkFeeUsdc, setNetworkFeeUsdc] = useState<number>(0)
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
        setScanningState,
        updateScanningState,
        resetScanState
    } = scanState

    const qrScannerRef = useRef<QrScannerRef>(null)

    // Initialize payment processing hook
    const { processPayment } = usePaymentProcessing({
        parsedData,
        userAmount,
        conversionResult,
        beneficiaryDetails,
        connectedChain: connectedChain ?? undefined,
        networkFeeUsdc: networkFeeUsdc,
        onPaymentResult: setPaymentResult,
        onPaymentStep: setPaymentStep,
        onStoreTransaction: async (storeData) => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/transactions/store`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': API_KEY!
                    },
                    body: JSON.stringify(storeData),
                });
                const json = await response.json().catch(() => null as unknown as { data?: unknown; error?: string });
                if (!response.ok) {
                    console.warn('Store transaction failed:', json?.error || response.statusText);
                    return {
                        transactionId: '',
                        chain: String(storeData.chainId ?? '')
                    };
                }
                const data = (json?.data ?? json ?? {}) as { transactionId?: string; _id?: string; chain?: string };
                return {
                    transactionId: data?.transactionId || data?._id || '',
                    chain: data?.chain || String(storeData.chainId ?? '')
                };
            } catch (e) {
                console.warn('Store transaction exception:', e);
                return {
                    transactionId: '',
                    chain: String(storeData.chainId ?? '')
                };
            }
        },
        onUpdateTransaction: async (transactionId, txnHash, isSuccess, walletAddress) => {
            await fetch(`${BACKEND_URL}/api/transactions/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY!
                },
                body: JSON.stringify({
                    transactionId,
                    txnHash,
                    isSuccess,
                    walletAddress
                }),
            });
            return true;
        },
        onSuccess: () => {
            setShowConversionModal(false);
            setShowConfetti(true);
            setPaymentStep('');
            setTimeout(() => {
                setShowConfetti(false);
            }, 5000);
        }
    });

    // Initialize component
    useEffect(() => {
        setIsVisible(true)
    }, [])


    const fetchNetworkFee = async () => {
        try {
            // Use a default gas used for estimation (same as in payment hook)
            const fixedGasUsed = BigInt(50000);

            if (!window.ethereum) {
                throw new Error('Ethereum provider or ethers.js not found. Please connect your wallet.');
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const provider = new ethers.providers.Web3Provider(window.ethereum as any);
            console.log('provider', provider, window.ethereum);

            // Try to get the best available gas price (EIP-1559 or legacy)
            let gasPrice: bigint | undefined;
            let feeData;
            try {
                feeData = await provider.getFeeData();
                // ethers.js getFeeData() returns BigNumber, so convert to bigint
                const maxFeePerGas = feeData.maxFeePerGas ? BigInt(feeData.maxFeePerGas.toString()) : undefined;
                const gasPriceLegacy = feeData.gasPrice ? BigInt(feeData.gasPrice.toString()) : undefined;
                gasPrice = maxFeePerGas ?? gasPriceLegacy;
                console.log('feeData', feeData, gasPrice);
            } catch {
                // fallback: try legacy gasPrice
                // try {
                //     gasPrice = await provider.getGasPrice() as bigint;
                // } catch {
                //     gasPrice = undefined;
                // }
            }

            if (!gasPrice) {
                throw new Error('Failed to fetch real-time gas price from provider.');
            }
            gasPrice = BigInt(gasPrice);

            // Add 20% buffer
            const rawFeeWei = gasPrice * fixedGasUsed;
            const bufferedFeeWei = rawFeeWei * BigInt(120) / BigInt(100);
            console.log('bufferedFeeWei', bufferedFeeWei);

            // Call the backend API to convert to USDC
            const feeResp = await fetch('/api/conversion/eth-to-usdc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wei: bufferedFeeWei.toString() })
            });
            if (feeResp.ok) {
                const feeJson = await feeResp.json();
                const usdcFeeEstimate = Number(feeJson.usdc || 0);
                console.log('usdcFeeEstimate', usdcFeeEstimate);
                setNetworkFeeUsdc(usdcFeeEstimate);
            }
        } catch {
            // Optionally log error for debugging
            // console.error('fetchNetworkFee error:', err);
            // Do not set fee on error
        }
    };

    // Force re-render when validation state changes
    useEffect(() => {
        // This ensures the component re-renders when parsedData or userAmount changes
        // which should update the disabled state of the confirm butto
    }, [parsedData, userAmount])

    // QR Service Methods
    const resetScan = useCallback(() => {
        resetScanState()
    }, [resetScanState])

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

            setShowModal(true)
        } catch (error) {
            console.error('Error loading test data:', error)
        }
    }


    // Check USDC balance when conversion modal opens
    useEffect(() => {
        if (showConversionModal && conversionResult && wallet) {
            checkUSDCBalanceLocal(conversionResult.usdcAmount + networkFeeUsdc)
        }
    }, [showConversionModal, conversionResult, wallet, checkUSDCBalanceLocal, networkFeeUsdc])

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
                            await fetchNetworkFee()
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


                        // Use the payment processing hook that includes EIP-7702 delegation
                        await processPayment()

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
                networkFeeUsdc={networkFeeUsdc}
                isCheckingBalance={isCheckingBalance}
                isProcessingPayment={isProcessingPayment}
                paymentStep={paymentStep}
                balanceError={balanceError}
                beneficiaryDetails={beneficiaryDetails}
                connectedChain={connectedChain ?? undefined}
                isValidChainId={isValidChainId}
            />
        </>
    )
}
