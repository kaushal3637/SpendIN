import { NextRequest, NextResponse } from "next/server";
import CashfreeService from "@/lib/cashfree";

/**
 * GET /api/cashfree-beneficiary/[beneId]
 * Get beneficiary details from Cashfree
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ beneId: string }> }
) {
  try {
    const { beneId } = await params;

    if (!beneId) {
      return NextResponse.json(
        { error: "Beneficiary ID is required" },
        { status: 400 }
      );
    }

    const cashfreeService = new CashfreeService();
    const beneficiaryDetails = await cashfreeService.getBeneficiary(beneId);

    return NextResponse.json({
      success: true,
      beneficiary: beneficiaryDetails,
    });

  } catch (error) {
    console.error("Error fetching beneficiary details:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch beneficiary details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
