import { NextRequest, NextResponse } from "next/server";
import { razorpayContactManager } from "@/lib/razorpay";
import { getUpiTransactionCollection } from "@/lib/getCollections";
import { PayoutRequest, PayoutResponse } from "@/types/upi.types";

export async function POST(request: NextRequest) {
  try {
    const body: PayoutRequest = await request.json();
    const { upiId, merchantName, amount, referenceId, transactionId, notes } = body;

    // Validate required fields
    if (!upiId || !merchantName || !amount || !referenceId || !transactionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: upiId, merchantName, amount, referenceId, transactionId'
      }, { status: 400 });
    }

    // Validate amount
    if (amount <= 0 || amount > 1000000) { // Max 10 lakh INR
      return NextResponse.json({
        success: false,
        error: 'Invalid amount. Must be between 1 and 10,00,000 INR'
      }, { status: 400 });
    }

    // Validate UPI ID format
    if (!upiId.includes('@')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid UPI ID format'
      }, { status: 400 });
    }

    const TransactionModel = await getUpiTransactionCollection();

    // Check if transaction exists and is successful
    const transaction = await TransactionModel.findById(transactionId);
    if (!transaction) {
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }

    if (!transaction.isSuccess) {
      return NextResponse.json({
        success: false,
        error: 'Cannot create payout for unsuccessful transaction'
      }, { status: 400 });
    }

    // Check if payout already exists
    if (transaction.payoutTriggered && transaction.razorpayPayout?.payout_id) {
      return NextResponse.json({
        success: false,
        error: 'Payout already initiated for this transaction'
      }, { status: 409 });
    }

    try {
      // Create payout via Razorpay
      const payout = await razorpayContactManager.createPayoutToUPI(
        upiId,
        merchantName,
        amount,
        referenceId,
        notes
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

      const response: PayoutResponse = {
        success: true,
        payout_id: payout.id,
        status: payout.status,
        amount: payout.amount / 100, // Convert from paisa to rupees
        currency: payout.currency,
      };

      return NextResponse.json(response, { status: 200 });

    } catch (payoutError) {
      console.error('Razorpay payout creation failed:', payoutError);

      // Update transaction with failure
      await TransactionModel.findByIdAndUpdate(transactionId, {
        payoutTriggered: true,
        'razorpayPayout.status': 'failed',
        'razorpayPayout.failure_reason': payoutError instanceof Error ? payoutError.message : 'Unknown error',
      });

      return NextResponse.json({
        success: false,
        error: `Payout creation failed: ${payoutError instanceof Error ? payoutError.message : 'Unknown error'}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing payout request:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error while processing payout'
    }, { status: 500 });
  }
}
