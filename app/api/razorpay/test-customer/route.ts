import { NextRequest, NextResponse } from "next/server";
import { razorpayTestService } from "@/lib/razorpay-test-service";

/**
 * POST /api/razorpay/test-customer
 * Create a single test customer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, contact, notes } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Customer name is required'
      }, { status: 400 });
    }

    const customer = await razorpayTestService.createSingleTestCustomer({
      name,
      email,
      contact,
      notes: {
        ...notes,
        test_type: 'individual_test'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Test customer created successfully',
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        contact: customer.contact,
        created_at: customer.created_at
      }
    });
  } catch (error) {
    console.error('Error creating test customer:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create test customer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/razorpay/test-customer
 * Get all test customers
 */
export async function GET() {
  try {
    const customers = await razorpayTestService.getTestCustomers();
    return NextResponse.json({
      success: true,
      customers: customers.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        contact: c.contact,
        created_at: c.created_at
      }))
    });
  } catch (error) {
    console.error('Error getting test customers:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get test customers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
