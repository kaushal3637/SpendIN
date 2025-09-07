import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/lib/payout-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json({
        success: false,
        error: 'transactionId is required'
      }, { status: 400 });
    }

    // Trigger payout after USDC payment
    const result = await payoutService.triggerPayoutAfterUsdcPayment(transactionId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'INR payout initiated successfully',
        payout: {
          payout_id: result.payout_id,
          status: result.status,
          amount: result.amount,
          currency: result.currency,
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to initiate payout'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error triggering payout:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error while triggering payout'
    }, { status: 500 });
  }
}

// GET endpoint to check payout stats
export async function GET() {
  try {
    const stats = await payoutService.getPayoutStats();

    return NextResponse.json({
      success: true,
      stats
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching payout stats:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch payout statistics'
    }, { status: 500 });
  }
}
