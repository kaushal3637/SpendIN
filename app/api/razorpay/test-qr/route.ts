import { NextRequest, NextResponse } from "next/server";
import { razorpayTestService } from "@/lib/razorpay-test-service";

/**
 * POST /api/razorpay/test-qr
 * Create a QR code for a test customer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, amount, name } = body;

    if (!customerId) {
      return NextResponse.json({
        success: false,
        error: 'Customer ID is required'
      }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Valid amount is required'
      }, { status: 400 });
    }

    const qrCode = await razorpayTestService.createQrCodeForCustomer(
      customerId,
      amount,
      name
    );

    return NextResponse.json({
      success: true,
      message: 'QR code created successfully',
      qrCode: {
        id: qrCode.id,
        name: qrCode.name,
        amount: qrCode.payment_amount ? qrCode.payment_amount / 100 : null,
        image_url: qrCode.image_url,
        status: qrCode.status,
        customer_id: qrCode.customer_id,
        created_at: qrCode.created_at
      }
    });
  } catch (error) {
    console.error('Error creating QR code:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create QR code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/razorpay/test-qr
 * Get all test QR codes
 */
export async function GET() {
  try {
    const qrCodes = await razorpayTestService.getTestQrCodes();
    return NextResponse.json({
      success: true,
      qrCodes: qrCodes.map(q => ({
        id: q.id,
        name: q.name,
        amount: q.payment_amount ? q.payment_amount / 100 : null,
        image_url: q.image_url,
        status: q.status,
        customer_id: q.customer_id,
        created_at: q.created_at
      }))
    });
  } catch (error) {
    console.error('Error getting test QR codes:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get test QR codes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
