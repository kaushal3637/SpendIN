import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import { generateCustomerQRCode } from "@/lib/qr-generator";

/**
 * GET /api/customers/[customerId]/qrcode
 * Generates and returns QR code for a customer
 * Query params: amount? (optional)
 * Response: { qrCodeDataURL, qrData, customer }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    // Connect to database
    await dbConnect();

    const { customerId } = await params;

    // Validate customer ID
    if (!customerId) {
      return NextResponse.json(
        {
          error: "Customer ID is required",
        },
        { status: 400 }
      );
    }

    // Find customer
    const customer = await Customer.findOne({
      customerId,
      isActive: true
    });

    if (!customer) {
      return NextResponse.json(
        {
          error: "Customer not found or inactive",
        },
        { status: 404 }
      );
    }

    // Get amount from query params (optional)
    const { searchParams } = new URL(request.url);
    const amountParam = searchParams.get('amount');
    const amount = amountParam ? parseFloat(amountParam) : undefined;

    // Validate amount if provided
    if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
      return NextResponse.json(
        {
          error: "Invalid amount. Must be a positive number",
        },
        { status: 400 }
      );
    }

    // Generate QR code
    const qrResult = await generateCustomerQRCode({
      upiId: customer.upiId,
      name: customer.upiName || customer.name,
      amount,
    });

    // Update customer's QR code data if amount is not specified
    if (!amount) {
      customer.qrCodeData = qrResult.qrData;
      await customer.save();
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        qrCodeDataURL: qrResult.qrCodeDataURL,
        qrData: qrResult.qrData,
        customer: {
          customerId: customer.customerId,
          name: customer.name,
          email: customer.email,
          upiId: customer.upiId,
          upiName: customer.upiName,
          isActive: customer.isActive,
          isTestMode: customer.isTestMode,
        },
        amount,
        message: "QR code generated successfully",
      },
      { status: 200 }
    );

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
