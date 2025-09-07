import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import CashfreeService from "@/lib/cashfree";

interface InitiatePayoutRequest {
  customerId: string;
  amount: number;
  remarks?: string;
  transferId?: string; // Optional, will generate if not provided
}

/**
 * POST /api/payouts/initiate
 * Initiates a payout to a customer via Cashfree Payout API
 * Body: { customerId, amount, remarks?, transferId? }
 * Response: { payout, customer, transferDetails }
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();

    // Parse request body
    const body: InitiatePayoutRequest = await request.json();
    const { customerId, amount, remarks, transferId } = body;

    // Validate required fields
    if (!customerId || !amount) {
      return NextResponse.json(
        {
          error: "Missing required fields: customerId and amount are required",
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0 || amount > 25000) {
      return NextResponse.json(
        {
          error: "Invalid amount. Must be between 0.01 and 25,000 INR",
        },
        { status: 400 }
      );
    }

    // Find customer
    const customer = await Customer.findOne({
      customerId,
      isActive: true,
      isBeneficiaryAdded: true
    });

    if (!customer) {
      return NextResponse.json(
        {
          error: "Customer not found, inactive, or not registered as beneficiary",
        },
        { status: 404 }
      );
    }

    // Check if customer is in test mode
    if (!customer.isTestMode) {
      return NextResponse.json(
        {
          error: "Production payouts not implemented yet. Use test mode customers only.",
        },
        { status: 400 }
      );
    }

    // Generate transfer ID if not provided
    const finalTransferId = transferId || `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Initialize Cashfree service
    const cashfreeService = new CashfreeService();

    let transferResponse = null;
    let transferError = null;

    try {
      // Initiate payout transfer
      transferResponse = await cashfreeService.initiateTransfer({
        beneId: customer.cashfreeBeneficiaryId || customer.customerId,
        amount,
        transferId: finalTransferId,
        remarks: remarks || `Payout to ${customer.name}`,
        transferMode: 'upi', // Use UPI for faster transfers
      });

      // Update customer statistics if transfer was successful
      if (transferResponse.status === 'SUCCESS') {
        customer.totalPaid += amount;
        customer.transactionCount += 1;
        customer.lastPaymentAt = new Date();
        await customer.save();
      }

    } catch (error) {
      console.error('Payout initiation error:', error);
      transferError = error instanceof Error ? error.message : 'Unknown error';

      // Log failed transaction attempt
      console.error(`Failed payout attempt for customer ${customerId}: ${transferError}`);
    }

    // Return response
    return NextResponse.json(
      {
        success: transferResponse?.status === 'SUCCESS',
        payout: {
          transferId: finalTransferId,
          amount,
          status: transferResponse?.status || 'FAILED',
          message: transferResponse?.message || transferError,
          referenceId: transferResponse?.data?.referenceId,
          utr: transferResponse?.data?.utr,
          acknowledged: transferResponse?.data?.acknowledged,
          initiatedAt: new Date().toISOString(),
        },
        customer: {
          customerId: customer.customerId,
          name: customer.name,
          email: customer.email,
          upiId: customer.upiId,
          totalPaid: customer.totalPaid,
          transactionCount: customer.transactionCount,
        },
        transferDetails: transferResponse?.data,
        error: transferError,
      },
      {
        status: transferResponse?.status === 'SUCCESS' ? 200 : 400
      }
    );

  } catch (error) {
    console.error("Error initiating payout:", error);

    return NextResponse.json(
      {
        error: "Internal server error while initiating payout",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
