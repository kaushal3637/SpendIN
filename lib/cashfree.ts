import { getCashfreeConfig } from "@/config/constant";
import {
  CashfreeBeneficiary,
  CashfreeBeneficiaryResponse,
  CashfreeTransferRequest,
  CashfreeTransferResponse,
  CashfreeTransferStatusResponse,
  CashfreeBeneficiaryDetailsResponse,
} from "@/types/cashfree.types";
class CashfreeService {
  private config: ReturnType<typeof getCashfreeConfig>;

  constructor() {
    this.config = getCashfreeConfig();
  }

  /**
   * Get authorization token from Cashfree V2 API
   * According to docs: https://www.cashfree.com/docs/api-reference/payouts/v2/beneficiary-v2/get-beneficiary-v2
   */
  private async getAuthToken(): Promise<string> {
    try {
      console.log("🔐 Attempting Cashfree V2 authentication...");

      // V2 API uses header-based authentication, not Bearer tokens
      const response = await fetch(
        `${this.config.BASE_URL}/payout/v1/authorize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-version": "2024-01-01", // Updated to latest API version
            "x-client-id": this.config.CLIENT_ID,
            "x-client-secret": this.config.CLIENT_SECRET,
          },
          body: JSON.stringify({}), // Empty body for V2 auth
        }
      );

      console.log("📊 Auth Response Status:", response.status);
      console.log(
        "📊 Auth Response Headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ Cashfree auth HTTP error:",
          response.status,
          errorText
        );
        throw new Error(
          `Auth failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("📄 Cashfree auth response:", JSON.stringify(data, null, 2));

      if (data.status !== "SUCCESS" || !data.data?.token) {
        console.error(
          "❌ Cashfree auth failed:",
          data.message || "Invalid response"
        );
        throw new Error(`Auth failed: ${data.message || "Invalid response"}`);
      }

      console.log("✅ Cashfree V2 authentication successful!");
      return data.data.token;
    } catch (error) {
      console.error("💥 Cashfree auth error:", error);
      throw new Error(
        `Failed to authenticate with Cashfree: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Test authentication by getting a token
   */
  async testAuthentication(): Promise<{
    success: boolean;
    token?: string;
    error?: string;
  }> {
    try {
      const token = await this.getAuthToken();
      return { success: true, token };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Add a beneficiary for payouts
   */
  async addBeneficiary(
    beneficiary: CashfreeBeneficiary
  ): Promise<CashfreeBeneficiaryResponse> {
    try {
      console.log("🔄 Adding beneficiary to Cashfree V2 API...");

      // V2 API format according to Cashfree documentation
      const requestBody = {
        beneficiary_id: beneficiary.beneId,
        beneficiary_name: beneficiary.name,
        beneficiary_instrument_details: {
          bank_account_number:
            beneficiary.bankAccount?.accountNumber || "1234567890",
          bank_ifsc: beneficiary.bankAccount?.ifsc || "HDFC0000001",
          ...(beneficiary.vpa && { vpa: beneficiary.vpa }),
        },
        beneficiary_contact_details: {
          beneficiary_email: beneficiary.email,
          beneficiary_phone: beneficiary.phone || "9999999999",
          beneficiary_country_code: "+91",
          beneficiary_address: beneficiary.address1 || "Test Address",
          beneficiary_city: beneficiary.city || "Test City",
          beneficiary_state: beneficiary.state || "Test State",
          beneficiary_postal_code: beneficiary.pincode || "110001",
        },
      };

      console.log(
        "📤 Creating beneficiary with V2 format:",
        JSON.stringify(requestBody, null, 2)
      );

      const response = await fetch(
        `${this.config.BASE_URL}/payout/beneficiary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-version": "2024-01-01",
            "x-client-id": this.config.CLIENT_ID,
            "x-client-secret": this.config.CLIENT_SECRET,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Beneficiary creation failed:", errorData);
        throw new Error(
          `Add beneficiary failed: ${errorData.message || response.statusText}`
        );
      }

      const data = await response.json();
      console.log("✅ Beneficiary created successfully:", data);

      // V2 API response format
      return {
        status: "SUCCESS",
        message: "Beneficiary added successfully",
        data: {
          beneficiary_id: data.beneficiary_id,
          beneficiary_name: data.beneficiary_name,
          beneficiary_status: data.beneficiary_status,
          added_on: data.added_on,
        },
      };
    } catch (error) {
      console.error("Add beneficiary error:", error);
      throw new Error(
        `Failed to add beneficiary: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Initiate a payout transfer
   */
  async initiateTransfer(
    transferRequest: CashfreeTransferRequest
  ): Promise<CashfreeTransferResponse> {
    try {
      console.log("💸 Initiating transfer via Cashfree V2 API...");

      const requestBody = {
        beneficiary_id: transferRequest.beneId,
        amount: transferRequest.amount.toFixed(2),
        transfer_id: transferRequest.transferId,
        transfer_mode: transferRequest.transferMode || "upi", // Default to UPI
        remarks: transferRequest.remarks || "UPI Payout",
      };

      console.log("📤 Transfer request:", JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.config.BASE_URL}/payout/transfers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2024-01-01",
          "x-client-id": this.config.CLIENT_ID,
          "x-client-secret": this.config.CLIENT_SECRET,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Transfer failed:", errorData);
        throw new Error(
          `Transfer failed: ${errorData.message || response.statusText}`
        );
      }

      const data = await response.json();
      console.log("✅ Transfer initiated successfully:", data);

      return {
        status: "SUCCESS",
        message: "Transfer initiated successfully",
        data: data,
      };
    } catch (error) {
      console.error("Transfer error:", error);
      throw new Error(
        `Failed to initiate transfer: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(
    transferId: string
  ): Promise<CashfreeTransferStatusResponse> {
    try {
      console.log("📊 Getting transfer status via V2 API...");

      const response = await fetch(
        `${this.config.BASE_URL}/payout/transfers/${transferId}`,
        {
          method: "GET",
          headers: {
            "x-api-version": "2024-01-01",
            "x-client-id": this.config.CLIENT_ID,
            "x-client-secret": this.config.CLIENT_SECRET,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Get status failed:", errorData);
        throw new Error(
          `Get status failed: ${errorData.message || response.statusText}`
        );
      }

      const data = await response.json();
      console.log("✅ Transfer status retrieved:", data);
      return data;
    } catch (error) {
      console.error("Get transfer status error:", error);
      throw new Error(
        `Failed to get transfer status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get beneficiary details
   */
  async getBeneficiary(
    beneId: string
  ): Promise<CashfreeBeneficiaryDetailsResponse> {
    try {
      console.log("👤 Getting beneficiary details via V2 API...");

      const response = await fetch(
        `${this.config.BASE_URL}/payout/beneficiary?beneficiary_id=${beneId}`,
        {
          method: "GET",
          headers: {
            "x-api-version": "2024-01-01",
            "x-client-id": this.config.CLIENT_ID,
            "x-client-secret": this.config.CLIENT_SECRET,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Get beneficiary failed:", errorData);
        throw new Error(
          `Get beneficiary failed: ${errorData.message || response.statusText}`
        );
      }

      const data = await response.json();
      console.log("✅ Beneficiary details retrieved:", data);
      return data;
    } catch (error) {
      console.error("Get beneficiary error:", error);
      throw new Error(
        `Failed to get beneficiary: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate test UPI ID for development
   */
  static generateTestUpiId(name: string): string {
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 10);
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${cleanName}${randomSuffix}@paytm`; // Using Paytm as test UPI provider
  }

  /**
   * Validate UPI ID format
   */
  static validateUpiId(upiId: string): boolean {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(upiId);
  }
}

export default CashfreeService;
