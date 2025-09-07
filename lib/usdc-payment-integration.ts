/**
 * Integration example for triggering INR payouts after USDC payments
 *
 * This file shows how to integrate the Razorpay payout service
 * with your USDC payment confirmation flow.
 */

import { payoutService } from './payout-service';
import { getUpiTransactionCollection } from './getCollections';

export interface UsdcPaymentConfirmation {
  transactionId: string;
  txnHash: string;
  walletAddress: string;
  amount: string; // USDC amount
  chainId: number;
  blockNumber?: number;
  timestamp?: Date;
}

/**
 * Call this function after confirming USDC payment on the blockchain
 * This should be integrated into your USDC payment confirmation logic
 */
export async function handleUsdcPaymentConfirmation(
  confirmation: UsdcPaymentConfirmation
): Promise<{ success: boolean; message: string; payoutResult?: { success: boolean; payout_id?: string; status?: string; amount?: number; currency?: string; error?: string } }> {
  try {
    console.log('Processing USDC payment confirmation:', confirmation);

    const TransactionModel = await getUpiTransactionCollection();

    // Update transaction with USDC payment details
    const transaction = await TransactionModel.findByIdAndUpdate(
      confirmation.transactionId,
      {
        txnHash: confirmation.txnHash,
        walletAddress: confirmation.walletAddress,
        isSuccess: true,
        paidAt: confirmation.timestamp || new Date(),
      },
      { new: true }
    );

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    console.log('USDC payment confirmed, triggering INR payout...');

    // Trigger INR payout via Razorpay
    const payoutResult = await payoutService.triggerPayoutAfterUsdcPayment(
      confirmation.transactionId
    );

    if (payoutResult.success) {
      console.log('INR payout initiated successfully:', payoutResult);

      return {
        success: true,
        message: `USDC payment confirmed and INR payout of ₹${payoutResult.amount} initiated to ${transaction.upiId}`,
        payoutResult,
      };
    } else {
      console.error('INR payout failed:', payoutResult.error);

      return {
        success: false,
        message: `USDC payment confirmed but INR payout failed: ${payoutResult.error}`,
        payoutResult,
      };
    }

  } catch (error) {
    console.error('Error handling USDC payment confirmation:', error);

    return {
      success: false,
      message: `Failed to process payment confirmation: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Example webhook handler for blockchain transaction confirmations
 * This could be called from your blockchain event listener
 */
export async function handleBlockchainConfirmation(
  txnHash: string,
  blockNumber: number,
  transactionId: string
) {
  const confirmation: UsdcPaymentConfirmation = {
    transactionId,
    txnHash,
    walletAddress: '', // You would get this from the blockchain transaction
    amount: '', // You would get this from the blockchain transaction
    chainId: 421614, // Default to Arbitrum Sepolia
    blockNumber,
    timestamp: new Date(),
  };

  return handleUsdcPaymentConfirmation(confirmation);
}

/**
 * Batch process pending payouts for transactions that have USDC payments
 * but haven't triggered INR payouts yet
 */
export async function processPendingPayouts(): Promise<{
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}> {
  const TransactionModel = await getUpiTransactionCollection();

  // Find transactions with successful USDC payments but no payout triggered
  const pendingTransactions = await TransactionModel.find({
    isSuccess: true,
    payoutTriggered: false,
    txnHash: { $exists: true, $ne: null }
  });

  let processed = 0;
  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const transaction of pendingTransactions) {
    try {
      console.log(`Processing pending payout for transaction: ${transaction._id}`);

      const result = await payoutService.triggerPayoutAfterUsdcPayment(
        transaction._id.toString()
      );

      if (result.success) {
        successful++;
        console.log(`Payout successful for transaction ${transaction._id}`);
      } else {
        failed++;
        errors.push(`Transaction ${transaction._id}: ${result.error}`);
        console.error(`Payout failed for transaction ${transaction._id}:`, result.error);
      }

      processed++;

      // Add small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      failed++;
      const errorMessage = `Transaction ${transaction._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMessage);
      console.error(`Error processing transaction ${transaction._id}:`, error);
    }
  }

  return {
    processed,
    successful,
    failed,
    errors,
  };
}

/**
 * Integration example with your existing ScanPage component
 *
 * After USDC payment is confirmed, call this function:
 *
 * ```typescript
 * // In your ScanPage.tsx, after USDC payment confirmation:
 * import { handleUsdcPaymentConfirmation } from '@/lib/usdc-payment-integration';
 *
 * const result = await handleUsdcPaymentConfirmation({
 *   transactionId: storedTransactionId,
 *   txnHash: '0x...', // From blockchain transaction
 *   walletAddress: wallet.address,
 *   amount: conversionResult.totalUsdcAmount.toString(),
 *   chainId: 421614,
 * });
 *
 * if (result.success) {
 *   console.log(result.message);
 *   // Update UI to show payout initiated
 * } else {
 *   console.error(result.message);
 *   // Handle payout failure
 * }
 * ```
 */

/**
 * Environment variables needed for Razorpay integration:
 *
 * Add these to your .env.local file:
 *
 * # Razorpay Configuration
 * RAZORPAY_API_KEY=rzp_test_your_api_key
 * RAZORPAY_API_SECRET=your_api_secret
 * RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
 * RAZORPAY_X_ACCOUNT=your_x_account_id
 *
 * # For production:
 * RAZORPAY_API_KEY=rzp_live_your_api_key
 * RAZORPAY_API_SECRET=your_live_api_secret
 * RAZORPAY_WEBHOOK_SECRET=your_live_webhook_secret
 * RAZORPAY_X_ACCOUNT=your_live_x_account_id
 */
