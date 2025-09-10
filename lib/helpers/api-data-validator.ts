import { ParsedQrResponse } from "@/types/upi.types";
import { CashfreeBeneficiaryResponse } from "@/types/cashfree.types";
import { ScanStateSetters } from "@/types/api-validator.types";

/**
 * Form validation and API utility functions for ScanPage
 */

// ========== FORM VALIDATION FUNCTIONS ==========

/**
 * Check if currency is supported (only INR allowed)
 * @param currency - Currency code to validate
 * @returns Boolean indicating if currency is supported
 */
export function isCurrencySupported(currency?: string): boolean {
  const normalizedCurrency = (currency || "INR").toUpperCase();
  return normalizedCurrency === "INR";
}

/**
 * Check if amount is valid (max 25000)
 * @param amount - Amount string to validate
 * @returns Boolean indicating if amount is valid
 */
export function isAmountValid(amount?: string): boolean {
  if (!amount) return false;
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0 && numAmount <= 25000;
}

/**
 * Get currency validation error message
 * @param currency - Currency code
 * @returns Error message string or null if valid
 */
export function getCurrencyError(currency?: string): string | null {
  if (!isCurrencySupported(currency)) {
    return `Unsupported currency: ${
      currency || "Unknown"
    }. This platform only supports INR (Indian Rupees).`;
  }
  return null;
}

/**
 * Get amount validation error message
 * @param amount - Amount string
 * @returns Error message string or null if valid
 */
export function getAmountError(amount?: string): string | null {
  if (!amount) return "Amount is required";
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0)
    return "Amount must be a positive number";
  if (numAmount > 25000) return "Amount cannot exceed ₹25,000";
  return null;
}

/**
 * Validate entire payment form
 * @param parsedData - Parsed QR data
 * @param userAmount - User entered amount
 * @returns Object with validation results
 */
export function validatePaymentForm(
  parsedData: ParsedQrResponse | null,
  userAmount: string
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!parsedData || !parsedData.isValid || !parsedData.data) {
    errors.push("Invalid QR code data");
    return { isValid: false, errors };
  }

  // Currency validation
  if (!isCurrencySupported(parsedData.data.cu)) {
    errors.push(getCurrencyError(parsedData.data.cu) || "Unsupported currency");
  }

  // Amount validation
  if (parsedData.data.am) {
    // QR contains amount
    if (!isAmountValid(parsedData.data.am)) {
      errors.push(
        getAmountError(parsedData.data.am) || "Invalid amount in QR code"
      );
    }
  } else {
    // User must enter amount
    if (!userAmount.trim() || !isAmountValid(userAmount)) {
      errors.push(getAmountError(userAmount) || "Please enter a valid amount");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ========== API UTILITY FUNCTIONS ==========

/**
 * Handle customer payout via API
 * @param upiId - UPI ID for payout
 * @param userAmount - Amount to pay
 * @returns Promise with payout result
 */
export async function handleCustomerPayout(
  upiId: string,
  userAmount: string
): Promise<{
  success: boolean;
  payout?: {
    transferId: string;
    amount: number;
    status: string;
    message: string;
  };
  error?: string;
}> {
  try {
    // Extract customer identifier from UPI ID (for test customers)
    // This is a simplified approach - in production you'd have a proper lookup
    const customerIdentifier = upiId.split("@")[0];

    // Try to find customer by UPI ID or name
    const response = await fetch("/api/payouts/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId: customerIdentifier, // This might need adjustment based on your customer ID format
        amount: parseFloat(userAmount),
        remarks: `Auto payout triggered by QR scan - ${upiId}`,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("Auto payout successful:", data.payout.transferId);
      return data;
    } else {
      console.error("Auto payout failed:", data.error || data.payout.message);
      return data;
    }
  } catch (error) {
    console.error("Error processing auto payout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Convert INR to USDC via API
 * @param inrAmount - INR amount to convert
 * @returns Promise with conversion result
 */
export async function convertInrToUsdc(inrAmount: number): Promise<{
  inrAmount: number;
  usdAmount: number;
  usdcAmount: number;
  exchangeRate: number;
  lastUpdated: string;
  networkFee: number;
  networkName: string;
  totalUsdcAmount: number;
} | null> {
  try {
    const response = await fetch("/api/conversion/inr-to-usd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: inrAmount,
        chainId: 421614, // Default to Arbitrum Sepolia, can be made dynamic later
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to convert currency");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error converting INR to USDC:", err);
    throw err;
  }
}

/**
 * Update transaction with payment details
 * @param transactionId - Transaction ID to update
 * @param txnHash - Transaction hash
 * @param isSuccess - Whether payment was successful
 * @param walletAddress - User's wallet address
 * @returns Promise with update result
 */
export async function updateTransactionWithPayment(
  transactionId: string,
  txnHash: string,
  isSuccess: boolean,
  walletAddress?: string
): Promise<boolean> {
  try {
    const response = await fetch("/api/update-upi-transaction", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transactionId,
        txnHash,
        isSuccess,
        walletAddress,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update transaction");
    }

    const result = await response.json();
    console.log("Transaction updated successfully:", result);
    return true;
  } catch (error) {
    console.error("Error updating transaction:", error);
    return false;
  }
}

/**
 * Load test data for development
 * @returns Promise that resolves when test data is loaded
 */
export async function loadTestData(): Promise<{
  beneficiary: CashfreeBeneficiaryResponse["data"];
  upiId: string;
  testParsedData: ParsedQrResponse;
  qrString: string;
}> {
  console.log("Loading test data...");

  // Use the beneficiary with UPI ID from your dashboard
  const beneficiaryId = "1492218328b3o0m39jsCfkjeyFVBKdreP1";

  // Fetch beneficiary details from Cashfree
  const response = await fetch(`/api/cashfree-beneficiary/${beneficiaryId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch beneficiary details");
  }

  const beneficiaryData = await response.json();
  const beneficiary = beneficiaryData.beneficiary;

  // Get UPI ID from beneficiary instrument details
  const upiId =
    beneficiary?.beneficiary_instrument_details?.vpa || "success@upi";

  // Create test QR data using the beneficiary's UPI ID
  const testParsedData: ParsedQrResponse = {
    qrType: "dynamic_merchant",
    isValid: true,
    data: {
      pa: upiId,
      pn: beneficiary?.beneficiary_name || "Test Bene",
      am: "10.00", // Test amount
      cu: "INR",
      mc: "1234",
      tr: `TXN${Date.now()}`,
    },
  };

  // Generate QR string
  const qrString = `upi://pay?pa=${encodeURIComponent(
    upiId
  )}&pn=${encodeURIComponent(testParsedData.data.pn || "Test Bene")}&am=${
    testParsedData.data.am
  }&cu=${testParsedData.data.cu}&mc=${testParsedData.data.mc}&tr=${
    testParsedData.data.tr
  }`;

  return {
    beneficiary,
    upiId,
    testParsedData,
    qrString,
  };
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Reset scan state utility
 * @param setters - Object containing all setter functions
 */
export function resetScanState(setters: ScanStateSetters): void {
  // Reset QR scanner component
  if (setters.qrScannerRef.current) {
    setters.qrScannerRef.current.reset();
  }

  // Reset component state
  setters.setParsedData(null);
  setters.setShowModal(false);
  setters.setUserAmount("");
  setters.setConversionResult(null);
  setters.setShowConversionModal(false);
  setters.setShowReason(false);
  setters.setPayoutResult(null);
  setters.setBeneficiaryDetails(null);
  setters.setShowConfetti(false);
  setters.setPaymentResult(null);
  setters.setStoredTransactionId(null);
}
