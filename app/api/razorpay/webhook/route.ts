import { NextRequest, NextResponse } from "next/server";
import { getUpiTransactionCollection } from "@/lib/getCollections";
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-razorpay-signature');

    // Verify webhook signature (optional but recommended for security)
    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
        .update(JSON.stringify(body))
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const { event, payload } = body;

    console.log('Received Razorpay webhook:', event);

    // Handle different webhook events
    switch (event) {
      case 'payout.processed':
        await handlePayoutProcessed(payload);
        break;

      case 'payout.failed':
        await handlePayoutFailed(payload);
        break;

      case 'payout.reversed':
        await handlePayoutReversed(payload);
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handlePayoutProcessed(payload: { payout: { id: string; utr?: string; fees?: number; tax?: number } }) {
  const payout = payload.payout;
  const TransactionModel = await getUpiTransactionCollection();

  // Find transaction by payout ID
  const transaction = await TransactionModel.findOne({
    'razorpayPayout.payout_id': payout.id
  });

  if (transaction) {
    await TransactionModel.findByIdAndUpdate(transaction._id, {
      'razorpayPayout.status': 'processed',
      'razorpayPayout.payout_processed_at': new Date(),
      'razorpayPayout.utr': payout.utr,
      'razorpayPayout.fees': payout.fees,
      'razorpayPayout.tax': payout.tax,
    });

    console.log(`Payout processed for transaction ${transaction._id}:`, payout.id);
  } else {
    console.warn('Transaction not found for payout ID:', payout.id);
  }
}

async function handlePayoutFailed(payload: { payout: { id: string; failure_reason?: string } }) {
  const payout = payload.payout;
  const TransactionModel = await getUpiTransactionCollection();

  const transaction = await TransactionModel.findOne({
    'razorpayPayout.payout_id': payout.id
  });

  if (transaction) {
    await TransactionModel.findByIdAndUpdate(transaction._id, {
      'razorpayPayout.status': 'failed',
      'razorpayPayout.failure_reason': payout.failure_reason || 'Payout failed',
      'razorpayPayout.payout_processed_at': new Date(),
    });

    console.log(`Payout failed for transaction ${transaction._id}:`, payout.failure_reason);
  } else {
    console.warn('Transaction not found for payout ID:', payout.id);
  }
}

async function handlePayoutReversed(payload: { payout: { id: string } }) {
  const payout = payload.payout;
  const TransactionModel = await getUpiTransactionCollection();

  const transaction = await TransactionModel.findOne({
    'razorpayPayout.payout_id': payout.id
  });

  if (transaction) {
    await TransactionModel.findByIdAndUpdate(transaction._id, {
      'razorpayPayout.status': 'cancelled',
      'razorpayPayout.failure_reason': 'Payout reversed',
      'razorpayPayout.payout_processed_at': new Date(),
    });

    console.log(`Payout reversed for transaction ${transaction._id}:`, payout.id);
  } else {
    console.warn('Transaction not found for payout ID:', payout.id);
  }
}
