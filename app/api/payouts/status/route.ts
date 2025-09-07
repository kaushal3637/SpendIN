import { NextRequest, NextResponse } from "next/server";
import CashfreeService from "@/lib/cashfree";

/**
 * GET /api/payouts/status?transferId=TRANSFER_ID
 * Gets the status of a payout transfer
 * Query params: transferId
 * Response: { status, transferDetails }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transferId = searchParams.get('transferId');

    // Validate transfer ID
    if (!transferId) {
      return NextResponse.json(
        {
          error: "Transfer ID is required",
        },
        { status: 400 }
      );
    }

    // Initialize Cashfree service
    const cashfreeService = new CashfreeService();

    // Get transfer status
    const statusResponse = await cashfreeService.getTransferStatus(transferId);

    // Return response
    return NextResponse.json(
      {
        success: statusResponse.status === 'SUCCESS',
        status: statusResponse.status,
        message: statusResponse.message,
        transferDetails: statusResponse.data,
        requestedAt: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error getting payout status:", error);

    return NextResponse.json(
      {
        error: "Internal server error while getting payout status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
