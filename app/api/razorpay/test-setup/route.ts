import { NextRequest, NextResponse } from "next/server";
import { razorpayTestService } from "@/lib/razorpay-test-service";

/**
 * POST /api/razorpay/test-setup
 * Create test customers and QR codes for testing payout functionality
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create_customers': {
        try {
          console.log('🔍 Starting customer creation...');
          const customers = await razorpayTestService.createTestCustomers();
          console.log('✅ Customer creation successful:', customers.length, 'customers created');
          return NextResponse.json({
            success: true,
            message: `Created ${customers.length} test customers`,
            customers: customers.map(c => ({
              id: c.id,
              name: c.name,
              email: c.email,
              contact: c.contact
            }))
          });
        } catch (error) {
          console.error('❌ Customer creation failed:', error);
          return NextResponse.json({
            success: false,
            error: 'Failed to create customers',
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }

      case 'create_qr_codes': {
        const customers = await razorpayTestService.getTestCustomers();
        if (customers.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'No test customers found. Please create customers first.'
          }, { status: 400 });
        }

        const qrCodes = await razorpayTestService.createQrCodesForCustomers(customers);

        if (qrCodes.length === 0) {
          return NextResponse.json({
            success: true,
            message: 'QR codes not available - UPI permissions not enabled on test account',
            qrCodes: [],
            note: 'QR codes require UPI permissions. You can still test payout functionality with the created customers.'
          });
        }

        const isMock = qrCodes.length > 0 && qrCodes[0].id.startsWith('mock_qr_');

        return NextResponse.json({
          success: true,
          message: isMock ? `Created ${qrCodes.length} mock QR codes for testing` : `Created ${qrCodes.length} QR codes`,
          qrCodes: qrCodes.map(q => ({
            id: q.id,
            name: q.name,
            amount: q.payment_amount ? q.payment_amount / 100 : null,
            image_url: q.image_url,
            status: q.status,
            upi_uri: q.upi_uri,
            test_upi_id: q.test_upi_id,
            is_mock: q.id.startsWith('mock_qr_')
          }))
        });
      }

      case 'setup_complete': {
        const customers = await razorpayTestService.createTestCustomers();
        const qrCodes = await razorpayTestService.createQrCodesForCustomers(customers);

        const isMock = qrCodes.length > 0 && qrCodes[0].id.startsWith('mock_qr_');

        return NextResponse.json({
          success: true,
          message: isMock ? 'Complete test setup finished with mock QR codes' : (qrCodes.length > 0 ? 'Complete test setup finished' : 'Test setup finished (QR codes not available)'),
          data: {
            customerCount: customers.length,
            qrCodeCount: qrCodes.length,
            customers: customers.map(c => ({
              id: c.id,
              name: c.name,
              email: c.email,
              contact: c.contact
            })),
            qrCodes: qrCodes.length > 0 ? qrCodes.map(q => ({
              id: q.id,
              name: q.name,
              amount: q.payment_amount ? q.payment_amount / 100 : null,
              image_url: q.image_url,
              status: q.status,
              upi_uri: q.upi_uri,
              test_upi_id: q.test_upi_id,
              is_mock: q.id.startsWith('mock_qr_')
            })) : [],
            note: qrCodes.length === 0 ? 'QR codes require UPI permissions. You can still test payout functionality with the created customers.' : null
          }
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: create_customers, create_qr_codes, or setup_complete'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in test setup:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to setup test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/razorpay/test-setup
 * Get status of test setup (customers and QR codes)
 */
export async function GET() {
  try {
    const status = await razorpayTestService.getTestSetupStatus();
    return NextResponse.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Error getting test setup status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get test setup status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/razorpay/test-setup
 * Clean up test data (close QR codes)
 */
export async function DELETE() {
  try {
    await razorpayTestService.cleanupTestData();
    return NextResponse.json({
      success: true,
      message: 'Test data cleanup completed'
    });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
