import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/test-mock-payment
 * Simulate a payment using mock QR codes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrId, upiId } = body;

    if (!qrId || !upiId) {
      return NextResponse.json({
        success: false,
        error: 'Both qrId and upiId are required'
      }, { status: 400 });
    }

    // Simulate payment processing based on UPI ID
    console.log(`🎯 Simulating payment for QR: ${qrId} with UPI: ${upiId}`);

    const mockPayments = {
      'success@razorpay': {
        status: 'success',
        message: 'Payment successful',
        transactionId: `txn_mock_success_${Date.now()}`,
        utr: `UTR${Date.now()}`,
        amount: 100
      },
      'failure@razorpay': {
        status: 'failed',
        message: 'Payment failed - insufficient funds',
        transactionId: `txn_mock_failed_${Date.now()}`,
        utr: null,
        amount: 0
      },
      'pending@razorpay': {
        status: 'pending',
        message: 'Payment is being processed',
        transactionId: `txn_mock_pending_${Date.now()}`,
        utr: null,
        amount: 0
      }
    };

    const paymentResult = mockPayments[upiId.toLowerCase() as keyof typeof mockPayments];

    if (paymentResult) {
      console.log(`✅ Mock payment result: ${paymentResult.status.toUpperCase()}`);

      return NextResponse.json({
        success: true,
        message: 'Mock payment processed successfully',
        payment: {
          qrId,
          upiId,
          status: paymentResult.status,
          message: paymentResult.message,
          transactionId: paymentResult.transactionId,
          utr: paymentResult.utr,
          amount: paymentResult.amount,
          timestamp: new Date().toISOString(),
          isMock: true
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `Unknown UPI ID: ${upiId}. Use: success@razorpay, failure@razorpay, or pending@razorpay`
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in mock payment:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process mock payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/test-mock-payment
 * Get information about mock payment testing
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Mock payment testing information',
    instructions: {
      step1: 'Get a mock QR code from /api/razorpay/test-setup',
      step2: 'Extract the test_upi_id from the QR code',
      step3: 'Call this endpoint with qrId and upiId',
      step4: 'Receive mock payment result based on UPI ID'
    },
    testUpiIds: {
      'success@razorpay': 'Always succeeds - ₹100 payment',
      'failure@razorpay': 'Always fails - insufficient funds',
      'pending@razorpay': 'Always pending - processing state'
    },
    example: {
      request: {
        qrId: 'mock_qr_cust_xxx',
        upiId: 'success@razorpay'
      },
      response: {
        success: true,
        payment: {
          status: 'success',
          message: 'Payment successful',
          transactionId: 'txn_mock_success_xxx',
          amount: 100
        }
      }
    }
  });
}
