import { NextRequest, NextResponse } from "next/server";
import { getUpiTransactionCollection } from "@/lib/getCollections";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transactionId,
      txnHash,
      isSuccess,
      walletAddress
    } = body;

    // Validate required fields
    if (!transactionId) {
      return NextResponse.json({
        error: 'Missing required field: transactionId'
      }, { status: 400 });
    }

    const TransactionModel = await getUpiTransactionCollection();

    // Find and update the transaction
    const updateData: {
      paidAt: Date;
      txnHash?: string;
      isSuccess?: boolean;
      walletAddress?: string;
    } = {
      paidAt: new Date()
    };

    if (txnHash !== undefined) {
      updateData.txnHash = txnHash;
    }

    if (isSuccess !== undefined) {
      updateData.isSuccess = isSuccess;
    }

    if (walletAddress !== undefined) {
      updateData.walletAddress = walletAddress;
    }

    const updatedTransaction = await TransactionModel.findByIdAndUpdate(
      transactionId,
      updateData,
      { new: true }
    );

    if (!updatedTransaction) {
      return NextResponse.json({
        error: 'Transaction not found'
      }, { status: 404 });
    }

    console.log('Transaction updated successfully:', updatedTransaction._id);

    return NextResponse.json({
      success: true,
      message: 'Transaction updated successfully',
      transaction: updatedTransaction
    });

  } catch (error) {
    console.error('Error updating UPI transaction:', error);

    // Handle duplicate transaction hash error
    if (error && typeof error === 'object' && 'code' in error) {
      const mongoError = error as { code?: number; keyPattern?: Record<string, number> };
      if (mongoError.code === 11000 && mongoError.keyPattern?.txnHash) {
        return NextResponse.json({
          error: 'Transaction hash already exists'
        }, { status: 409 });
      }
    }

    return NextResponse.json({
      error: 'Failed to update transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
