import { NextRequest, NextResponse } from "next/server";
import CashfreeService from "@/lib/cashfree";

/**
 * GET /api/cashfree-qr/[qrCodeId]
 * Retrieves QR code details by QR code ID
 * Response: { qrCodeId, qrCodeUrl, qrCodeString, status, ... }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ qrCodeId: string }> }) {
  try {
    const { qrCodeId } = await params;

    if (!qrCodeId) {
      return NextResponse.json(
        {
          error: "QR code ID is required",
        },
        { status: 400 }
      );
    }

    // Initialize Cashfree service
    const cashfreeService = new CashfreeService();

    // Get QR code details
    const qrResponse = await cashfreeService.getQrCodeDetails(qrCodeId);

    if (qrResponse.status !== "SUCCESS") {
      return NextResponse.json(
        {
          error: qrResponse.message || "Failed to retrieve QR code details",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      qrCode: qrResponse.data,
    });

  } catch (error) {
    console.error("Error retrieving QR code details:", error);
    return NextResponse.json(
      {
        error: "Internal server error while retrieving QR code details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
