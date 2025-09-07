import { NextRequest, NextResponse } from "next/server";
import { parseAndValidateQr, formatQrDataForDisplay } from "@/lib/upi";

/**
 * POST /api/scans
 * Parses and validates UPI QR data
 * Body: { "qrData": "upi://pay?pa=merchant@upi&pn=Test Merchant&am=100.00" }
 * Response: { qrType, isValid, data, errors?, formattedData }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { qrData } = body;

    // Validate input
    if (!qrData || typeof qrData !== "string") {
      return NextResponse.json(
        {
          error:
            "Missing or invalid qrData field. Expected a string containing UPI QR data.",
        },
        { status: 400 }
      );
    }

    // Basic input sanitization and validation
    if (qrData.length > 2048) {
      return NextResponse.json(
        {
          error: "QR data too long. Maximum length is 2048 characters.",
        },
        { status: 400 }
      );
    }

    // Trim whitespace
    const trimmedQrData = qrData.trim();

    // Parse and validate the QR data
    const parsedResponse = parseAndValidateQr(trimmedQrData);

    // Format the data for human-readable display
    const formattedData = formatQrDataForDisplay(parsedResponse);

    // Return the response with both parsed data and formatted display
    return NextResponse.json(
      {
        ...parsedResponse,
        formattedData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing QR data:", error);

    return NextResponse.json(
      {
        error: "Internal server error while processing QR data",
      },
      { status: 500 }
    );
  }
}
