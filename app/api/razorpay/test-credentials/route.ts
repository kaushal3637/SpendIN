import { NextResponse } from "next/server";
import { razorpayClient } from "@/lib/razorpay";

/**
 * GET /api/razorpay/test-credentials
 * Test Razorpay API credentials
 */
export async function GET() {
  try {
    console.log('Testing Razorpay credentials...');

    // Test 1: Get account balance (this should work with basic credentials)
    try {
      const balance = await razorpayClient.getAccountBalance();
      console.log('✅ Account balance check successful:', balance);
    } catch (balanceError: unknown) {
      const balanceErrorMessage = balanceError instanceof Error ? balanceError.message : String(balanceError);
      console.log('⚠️ Account balance check failed (might be expected):', balanceErrorMessage);

      // Test 2: Try to get customers (this should work with customer permissions)
      try {
        const customers = await razorpayClient.getCustomers();
        console.log('✅ Customer API access successful');
        return NextResponse.json({
          success: true,
          message: 'Razorpay credentials are working (customer API)',
          balance_error: balanceErrorMessage,
          customer_count: customers.items.length
        });
      } catch (customerError: unknown) {
        const customerErrorMessage = customerError instanceof Error ? customerError.message : String(customerError);
        console.log('❌ Customer API access failed:', customerErrorMessage);
        return NextResponse.json({
          success: false,
          message: 'Razorpay credentials may have issues',
          balance_error: balanceErrorMessage,
          customer_error: customerErrorMessage
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Razorpay credentials are fully working'
    });

  } catch (error) {
    console.error('❌ Razorpay credentials test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Razorpay credentials test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
