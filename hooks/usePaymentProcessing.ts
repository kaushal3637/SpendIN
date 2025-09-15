import { useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { USDC_CONTRACT_ADDRESSES, TREASURY_ADDRESS } from "@/config/constant";
import { prepareUSDCMetaTransaction } from "@/lib/abstractionkit";
import { isValidChainId, getChainInfo } from "@/lib/chain-validation";
import { PaymentProcessingOptions } from "@/types/hooks/usePaymentProcessing";
import { BACKEND_URL, API_KEY } from "@/config/constant";

export function usePaymentProcessing({
  parsedData,
  userAmount,
  conversionResult,
  beneficiaryDetails,
  connectedChain,
  onPaymentResult,
  onPaymentStep,
  onStoreTransaction,
  onUpdateTransaction,
  onPayout,
  onSuccess,
}: Omit<PaymentProcessingOptions, "isTestMode">) {
  const { wallets } = useWallets();
  const wallet = wallets[0];

  const processPayment = useCallback(async () => {
    try {
      onPaymentStep("Initiating payment...");
      onPaymentResult({ success: false, status: "pending" });

      // Check USDC balance before proceeding
      // This will be handled by the parent component

      // Validate chain ID before proceeding
      if (!connectedChain) {
        throw new Error(
          "No connected chain found. Please ensure your wallet is connected to a supported network."
        );
      }

      if (!isValidChainId(connectedChain)) {
        const chainInfo = getChainInfo(connectedChain);
        throw new Error(
          `Unsupported network: ${
            chainInfo?.name || "Unknown"
          } (Chain ID: ${connectedChain}). Please switch to a supported network.`
        );
      }

      // Store transaction in database first
      const finalAmount = parsedData!.data.am || userAmount;
      const storeTransactionData = {
        upiId: parsedData!.data.pa,
        merchantName: parsedData!.data.pn || "Unknown Merchant",
        totalUsdToPay: conversionResult!.totalUsdcAmount,
        inrAmount: finalAmount,
        walletAddress: undefined, // Will be updated after payment
        txnHash: undefined, // Will be updated after payment
        chainId: connectedChain, // Include validated chain ID
        isSuccess: false, // Default to false, will be updated after payment
      };

      console.log("Storing transaction in database with chain validation...");
      console.log("Chain ID:", connectedChain);
      console.log("Chain Info:", getChainInfo(connectedChain));

      const storeResult = await onStoreTransaction(storeTransactionData);
      console.log("Transaction stored successfully:", storeResult);
      console.log("Transaction ID:", storeResult.transactionId);
      console.log("Chain used:", storeResult.chain);

      // Store the transaction ID for future updates
      const storedTransactionId = storeResult.transactionId;

      // Use the validated chain ID from wallet context
      const chainId = connectedChain!;

      // Step 1: Proceed with EIP-7702 transaction
      console.log("Step 1: Proceeding with EIP-7702 transaction...");
      onPaymentStep("Processing blockchain transaction...");

      // Use new client-side flow with user's wallet
      const provider = await wallet!.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const usdcAddress =
        USDC_CONTRACT_ADDRESSES[
          chainId as keyof typeof USDC_CONTRACT_ADDRESSES
        ];

      const prepared = await prepareUSDCMetaTransaction({
        recipient: TREASURY_ADDRESS,
        usdcAddress,
        amountUsdc: conversionResult!.totalUsdcAmount.toString(),
        userSigner: signer,
        chainId: chainId,
        backendApiKey: API_KEY!,
        backendUrl: BACKEND_URL,
        upiMerchantDetails: {
          pa: parsedData?.data?.pa || "merchant@upi",
          pn: parsedData?.data?.pn || "Merchant",
          am: (conversionResult!.totalUsdcAmount * 83).toFixed(2), // Convert USDC to INR
          cu: "INR",
          mc: parsedData?.data?.mc || "1234",
          tr: parsedData?.data?.tr || `TXN_${Date.now()}`,
        },
      });

      const receipt = await prepared.send();
      const txHash = receipt?.transactionHash;
      const wasSuccess = !!(receipt?.success && txHash);

      onPaymentResult({
        success: wasSuccess,
        status: wasSuccess ? "completed" : "failed",
        transactionHash: txHash,
      });

      // Update transaction in database with payment results
      if (storedTransactionId) {
        const walletAddress = await signer.getAddress();
        await onUpdateTransaction(
          storedTransactionId,
          txHash || "",
          wasSuccess,
          walletAddress
        );
      }

      // Step 2: Initiate Cashfree payout to beneficiary first
      console.log("Step 2: Initiating Cashfree payout to beneficiary...");
      onPaymentStep("Sending INR to beneficiary via Cashfree...");

      // Create clean, short remarks for Cashfree (max ~50 chars, no special chars)
      const merchantName = parsedData!.data.pn || "Merchant";
      const cleanRemarks = `Pay ${merchantName.substring(0, 20)}`
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim();

      // Determine the customer identifier to use
      let customerIdentifier = beneficiaryDetails?.beneficiaryId;

      if (!customerIdentifier) {
        // If we don't have beneficiary details, use the UPI ID from parsed QR data
        // The payout API will handle the lookup
        customerIdentifier = parsedData?.data?.pa || "success@upi";
        console.log(
          "No beneficiary details found, using UPI ID:",
          customerIdentifier
        );
      }

      const payoutData = {
        customerId: customerIdentifier,
        amount: parseFloat(finalAmount),
        remarks: cleanRemarks,
        fundsourceId: undefined, // Optional - will use default from config
      };

      console.log("🚀 Payout data being sent:");
      console.log("- beneficiaryDetails:", beneficiaryDetails);
      console.log("- beneficiary_id:", beneficiaryDetails?.beneficiaryId);
      console.log("- final customerId:", payoutData.customerId);

      console.log("Original merchant name:", merchantName);
      console.log("Clean remarks:", cleanRemarks);
      console.log("Payout data:", payoutData);
      console.log("Beneficiary details:", beneficiaryDetails);
      console.log("Final amount:", finalAmount);

      const payoutResult = await onPayout(payoutData);
      console.log("Cashfree payout initiated:", payoutResult);

      if (!payoutResult.success) {
        throw new Error(payoutResult.error || "Payout initiation failed");
      }

      // Update transaction with payout details
      if (storedTransactionId) {
        await fetch(`${BACKEND_URL}/api/transactions/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY!,
          },
          body: JSON.stringify({
            transactionId: storedTransactionId,
            payoutTransferId: payoutResult.payout?.transferId,
            payoutStatus: payoutResult.payout?.status,
            isSuccess: true, // Both EIP-7702 and payout completed successfully
          }),
        });
      }

      // Payment completed successfully - close modal and show confetti
      onSuccess();
    } catch (error) {
      console.error("Payment processing error:", error);
      onPaymentResult({
        success: false,
        error:
          error instanceof Error ? error.message : "Payment processing failed",
        status: "failed",
      });
    }
  }, [
    parsedData,
    userAmount,
    conversionResult,
    beneficiaryDetails,
    connectedChain,
    wallet,
    onPaymentResult,
    onPaymentStep,
    onStoreTransaction,
    onUpdateTransaction,
    onPayout,
    onSuccess,
  ]);

  return {
    processPayment,
  };
}
