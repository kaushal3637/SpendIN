import { NextRequest, NextResponse } from "next/server";
import { getUpiTransactionCollection } from "@/lib/getCollections";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      upiId,
      merchantName,
      totalUsdToPay,
      inrAmount,
      walletAddress,
      txnHash,
      isSuccess = false
    } = body;

    // Validate required fields
    if (!upiId || !merchantName || !totalUsdToPay || !inrAmount) {
      return NextResponse.json({
        error: 'Missing required fields: upiId, merchantName, totalUsdToPay, inrAmount'
      }, { status: 400 });
    }

    const TransactionModel = await getUpiTransactionCollection();

    // Create transaction data
    const transactionData = {
      upiId,
      merchantName,
      totalUsdToPay: totalUsdToPay.toString(),
      inrAmount: inrAmount.toString(),
      walletAddress,
      txnHash,
      isSuccess,
      scannedAt: new Date(),
    };

    // Store the transaction
    const transaction = new TransactionModel(transactionData);
    const savedTransaction = await transaction.save();

    console.log('Transaction stored successfully:', savedTransaction._id);

    return NextResponse.json({
      success: true,
      message: 'Transaction stored successfully',
      transactionId: savedTransaction._id
    });

  } catch (error) {
    console.error('Error storing UPI transaction:', error);

    // Handle duplicate transaction hash error
    if (error && typeof error === 'object' && 'code' in error) {
      const mongoError = error as { code?: number; keyPattern?: Record<string, number> };
      if (mongoError.code === 11000 && mongoError.keyPattern?.txnHash) {
        return NextResponse.json({
          error: 'Transaction already exists'
        }, { status: 409 });
      }
    }

    return NextResponse.json({
      error: 'Failed to store transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
