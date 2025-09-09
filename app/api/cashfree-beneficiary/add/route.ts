import { NextRequest, NextResponse } from "next/server";
import CashfreeService from "@/lib/cashfree";
import { CashfreeBeneficiary } from "@/types/cashfree.types";
import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";

interface AddBeneficiaryRequest {
  beneficiary_id: string;
  beneficiary_name: string;
  beneficiary_instrument_details: {
    bank_account_number?: string;
    bank_ifsc?: string;
    vpa?: string;
  };
  beneficiary_contact_details?: {
    beneficiary_email?: string;
    beneficiary_phone?: string;
    beneficiary_country_code?: string;
    beneficiary_address?: string;
    beneficiary_city?: string;
    beneficiary_state?: string;
    beneficiary_postal_code?: string;
  };
}

/**
 * POST /api/cashfree-beneficiary/add
 * Add a new beneficiary to Cashfree payout system
 * Body: Beneficiary details matching Cashfree V2 API format
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: AddBeneficiaryRequest = await request.json();
    const {
      beneficiary_id,
      beneficiary_name,
      beneficiary_instrument_details,
      beneficiary_contact_details,
    } = body;

    // Validate required fields
    if (
      !beneficiary_id ||
      !beneficiary_name ||
      !beneficiary_instrument_details
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: beneficiary_id, beneficiary_name, and beneficiary_instrument_details are required",
        },
        { status: 400 }
      );
    }

    // Validate that at least one instrument detail is provided
    const hasBankDetails =
      beneficiary_instrument_details.bank_account_number &&
      beneficiary_instrument_details.bank_ifsc;
    const hasVPA = beneficiary_instrument_details.vpa;

    if (!hasBankDetails && !hasVPA) {
      return NextResponse.json(
        {
          error:
            "Either bank account details (bank_account_number and bank_ifsc) or VPA must be provided",
        },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Create CashfreeBeneficiary object for the service
    const beneficiary: CashfreeBeneficiary = {
      beneId: beneficiary_id,
      name: beneficiary_name,
      email: beneficiary_contact_details?.beneficiary_email || "",
      phone: beneficiary_contact_details?.beneficiary_phone || "",
      address1:
        beneficiary_contact_details?.beneficiary_address || "Test Address",
      city: beneficiary_contact_details?.beneficiary_city || "Test City",
      state: beneficiary_contact_details?.beneficiary_state || "Test State",
      pincode: beneficiary_contact_details?.beneficiary_postal_code || "110001",
      ...(hasBankDetails && {
        bankAccount: {
          accountNumber: beneficiary_instrument_details.bank_account_number!,
          ifsc: beneficiary_instrument_details.bank_ifsc!,
          accountHolderName: beneficiary_name,
        },
      }),
      ...(hasVPA && {
        vpa: beneficiary_instrument_details.vpa,
      }),
    };

    // Initialize Cashfree service and add beneficiary
    const cashfreeService = new CashfreeService();
    const result = await cashfreeService.addBeneficiary(beneficiary);

    // Store beneficiary data in local database
    let customer;
    let localStorageResult = {
      success: false,
      message: "",
      customerId: null as string | null,
    };

    try {
      // Check if customer already exists with this beneficiary ID
      const existingCustomer = await Customer.findOne({
        $or: [
          { customerId: beneficiary_id },
          { cashfreeBeneficiaryId: beneficiary_id },
          ...(hasVPA ? [{ upiId: beneficiary_instrument_details.vpa }] : []),
        ],
      });

      if (existingCustomer) {
        // Update existing customer with new beneficiary information
        existingCustomer.cashfreeBeneficiaryId = beneficiary_id;
        existingCustomer.name = beneficiary_name;
        existingCustomer.email =
          beneficiary_contact_details?.beneficiary_email ||
          existingCustomer.email;
        existingCustomer.phone =
          beneficiary_contact_details?.beneficiary_phone ||
          existingCustomer.phone;
        if (hasVPA) {
          existingCustomer.upiId = beneficiary_instrument_details.vpa!;
          existingCustomer.upiName = beneficiary_name;
        }
        existingCustomer.isBeneficiaryAdded = true;
        existingCustomer.updatedAt = new Date();

        customer = await existingCustomer.save();

        localStorageResult = {
          success: true,
          message: "Existing customer updated with beneficiary information",
          customerId: customer.customerId,
        };
      } else {
        // Create new customer record
        const customerId = Customer.generateCustomerId();

        customer = new Customer({
          customerId,
          name: beneficiary_name,
          email:
            beneficiary_contact_details?.beneficiary_email ||
            `beneficiary_${beneficiary_id}@example.com`,
          phone: beneficiary_contact_details?.beneficiary_phone || "",
          upiId: hasVPA ? beneficiary_instrument_details.vpa : "",
          upiName: hasVPA ? beneficiary_name : "",
          cashfreeBeneficiaryId: beneficiary_id,
          qrCodeData: hasVPA
            ? `upi://pay?pa=${
                beneficiary_instrument_details.vpa
              }&pn=${encodeURIComponent(beneficiary_name)}&cu=INR`
            : "",
          isActive: true,
          isBeneficiaryAdded: true,
          isTestMode: true, // Since this is from test page
          totalReceived: 0,
          totalPaid: 0,
          transactionCount: 0,
        });

        await customer.save();

        localStorageResult = {
          success: true,
          message: "New customer created with beneficiary information",
          customerId: customer.customerId,
        };
      }
    } catch (dbError) {
      console.error("Error storing beneficiary in local database:", dbError);
      localStorageResult = {
        success: false,
        message: `Cashfree beneficiary added successfully, but local storage failed: ${
          dbError instanceof Error ? dbError.message : "Unknown database error"
        }`,
        customerId: null,
      };
    }

    return NextResponse.json({
      success: true,
      message: "Beneficiary processing completed",
      cashfree: {
        success: true,
        message: "Beneficiary added to Cashfree successfully",
        beneficiary: result.data,
      },
      localStorage: localStorageResult,
      customer: customer || null,
    });
  } catch (error) {
    console.error("Error adding beneficiary:", error);

    return NextResponse.json(
      {
        error: "Failed to add beneficiary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cashfree-beneficiary/add
 * Returns the expected request format for adding beneficiaries
 */
export async function GET() {
  return NextResponse.json({
    message: "Use POST method to add a beneficiary",
    expectedFormat: {
      beneficiary_id: "DARSHIT34793",
      beneficiary_name: "Darshit Bhalodi",
      beneficiary_instrument_details: {
        bank_account_number: "214546459735",
        bank_ifsc: "HDFC0000001",
        vpa: "darshitbhalodi@oksbi",
      },
      beneficiary_contact_details: {
        beneficiary_email: "darshit@example.com",
        beneficiary_phone: "9999999999",
        beneficiary_country_code: "+91",
        beneficiary_address: "Test Address",
        beneficiary_city: "Test City",
        beneficiary_state: "Test State",
        beneficiary_postal_code: "110001",
      },
    },
    notes: [
      "Either bank_account_number + bank_ifsc OR vpa must be provided",
      "beneficiary_contact_details is optional but recommended",
      "Uses Cashfree V2 API with header-based authentication",
    ],
  });
}
