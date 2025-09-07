import { NextRequest, NextResponse } from "next/server";
import { razorpayContactManager } from "@/lib/razorpay";
import { getUpiTransactionCollection } from "@/lib/getCollections";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    const payoutId = searchParams.get('payoutId');

    if (!transactionId && !payoutId) {
      return NextResponse.json({
        success: false,
        error: 'Either transactionId or payoutId is required'
      }, { status: 400 });
    }

    const TransactionModel = await getUpiTransactionCollection();

    let transaction;
    let razorpayPayoutId;

    if (transactionId) {
      transaction = await TransactionModel.findById(transactionId);
      if (!transaction) {
        return NextResponse.json({
          success: false,
          error: 'Transaction not found'
        }, { status: 404 });
      }

      if (!transaction.razorpayPayout?.payout_id) {
        return NextResponse.json({
          success: false,
          error: 'No payout initiated for this transaction'
        }, { status: 404 });
      }

      razorpayPayoutId = transaction.razorpayPayout.payout_id;
    } else {
      razorpayPayoutId = payoutId;
    }

    try {
      // Get payout status from Razorpay
      const payoutDetails = await razorpayContactManager.getPayoutStatus(razorpayPayoutId!);

      // Update transaction with latest status if we have transactionId
      if (transactionId && transaction) {
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
      }

      return NextResponse.json({
        success: true,
        payout: {
          id: payoutDetails.id,
          status: payoutDetails.status,
          amount: payoutDetails.amount / 100, // Convert from paisa to rupees
          currency: payoutDetails.currency,
          fees: payoutDetails.fees / 100,
          tax: payoutDetails.tax / 100,
          purpose: payoutDetails.purpose,
          utr: payoutDetails.utr,
          mode: payoutDetails.mode,
          reference_id: payoutDetails.reference_id,
          narration: payoutDetails.narration,
          failure_reason: payoutDetails.failure_reason,
          created_at: new Date(payoutDetails.created_at * 1000),
        },
        transaction: transactionId ? {
          id: transaction._id.toString(),
          upiId: transaction.upiId,
          merchantName: transaction.merchantName,
          inrAmount: transaction.inrAmount,
          payoutTriggered: transaction.payoutTriggered,
        } : undefined,
      }, { status: 200 });

    } catch (payoutError) {
      console.error('Error fetching payout status:', payoutError);

      return NextResponse.json({
        success: false,
        error: `Failed to fetch payout status: ${payoutError instanceof Error ? payoutError.message : 'Unknown error'}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing payout status request:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error while processing request'
    }, { status: 500 });
  }
}

// POST endpoint to check multiple payouts by transaction IDs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionIds } = body;

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'transactionIds array is required'
      }, { status: 400 });
    }

    if (transactionIds.length > 50) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 50 transaction IDs allowed'
      }, { status: 400 });
    }

    const TransactionModel = await getUpiTransactionCollection();

    // Get all transactions with payout information
    const transactions = await TransactionModel.find({
      _id: { $in: transactionIds },
      payoutTriggered: true,
      'razorpayPayout.payout_id': { $exists: true }
    });

    const results = [];

    for (const transaction of transactions) {
      try {
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

        await TransactionModel.findByIdAndUpdate(transaction._id, updateData);

        results.push({
          transactionId: transaction._id,
          payout: {
            id: payoutDetails.id,
            status: payoutDetails.status,
            amount: payoutDetails.amount / 100,
            currency: payoutDetails.currency,
            failure_reason: payoutDetails.failure_reason,
          },
          success: true,
        });

      } catch (payoutError) {
        results.push({
          transactionId: transaction._id,
          error: payoutError instanceof Error ? payoutError.message : 'Unknown error',
          success: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: transactionIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing batch payout status request:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error while processing request'
    }, { status: 500 });
  }
}
