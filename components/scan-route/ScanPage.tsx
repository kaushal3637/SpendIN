'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { QrCode, Camera, Wallet, CheckCircle, AlertCircle, Play, Square, X, Check, Banknote, ArrowBigRight, DollarSignIcon } from 'lucide-react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { ParsedQrResponse, UpiQrData } from '@/types/upi.types'
// import SwitchNetwork from '@/components/SwitchNetwork'
import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth'
import { USDC_CONTRACT_ADDRESSES, TREASURY_ADDRESS, DELEGATION_CONTRACT_ADDRESS, BACKEND_API_URL, BACKEND_API_KEY} from '@/config/constant'
import { ethers } from 'ethers'

// EIP-7702 Transaction interface
interface EIP7702Authorization {
  chainId: number;
  address: string; // Delegation contract address
  nonce: string;
  yParity: number;
  r: string;
  s: string;
}

interface EIP7702Transaction {
  type: 0x04; // EIP-7702 transaction type
  to: string; // EOA address (not contract address)
  value: string;
  data: string; // Encoded function calls
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  authorization: EIP7702Authorization[];
}

interface SponsoredTransactionCall {
  to: string; // Target contract
  value: string;
  data: string; // Encoded function call
}

interface SponsoredTransactionRequest {
  userAddress: string; // EOA address
  calls: SponsoredTransactionCall[];
  authorization: EIP7702Authorization;
  upiMerchantDetails: UpiQrData;
  chainId: number;
}

export default function ScanPage() {
    const { authenticated } = usePrivy()
    const { wallets } = useWallets()
    const wallet = wallets[0]
    const { login } = useLogin()
    const isWalletConnected = authenticated

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
    const [isTestMode, setIsTestMode] = useState(false)
    const [paymentResult, setPaymentResult] = useState<{ // eslint-disable-line @typescript-eslint/no-unused-vars
        success: boolean;
        transactionHash?: string;
        upiPaymentId?: string;
        error?: string;
        status: string;
    } | null>(null)

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
        setShowReason(false)
        stopScanning()
    }

    // Function to update transaction with payment details
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

    // Check USDC balance
    const checkUSDCBalance = useCallback(async (requiredAmount: number) => {
        if (!wallet || !conversionResult) return false

        try {
            setIsCheckingBalance(true)
            setBalanceError(null)

            // Get the wallet provider and signer
            const provider = await wallet.getEthereumProvider()
            const ethersProvider = new ethers.BrowserProvider(provider)
            const signer = await ethersProvider.getSigner()

            // Get current chain ID
            const network = await ethersProvider.getNetwork()
            const chainId = Number(network.chainId)

            // Get USDC contract address for current network
            const usdcAddress = USDC_CONTRACT_ADDRESSES[chainId as keyof typeof USDC_CONTRACT_ADDRESSES]
            if (!usdcAddress) {
                throw new Error(`USDC contract not configured for chain ID: ${chainId}`)
            }

            // USDC Contract ABI (minimal)
            const usdcAbi = [
                'function balanceOf(address account) external view returns (uint256)',
                'function decimals() external view returns (uint8)'
            ]

            // Create contract instance
            const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, ethersProvider)

            // Get user's wallet address
            const userAddress = await signer.getAddress()

            // Get USDC balance
            const balance = await usdcContract.balanceOf(userAddress)
            const decimals = await usdcContract.decimals()

            // Convert to readable format
            const formattedBalance = ethers.formatUnits(balance, decimals)
            setUsdcBalance(formattedBalance)

            // Check if user has sufficient balance
            const requiredAmountFloat = parseFloat(requiredAmount.toString())
            const currentBalanceFloat = parseFloat(formattedBalance)

            return currentBalanceFloat >= requiredAmountFloat

        } catch (error) {
            console.error('Error checking USDC balance:', error)
            setBalanceError(error instanceof Error ? error.message : 'Failed to check USDC balance')
            return false
        } finally {
            setIsCheckingBalance(false)
        }
    }, [wallet, conversionResult])

    // Function to load test data for development
    const loadTestData = () => {
        console.log('Loading test data...')

        // Simulate parsed QR data
        const testParsedData: ParsedQrResponse = {
            qrType: 'dynamic_merchant',
            isValid: true,
            data: {
                pa: 'merchant@paytm',
                pn: 'Test Merchant Store',
                am: '10.00',
                cu: 'INR',
                mc: '1234',
                tr: 'TXN123456789'
            }
        }

        setParsedData(testParsedData)
        setScanResult('upi://pay?pa=merchant@paytm&pn=Test%20Merchant%20Store&am=850.00&cu=INR&mc=1234&tr=TXN123456789')
        setIsTestMode(true)
        setShowModal(true)
        setError(null)
    }

    // Create EIP-7702 authorization signature
    const createEIP7702Authorization = async (chainId: number): Promise<EIP7702Authorization> => {
        if (!wallet) throw new Error('Wallet not connected')

        const provider = await wallet.getEthereumProvider()
        const ethersProvider = new ethers.BrowserProvider(provider)
        const signer = await ethersProvider.getSigner()

        // Validate delegation contract address
        if (!DELEGATION_CONTRACT_ADDRESS) {
            throw new Error('Delegation contract address not configured. Please set NEXT_PUBLIC_DELEGATION_CONTRACT_ADDRESS environment variable.')
        }

        if (!ethers.isAddress(DELEGATION_CONTRACT_ADDRESS)) {
            throw new Error('Invalid delegation contract address format.')
        }

        // Get current nonce for the user
        const nonce = await ethersProvider.getTransactionCount(await signer.getAddress())

        // Create the authorization message to sign
        const authMessage = ethers.solidityPackedKeccak256(
            ['uint256', 'address', 'uint256'],
            [chainId, DELEGATION_CONTRACT_ADDRESS, nonce]
        )

        // Sign the authorization message
        const signature = await signer.signMessage(ethers.getBytes(authMessage))
        const sig = ethers.Signature.from(signature)

        return {
            chainId: chainId,
            address: DELEGATION_CONTRACT_ADDRESS,
            nonce: nonce.toString(),
            yParity: sig.yParity || 0,
            r: sig.r,
            s: sig.s
        }
    }

    // Create sponsored transaction calls
    const createSponsoredTransactionCalls = async (amount: string, chainId: number): Promise<SponsoredTransactionCall[]> => {
        // Get USDC contract address
        const usdcAddress = USDC_CONTRACT_ADDRESSES[chainId as keyof typeof USDC_CONTRACT_ADDRESSES]
        if (!usdcAddress) {
            throw new Error(`USDC contract not configured for chain ID: ${chainId}`)
        }

        // Validate treasury address
        if (!TREASURY_ADDRESS) {
            throw new Error('Treasury address not configured. Please set NEXT_PUBLIC_TREASURY_ADDRESS environment variable.')
        }

        if (!ethers.isAddress(TREASURY_ADDRESS)) {
            throw new Error('Invalid treasury address format.')
        }

        // Create USDC transfer call data
        const usdcInterface = new ethers.Interface([
            'function transfer(address to, uint256 amount) external returns (bool)'
        ])

        const transferAmount = ethers.parseUnits(amount, 6) // USDC has 6 decimals
        const callData = usdcInterface.encodeFunctionData('transfer', [TREASURY_ADDRESS, transferAmount])

        console.log("Treasury Address:", TREASURY_ADDRESS)
        console.log("USDC Contract Address:", usdcAddress)
        console.log("Transfer Amount:", transferAmount.toString())

        return [{
            to: usdcAddress, // Target USDC contract
            value: "0", // No ETH transfer
            data: callData // Encoded transfer function call
        }]
    }

    // Create sponsored transaction request
    const createSponsoredTransactionRequest = async (amount: string, chainId: number, upiDetails: UpiQrData): Promise<SponsoredTransactionRequest> => {
        if (!wallet) throw new Error('Wallet not connected')

        const provider = await wallet.getEthereumProvider()
        const ethersProvider = new ethers.BrowserProvider(provider)
        const signer = await ethersProvider.getSigner()
        const userAddress = await signer.getAddress()

        // Create authorization for EIP-7702
        const authorization = await createEIP7702Authorization(chainId)

        // Create transaction calls
        const calls = await createSponsoredTransactionCalls(amount, chainId)

        return {
            userAddress: userAddress,
            calls: calls,
            authorization: authorization,
            upiMerchantDetails: upiDetails,
            chainId: chainId
        }
    }

    // Call backend API with sponsored transaction request
    const processPaymentWithBackend = async (sponsoredRequest: SponsoredTransactionRequest) => {
        const requestBody = {
            sponsoredRequest,
            upiMerchantDetails: sponsoredRequest.upiMerchantDetails,
            chainId: sponsoredRequest.chainId
        }
        console.log("Backend API URL:", BACKEND_API_URL);
        console.log("Backend API Key:", BACKEND_API_KEY);
        console.log("Request Body:", JSON.stringify(requestBody, null, 2));

        try {
            const response = await fetch(`${BACKEND_API_URL}/api/payments/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': BACKEND_API_KEY
                },
                body: JSON.stringify(requestBody)
            })

            console.log("Response status:", response.status);
            console.log("Response headers:", Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (parseError) {
                    console.error("Failed to parse error response:", parseError);
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log("Backend response:", result);
            return result;

        } catch (fetchError) {
            console.error("Fetch error details:", fetchError);

            if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
                throw new Error(`Network error: Cannot connect to backend at ${BACKEND_API_URL}. Please ensure the backend server is running on port 3001.`);
            }

            throw fetchError;
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

    // Check USDC balance when conversion modal opens
    useEffect(() => {
        if (showConversionModal && conversionResult && wallet) {
            checkUSDCBalance(conversionResult.totalUsdcAmount)
        }
    }, [showConversionModal, conversionResult, wallet, checkUSDCBalance])

    return (
        <>
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
                            </div>

                            {/* QR Scanner */}
                            <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-12">
                                <div className="relative w-full max-w-[85vw] sm:max-w-sm md:max-w-md mx-auto">
                                    {/* Scanner Frame */}
                                    <div className="relative bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border-2 border-emerald-200 p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
                                        {/* Video Element for Camera Feed */}
                                        <div className={`relative bg-slate-900 rounded-lg overflow-hidden ${isScanning ? 'border-2 border-emerald-300' : 'border-0'}`}>
                                            <video
                                                ref={videoRef}
                                                className={`w-full h-48 sm:h-56 md:h-64 lg:h-80 object-cover ${!isScanning ? 'hidden' : ''}`}
                                                playsInline
                                                muted
                                            />

                                            {/* Placeholder when not scanning */}
                                            {!isScanning && !scanResult && !error && (
                                                <div className="w-full h-48 sm:h-56 md:h-64 lg:h-80 flex items-center justify-center bg-slate-50">
                                                    <div className="text-center p-4">
                                                        {!isWalletConnected ? (
                                                            <>
                                                                <Wallet className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-blue-500 mx-auto mb-3 sm:mb-4" />
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
                                                                <p className="font-medium mb-2">QR Data:</p>
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
                                        <div className="mt-3 sm:mt-4 flex gap-2 sm:gap-3 justify-center px-2">
                                            {!scanResult && !error && (
                                                <button
                                                    onClick={isWalletConnected ? toggleScanning : login}
                                                    disabled={hasPermission === false}
                                                    className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-2 rounded-full font-medium transition-all duration-200 text-sm sm:text-base touch-manipulation min-h-[44px] ${isScanning
                                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                                        : !isWalletConnected
                                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
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
                                                    ) : !isWalletConnected ? (
                                                        <>
                                                            <Wallet className="w-4 h-4" />
                                                            Connect Wallet
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
                                                    className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-full font-medium transition-all duration-200 text-sm sm:text-base touch-manipulation min-h-[44px]"
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

                                        {/* Test Button for Development */}
                                        <div className="mt-4 text-center">
                                            <button
                                                onClick={loadTestData}
                                                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors text-sm mx-auto"
                                                disabled={!isWalletConnected}
                                            >
                                                <QrCode className="w-4 h-4" />
                                                Load Test Data
                                            </button>
                                            <p className="text-xs text-slate-500 mt-2">
                                                For development: Skip QR scanning and load test UPI data
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Next Steps */}
                            <div className="bg-white/50 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 border border-emerald-100 mx-2 sm:mx-0">
                                {scanResult ? (
                                    <>
                                        <div className="flex items-center justify-center gap-3">
                                            <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
                                            <h3 className="text-lg sm:text-xl font-semibold text-slate-900">
                                                Payment Done Successfully!
                                            </h3>
                                        </div>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4">
                    <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-sm md:max-w-md lg:max-w-lg max-h-[96vh] sm:max-h-[92vh] md:max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-slate-200">
                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900">
                                Payment Conversion
                            </h3>
                            <button
                                onClick={() => setShowConversionModal(false)}
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
                                onClick={() => setShowConversionModal(false)}
                                className="w-full sm:flex-1 px-4 py-3 sm:py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors touch-manipulation min-h-[44px] text-sm sm:text-base"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        setIsProcessingPayment(true)
                                        setPaymentResult(null)

                                        // Check USDC balance before proceeding
                                        const hasSufficientBalance = await checkUSDCBalance(conversionResult!.totalUsdcAmount)

                                        if (!hasSufficientBalance) {
                                            setPaymentResult({
                                                success: false,
                                                error: 'Insufficient USDC balance',
                                                status: 'failed'
                                            })
                                            return
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
                                            isSuccess: false // Default to false, will be updated after payment
                                        }

                                        console.log('Storing transaction in database...')
                                        const storeResponse = await fetch('/api/store-upi-transaction', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify(storeTransactionData),
                                        })

                                        if (!storeResponse.ok) {
                                            const errorData = await storeResponse.json()
                                            throw new Error(errorData.error || 'Failed to store transaction')
                                        }

                                        const storeResult = await storeResponse.json()
                                        console.log('Transaction stored successfully:', storeResult)

                                        // Store the transaction ID for future updates
                                        if (storeResult.transactionId) {
                                            setStoredTransactionId(storeResult.transactionId)
                                        }

                                        // Get current chain ID
                                        const provider = await wallet!.getEthereumProvider()
                                        const ethersProvider = new ethers.BrowserProvider(provider)
                                        const network = await ethersProvider.getNetwork()
                                        const chainId = Number(network.chainId)

                                        // Prepare UPI details
                                        const upiDetails = {
                                            pa: parsedData!.data.pa,
                                            pn: parsedData!.data.pn,
                                            am: finalAmount,
                                            cu: parsedData!.data.cu || 'INR'
                                        }

                                        // Create sponsored transaction request for EIP-7702
                                        const sponsoredRequest = await createSponsoredTransactionRequest(
                                            conversionResult!.totalUsdcAmount.toString(), 
                                            chainId, 
                                            upiDetails
                                        )
                                        console.log('Created sponsored transaction request:', sponsoredRequest)

                                        // Call backend API
                                        const backendResult = await processPaymentWithBackend(sponsoredRequest)
                                        console.log('Backend result:', backendResult)

                                        setPaymentResult(backendResult.data || backendResult)

                                        // Update transaction in database with payment results
                                        if (storeResult.transactionId) {
                                            const walletAddress = await ethersProvider.getSigner().then(s => s.getAddress())

                                            await updateTransactionWithPayment(
                                                storeResult.transactionId,
                                                backendResult.data?.transactionHash || '',
                                                backendResult.success && !!backendResult.data?.transactionHash,
                                                walletAddress
                                            )
                                        }

                                    } catch (error) {
                                        console.error('Payment processing error:', error)
                                        setPaymentResult({
                                            success: false,
                                            error: error instanceof Error ? error.message : 'Payment processing failed',
                                            status: 'failed'
                                        })
                                    } finally {
                                        setIsProcessingPayment(false)
                                    }
                                }}
                                disabled={isCheckingBalance || isProcessingPayment || parseFloat(usdcBalance) < conversionResult!.totalUsdcAmount}
                                className={`w-full sm:flex-1 px-4 py-3 sm:py-2 rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation min-h-[44px] text-sm sm:text-base ${
                                    isCheckingBalance || isProcessingPayment
                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                        : parseFloat(usdcBalance) < conversionResult!.totalUsdcAmount
                                            ? 'bg-red-500 text-white cursor-not-allowed'
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
                                ) : (
                                    <>
                                        <DollarSignIcon className="w-4 h-4" />
                                        Pay Now
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
