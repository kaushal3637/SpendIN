import { razorpayContactManager } from './razorpay';
import { getUpiTransactionCollection } from './getCollections';
import { PayoutResponse } from '@/types/upi.types';

/**
 * Service for handling automated Razorpay payouts after USDC transactions
 */
export class PayoutService {
  /**
   * Trigger INR payout after successful USDC transaction
   * This should be called when USDC payment is confirmed
   */
  async triggerPayoutAfterUsdcPayment(transactionId: string): Promise<PayoutResponse> {
    try {
      const TransactionModel = await getUpiTransactionCollection();

      // Get transaction details
      const transaction = await TransactionModel.findById(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (!transaction.isSuccess) {
        throw new Error('Cannot trigger payout for unsuccessful transaction');
      }

      if (transaction.payoutTriggered) {
        throw new Error('Payout already triggered for this transaction');
      }

      // Get INR amount to pay out
      const inrAmount = parseFloat(transaction.inrAmount);
      if (isNaN(inrAmount) || inrAmount <= 0) {
        throw new Error('Invalid INR amount in transaction');
      }

      // Generate unique reference ID
      const referenceId = `STABLEUPI_${transactionId}_${Date.now()}`;

      try {
        // Create payout via Razorpay
        const payout = await razorpayContactManager.createPayoutToUPI(
          transaction.upiId,
          transaction.merchantName,
          inrAmount,
          referenceId,
          {
            transaction_id: transactionId,
            usdc_amount: transaction.totalUsdToPay,
            wallet_address: transaction.walletAddress,
            txn_hash: transaction.txnHash,
          }
        );

        // Update transaction with payout information
        await TransactionModel.findByIdAndUpdate(transactionId, {
          payoutTriggered: true,
          'razorpayPayout.payout_id': payout.id,
          'razorpayPayout.status': payout.status,
          'razorpayPayout.amount': payout.amount,
          'razorpayPayout.currency': payout.currency,
          'razorpayPayout.payout_created_at': new Date(payout.created_at * 1000),
          'razorpayPayout.reference_id': referenceId,
        });

        console.log(`Payout initiated successfully for transaction ${transactionId}:`, payout.id);

        return {
          success: true,
          payout_id: payout.id,
          status: payout.status,
          amount: payout.amount / 100, // Convert from paisa to rupees
          currency: payout.currency,
        };

      } catch (payoutError) {
        console.error(`Payout creation failed for transaction ${transactionId}:`, payoutError);

        // Update transaction with failure
        await TransactionModel.findByIdAndUpdate(transactionId, {
          payoutTriggered: true,
          'razorpayPayout.status': 'failed',
          'razorpayPayout.failure_reason': payoutError instanceof Error ? payoutError.message : 'Unknown error',
        });

        throw payoutError;
      }

    } catch (error) {
      console.error('Error in triggerPayoutAfterUsdcPayment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check and update payout status for a transaction
   */
  async checkAndUpdatePayoutStatus(transactionId: string): Promise<PayoutResponse> {
    try {
      const TransactionModel = await getUpiTransactionCollection();

      const transaction = await TransactionModel.findById(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (!transaction.payoutTriggered || !transaction.razorpayPayout?.payout_id) {
        throw new Error('No payout initiated for this transaction');
      }

      // Get latest payout status from Razorpay
      const payoutDetails = await razorpayContactManager.getPayoutStatus(
        transaction.razorpayPayout.payout_id
      );

      // Update transaction with latest status
      const updateData: Record<string, string | Date | undefined> = {
        'razorpayPayout.status': payoutDetails.status,
      };

      if (payoutDetails.status === 'processed' && !transaction.razorpayPayout.payout_processed_at) {
        updateData['razorpayPayout.payout_processed_at'] = new Date();
      }

      if (payoutDetails.failure_reason) {
        updateData['razorpayPayout.failure_reason'] = payoutDetails.failure_reason;
      }

      await TransactionModel.findByIdAndUpdate(transactionId, updateData);

      return {
        success: true,
        payout_id: payoutDetails.id,
        status: payoutDetails.status,
        amount: payoutDetails.amount / 100,
        currency: payoutDetails.currency,
      };

    } catch (error) {
      console.error('Error checking payout status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all transactions that need payout status updates
   */
  async getPendingPayouts(): Promise<Array<{
    _id: string;
    upiId: string;
    merchantName: string;
    razorpayPayout: {
      payout_id?: string;
      status?: string;
      amount?: number;
      currency?: string;
      failure_reason?: string;
      payout_created_at?: Date;
      payout_processed_at?: Date;
      reference_id?: string;
    };
    inrAmount: string;
  }>> {
    const TransactionModel = await getUpiTransactionCollection();

    return TransactionModel.find({
      payoutTriggered: true,
      'razorpayPayout.status': { $in: ['pending', 'processing'] }
    }).select('_id upiId merchantName razorpayPayout inrAmount');
  }

  /**
   * Bulk update payout statuses for pending payouts
   */
  async updateAllPendingPayouts(): Promise<{ updated: number; errors: number }> {
    const pendingPayouts = await this.getPendingPayouts();
    let updated = 0;
    let errors = 0;

    for (const transaction of pendingPayouts) {
      try {
        await this.checkAndUpdatePayoutStatus(transaction._id.toString());
        updated++;
      } catch (error) {
        console.error(`Failed to update payout status for transaction ${transaction._id}:`, error);
        errors++;
      }
    }

    return { updated, errors };
  }

  /**
   * Get payout statistics
   */
  async getPayoutStats(): Promise<{
    totalPayouts: number;
    successfulPayouts: number;
    successRate: string;
    statusBreakdown: Record<string, { count: number; totalAmount: number }>;
  }> {
    const TransactionModel = await getUpiTransactionCollection();

    const stats = await TransactionModel.aggregate([
      {
        $match: { payoutTriggered: true }
      },
      {
        $group: {
          _id: '$razorpayPayout.status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$razorpayPayout.amount' }
        }
      }
    ]);

    const totalPayouts = await TransactionModel.countDocuments({ payoutTriggered: true });
    const successfulPayouts = await TransactionModel.countDocuments({
      payoutTriggered: true,
      'razorpayPayout.status': 'processed'
    });

    return {
      totalPayouts,
      successfulPayouts,
      successRate: totalPayouts > 0 ? (successfulPayouts / totalPayouts * 100).toFixed(2) : '0',
      statusBreakdown: stats.reduce((acc, stat) => {
        acc[stat._id || 'unknown'] = {
          count: stat.count,
          totalAmount: (stat.totalAmount || 0) / 100 // Convert from paisa to rupees
        };
        return acc;
      }, {} as Record<string, { count: number; totalAmount: number }>)
    };
  }
}

// Export singleton instance
export const payoutService = new PayoutService();
