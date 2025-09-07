import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import CashfreeService, { CashfreeBeneficiary } from "@/lib/cashfree";

interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
  upiId?: string; // Optional - will generate test UPI if not provided
  upiName?: string;
  isTestMode?: boolean;
}

/**
 * POST /api/customers/create
 * Creates a new customer with UPI ID and registers them as Cashfree beneficiary
 * Body: { name, email, phone?, upiId?, upiName?, isTestMode? }
 * Response: { customer, beneficiary, qrCodeData }
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();

    // Parse request body
    const body: CreateCustomerRequest = await request.json();
    const { name, email, phone, upiId, upiName, isTestMode = true } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        {
          error: "Missing required fields: name and email are required",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: "Invalid email format",
        },
        { status: 400 }
      );
    }

    // Check if customer with this email already exists
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
    if (existingCustomer) {
      return NextResponse.json(
        {
          error: "Customer with this email already exists",
          customerId: existingCustomer.customerId,
        },
        { status: 409 }
      );
    }

    // Generate or validate UPI ID
    let finalUpiId = upiId;
    if (!finalUpiId) {
      // Generate test UPI ID
      finalUpiId = CashfreeService.generateTestUpiId(name);
    } else {
      // Validate provided UPI ID format
      if (!CashfreeService.validateUpiId(finalUpiId)) {
        return NextResponse.json(
          {
            error: "Invalid UPI ID format. Expected format: username@provider",
          },
          { status: 400 }
        );
      }

      // Check if UPI ID is already taken
      const existingUpiCustomer = await Customer.findOne({ upiId: finalUpiId });
      if (existingUpiCustomer) {
        return NextResponse.json(
          {
            error: "UPI ID is already registered to another customer",
          },
          { status: 409 }
        );
      }
    }

    // Generate unique customer ID
    const customerId = Customer.generateCustomerId();

    // Create customer instance
    const customer = new Customer({
      customerId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      upiId: finalUpiId,
      upiName: upiName?.trim() || name.trim(),
      isTestMode,
      qrCodeData: "", // Will be set after customer creation
    });

    // Generate QR code data
    customer.qrCodeData = customer.generateUpiQrData();

    // Save customer to database
    await customer.save();

    // Initialize Cashfree service
    const cashfreeService = new CashfreeService();

    let beneficiaryResponse = null;
    let beneficiaryError = null;

    try {
      // Prepare beneficiary details for Cashfree
      const beneficiaryDetails: CashfreeBeneficiary = customer.getBeneficiaryDetails();

      // Add beneficiary to Cashfree
      beneficiaryResponse = await cashfreeService.addBeneficiary(beneficiaryDetails);

      // Update customer with beneficiary ID if successful
      if (beneficiaryResponse.status === 'SUCCESS' && beneficiaryResponse.data) {
        customer.cashfreeBeneficiaryId = beneficiaryResponse.data.beneId;
        customer.isBeneficiaryAdded = true;
        await customer.save();
      }
    } catch (error) {
      console.error('Failed to add beneficiary:', error);
      beneficiaryError = error instanceof Error ? error.message : 'Unknown error';

      // Don't fail the entire request if beneficiary addition fails
      // Customer can still be used, beneficiary can be added later
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        customer: {
          customerId: customer.customerId,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          upiId: customer.upiId,
          upiName: customer.upiName,
          isActive: customer.isActive,
          isBeneficiaryAdded: customer.isBeneficiaryAdded,
          isTestMode: customer.isTestMode,
          createdAt: customer.createdAt,
          qrCodeData: customer.qrCodeData,
        },
        beneficiary: beneficiaryResponse ? {
          status: beneficiaryResponse.status,
          message: beneficiaryResponse.message,
          beneId: beneficiaryResponse.data?.beneId,
        } : null,
        beneficiaryError,
        message: "Customer created successfully",
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating customer:", error);

    // Handle duplicate key errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        {
          error: "Customer with this information already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error while creating customer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
