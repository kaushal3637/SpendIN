import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/test-upi-transaction
 * Simulate UPI transaction testing with Razorpay test UPI IDs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { upiId, amount = 100, description = "Test Transaction" } = body;

    if (!upiId) {
      return NextResponse.json({
        success: false,
        error: 'UPI ID is required'
      }, { status: 400 });
    }

    // Simulate UPI transaction processing
    console.log(`🎯 Testing UPI transaction with ID: ${upiId}`);
    console.log(`💰 Amount: ₹${amount}`);
    console.log(`📝 Description: ${description}`);

    // Razorpay test UPI IDs and their expected behaviors
    const testUpiIds = {
      'success@razorpay': {
        status: 'success',
        message: 'Payment successful',
        transactionId: `txn_success_${Date.now()}`,
        utr: `UTR${Date.now()}`
      },
      'failure@razorpay': {
        status: 'failed',
        message: 'Payment failed - insufficient funds',
        transactionId: `txn_failed_${Date.now()}`,
        utr: null
      },
      'pending@razorpay': {
        status: 'pending',
        message: 'Payment is being processed',
        transactionId: `txn_pending_${Date.now()}`,
        utr: null
      }
    };

    const upiResult = testUpiIds[upiId.toLowerCase() as keyof typeof testUpiIds];

    if (upiResult) {
      console.log(`✅ UPI Test Result: ${upiResult.status.toUpperCase()}`);

      return NextResponse.json({
        success: true,
        message: 'UPI transaction test completed',
        transaction: {
          upiId,
          amount,
          description,
          status: upiResult.status,
          message: upiResult.message,
          transactionId: upiResult.transactionId,
          utr: upiResult.utr,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      // For other UPI IDs, simulate a generic success
      console.log(`⚠️ Unknown UPI ID, simulating success`);

      return NextResponse.json({
        success: true,
        message: 'UPI transaction test completed (generic simulation)',
        transaction: {
          upiId,
          amount,
          description,
          status: 'success',
          message: 'Payment processed successfully',
          transactionId: `txn_generic_${Date.now()}`,
          utr: `UTR${Date.now()}`,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Error in UPI transaction test:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process UPI transaction test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/test-upi-transaction
 * Get information about test UPI IDs
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Test UPI IDs for Razorpay test mode',
    testUpiIds: {
      'success@razorpay': {
        description: 'Always succeeds',
        expectedStatus: 'success',
        useCase: 'Test successful payments'
      },
      'failure@razorpay': {
        description: 'Always fails',
        expectedStatus: 'failed',
        useCase: 'Test error handling'
      },
      'pending@razorpay': {
        description: 'Stays in pending state',
        expectedStatus: 'pending',
        useCase: 'Test pending payment flows'
      }
    },
    instructions: {
      step1: 'Use any of the test UPI IDs above',
      step2: 'Call this endpoint with the UPI ID and amount',
      step3: 'The response will simulate the payment result',
      step4: 'Use this for testing your payment flow logic'
    }
  });
}
