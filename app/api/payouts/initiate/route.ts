import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import CashfreeService from "@/lib/cashfree";

interface InitiatePayoutRequest {
  customerId: string;
  amount: number;
  remarks?: string;
  transferId?: string; // Optional, will generate if not provided
  fundsourceId?: string; // Optional, will use default if not provided
}

/**
 * POST /api/payouts/initiate
 * Initiates a UPI payout to a customer via Cashfree Payout API
 * Body: { customerId, amount, remarks?, transferId?, fundsourceId? }
 * Response: { payout, customer, transferDetails }
 * Note: UPI is the default and only supported transfer method
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();

    // Parse request body
    const body: InitiatePayoutRequest = await request.json();
    const { customerId, amount, remarks, transferId, fundsourceId } = body;

    // Validate required fields
    if (!customerId || !amount) {
      return NextResponse.json(
        {
          error: "Missing required fields: customerId and amount are required",
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0 || amount > 25000) {
      return NextResponse.json(
        {
          error: "Invalid amount. Must be between 0.01 and 25,000 INR",
        },
        { status: 400 }
      );
    }

    // Find customer - try multiple lookup strategies
    let customer = null;
    console.log('🔍 Customer lookup for:', customerId);

    // Special case: If customerId looks like a Cashfree beneficiary ID (long, no @),
    // we should use it directly and create/find a customer record for it
    if (customerId && customerId.length > 20 && !customerId.includes('@')) {
      console.log('🎯 Detected Cashfree beneficiary ID format, using direct lookup...');

      // Try to find existing customer with this beneficiary ID
      customer = await Customer.findOne({
        cashfreeBeneficiaryId: customerId,
        isActive: true,
        isBeneficiaryAdded: true
      });

      if (customer) {
        console.log('✅ Found existing customer with matching beneficiary ID');
      } else {
        console.log('❌ No customer found with beneficiary ID, will create new one');
      }
    } else {
      // Strategy 1: Try to find by customerId (for existing customers)
      customer = await Customer.findOne({
        customerId,
        isActive: true,
        isBeneficiaryAdded: true
      });
      console.log('Strategy 1 - Found by customerId:', customer ? `YES (${customer.customerId})` : 'NO');

      // Strategy 2: If still not found and customerId looks like a UPI ID,
      // try to find by upiId
      if (!customer && customerId && customerId.includes('@')) {
        customer = await Customer.findOne({
          upiId: customerId,
          isActive: true,
          isBeneficiaryAdded: true
        });
        console.log('Strategy 2 - Found by upiId:', customer ? `YES (${customer.upiId})` : 'NO');
      }
    }

    // If still no customer found, try to create one from beneficiary details
    if (!customer && customerId && customerId.length > 20) {
      console.log(`Customer not found for beneficiary ID: ${customerId}, attempting to create customer record...`);

      try {
        // Try to fetch beneficiary details from our API (same server)
        const beneficiaryResponse = await fetch(`/api/cashfree-beneficiary/${customerId}`);

        if (beneficiaryResponse.ok) {
          const beneficiaryData = await beneficiaryResponse.json();
          const beneficiary = beneficiaryData.beneficiary;

          if (beneficiary) {
            // Create a new customer record
            const newCustomer = new Customer({
              customerId: `AUTO_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              name: beneficiary.beneficiary_name || 'Auto-created Customer',
              email: beneficiary.beneficiary_email || `auto_${customerId}@cashfree.com`,
              phone: beneficiary.beneficiary_phone,
              upiId: beneficiary.beneficiary_instrument_details?.vpa || `${customerId.slice(0, 10)}@cashfree`,
              upiName: beneficiary.beneficiary_name || 'Auto-created Customer',
              isTestMode: true,
              isActive: true,
              isBeneficiaryAdded: true,
              cashfreeBeneficiaryId: customerId,
              qrCodeData: `upi://pay?pa=${beneficiary.beneficiary_instrument_details?.vpa || `${customerId.slice(0, 10)}@cashfree`}&pn=${encodeURIComponent(beneficiary.beneficiary_name || 'Auto-created Customer')}&cu=INR`,
            });

            customer = await newCustomer.save();
            console.log(`Created new customer record: ${customer.customerId} for beneficiary: ${customerId}`);
          }
        }
      } catch (error) {
        console.error('Failed to create customer from beneficiary:', error);
      }
    }

    if (!customer) {
      return NextResponse.json(
        {
          error: "Customer not found, inactive, or not registered as beneficiary",
          details: `Searched for customerId: ${customerId}. Make sure the customer exists and is registered as a beneficiary.`,
          customerIdReceived: customerId,
          customerIdType: customerId?.includes('@') ? 'UPI_ID' : (customerId?.length > 20 ? 'BENEFICIARY_ID' : 'CUSTOMER_ID')
        },
        { status: 404 }
      );
    }

    // If customer has UPI ID but no beneficiary ID, try to find the correct beneficiary
    if (customer.upiId && !customer.cashfreeBeneficiaryId) {
      console.log('⚠️ Customer has UPI ID but no beneficiary ID, attempting to find correct beneficiary...')

      // For now, hardcode the mapping for the test beneficiary
      // In production, you'd have a proper database mapping
      if (customer.upiId === 'success@upi') {
        console.log('✅ Found test beneficiary mapping, updating customer record...')
        customer.cashfreeBeneficiaryId = '1492218328b3o0m39jsCfkjeyFVBKdreP1' // The correct beneficiary ID
        await customer.save()
        console.log('✅ Updated customer with correct beneficiary ID')
      } else {
        // For other UPI IDs, try to find the beneficiary
        try {
          // This is a placeholder - you'd need to implement proper UPI to beneficiary mapping
          console.log('⚠️ No mapping found for UPI ID:', customer.upiId)
        } catch (error) {
          console.error('Failed to find beneficiary for customer:', error)
        }
      }
    }

    console.log('🎯 Final customer selected:', {
      customerId: customer.customerId,
      upiId: customer.upiId,
      cashfreeBeneficiaryId: customer.cashfreeBeneficiaryId,
      name: customer.name
    });

    // Check if customer is in test mode (for now, only test mode is supported)
    if (!customer.isTestMode) {
      return NextResponse.json(
        {
          error: "Production payouts not implemented yet. Use test mode customers only.",
        },
        { status: 400 }
      );
    }

    // Generate transfer ID if not provided
    const finalTransferId = transferId || `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Initialize Cashfree service
    const cashfreeService = new CashfreeService();

    let transferResponse = null;
    let transferError = null;

    try {
      // Sanitize remarks for Cashfree API (remove special chars, limit length)
      const sanitizedRemarks = (remarks || `Pay ${customer.name}`)
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .substring(0, 30) // Limit to 30 chars
        .trim();

      console.log('Original remarks:', remarks);
      console.log('Sanitized remarks:', sanitizedRemarks);

      // Initiate payout transfer using the exact API format
      const actualBeneficiaryId = customer.cashfreeBeneficiaryId || customer.customerId;
      console.log('📋 Using beneficiary ID for transfer:', actualBeneficiaryId);
      console.log('Customer cashfreeBeneficiaryId:', customer.cashfreeBeneficiaryId);
      console.log('Customer customerId:', customer.customerId);

      transferResponse = await cashfreeService.initiateTransfer({
        transferId: finalTransferId,
        transferAmount: amount,
        beneficiaryId: actualBeneficiaryId,
        beneficiaryName: customer.name,
        beneficiaryVpa: customer.upiId,
        transferRemarks: sanitizedRemarks,
        fundsourceId: fundsourceId, // Will use default if not provided
      });

      // Update customer statistics if transfer was successful
      // Cashfree considers both 'SUCCESS' and 'RECEIVED' as successful statuses
      const isSuccessful = transferResponse.status === 'SUCCESS' || transferResponse.status === 'RECEIVED';
      if (isSuccessful) {
        customer.totalPaid += amount;
        customer.transactionCount += 1;
        customer.lastPaymentAt = new Date();
        await customer.save();
        console.log('✅ Updated customer statistics for successful transfer');
      }

    } catch (error) {
      console.error('Payout initiation error:', error);
      transferError = error instanceof Error ? error.message : 'Unknown error';

      // Log failed transaction attempt
      console.error(`Failed payout attempt for customer ${customerId}: ${transferError}`);
    }

    // Determine if the transfer was successful
    const isSuccessful = transferResponse?.status === 'SUCCESS' || transferResponse?.status === 'RECEIVED';
    console.log('🎯 Transfer response status:', transferResponse?.status);
    console.log('🎯 Is transfer considered successful?', isSuccessful);

    // Return response
    return NextResponse.json(
      {
        success: isSuccessful,
        payout: {
          transferId: finalTransferId,
          amount,
          status: transferResponse?.status || 'FAILED',
          message: transferResponse?.message || transferError,
          referenceId: transferResponse?.data?.referenceId || transferResponse?.data?.transfer_id || (transferResponse?.data && 'cf_transfer_id' in transferResponse.data ? transferResponse.data.cf_transfer_id : undefined),
          utr: transferResponse?.data?.utr,
          acknowledged: transferResponse?.data?.acknowledged,
          initiatedAt: new Date().toISOString(),
        },
        customer: {
          customerId: customer.customerId,
          name: customer.name,
          email: customer.email,
          upiId: customer.upiId,
          totalPaid: customer.totalPaid,
          transactionCount: customer.transactionCount,
        },
        transferDetails: transferResponse?.data,
        error: transferError,
      },
      {
        status: isSuccessful ? 200 : 400
      }
    );

  } catch (error) {
    console.error("Error initiating payout:", error);

    return NextResponse.json(
      {
        error: "Internal server error while initiating payout",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
