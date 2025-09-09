import { NextRequest, NextResponse } from "next/server";
import CashfreeService from "@/lib/cashfree";

interface GenerateQrCodeRequest {
  beneficiaryId: string;
  amount?: number;
  purpose?: string;
  remarks?: string;
  expiryDate?: string;
}

/**
 * POST /api/cashfree-qr/generate
 * Generates a QR code for UPI payment using beneficiary details
 * Body: { beneficiaryId, amount?, purpose?, remarks?, expiryDate? }
 * Response: { qrCodeId, qrCodeUrl, qrCodeString, upiString, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateQrCodeRequest = await request.json();
    const { beneficiaryId, amount, purpose, remarks, expiryDate } = body;

    // Validate required fields
    if (!beneficiaryId) {
      return NextResponse.json(
        {
          error: "Missing required field: beneficiaryId",
        },
        { status: 400 }
      );
    }

    // Initialize Cashfree service
    const cashfreeService = new CashfreeService();

    // Generate QR code
    const qrRequest = {
      amount,
      purpose,
      remarks,
      expiryDate,
    };

    const qrResponse = await cashfreeService.generateQrCode(beneficiaryId, qrRequest);

    if (qrResponse.status !== "SUCCESS") {
      return NextResponse.json(
        {
          error: qrResponse.message || "Failed to generate QR code",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      qrCode: qrResponse.data,
    });

  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      {
        error: "Internal server error while generating QR code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
