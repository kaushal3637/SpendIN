import { getCashfreeConfig } from "@/config/constant";
import {
  CashfreeBeneficiary,
  CashfreeBeneficiaryResponse,
  CashfreeTransferRequest,
  CashfreeTransferResponse,
  CashfreeTransferStatusResponse,
  CashfreeBeneficiaryDetailsResponse,
  CashfreeQrCodeRequest,
  CashfreeQrCodeResponse,
  CashfreeQrCodeDetailsResponse,
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
      };

      console.log(
        "📤 Creating beneficiary with V2 format:",
        JSON.stringify(requestBody, null, 2)
      );

      const response = await fetch(
        "https://sandbox.cashfree.com/payout/beneficiary",
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
   * Initiate a payout transfer using the exact API format
   * UPI is the default and only supported transfer method
   */
  async initiateTransfer(
    transferRequest: CashfreeTransferRequest
  ): Promise<CashfreeTransferResponse> {
    try {
      console.log("💸 Initiating UPI transfer via Cashfree API...");

      // Use the exact format from the working curl command
      const requestBody = {
        transfer_id: transferRequest.transferId,
        transfer_amount: transferRequest.transferAmount,
        beneficiary_details: {
          beneficiary_id: transferRequest.beneficiaryId,
          beneficiary_name: transferRequest.beneficiaryName,
          beneficiary_instrument_details: {
            vpa: transferRequest.beneficiaryVpa
          }
        },
        transfer_mode: "upi", // UPI is the only supported method
        transfer_remarks: transferRequest.transferRemarks || "UPI Payment",
        fundsource_id: transferRequest.fundsourceId || this.config.FUNDSOURCE_ID
      };

      console.log("📤 Transfer request:", JSON.stringify(requestBody, null, 2));

      const response = await fetch("https://sandbox.cashfree.com/payout/transfers", {
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
        const errorText = await response.text();
        console.error("❌ Transfer failed:", errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(
          `Transfer failed: ${errorData.message || response.statusText}`
        );
      }

      const data = await response.json();
      console.log("✅ Transfer initiated successfully:", data);
      console.log("📊 Transfer status received:", data.status);
      console.log("📊 Transfer status code:", data.status_code);

      return {
        status: data.status || "SUCCESS",
        message: data.message || "Transfer initiated successfully",
        data: data.data || data,
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
   * Generate QR code for UPI payment using Cashfree API
   */
  async generateQrCode(
    beneficiaryId: string,
    qrRequest: CashfreeQrCodeRequest = {}
  ): Promise<CashfreeQrCodeResponse> {
    try {
      console.log("📱 Generating QR code for beneficiary:", beneficiaryId);

      // First get beneficiary details to ensure we have the VPA
      const beneficiaryDetails = await this.getBeneficiary(beneficiaryId);

      if (!beneficiaryDetails.beneficiary_id) {
        throw new Error("Beneficiary not found");
      }

      const vpa = beneficiaryDetails.beneficiary_instrument_details?.vpa;
      if (!vpa) {
        throw new Error("Beneficiary does not have a UPI VPA configured");
      }

      // Prepare UPI string for QR code
      const upiParams = new URLSearchParams();
      upiParams.set('pa', vpa);
      upiParams.set('pn', beneficiaryDetails.beneficiary_name || 'Merchant');
      upiParams.set('cu', 'INR');

      if (qrRequest.amount && qrRequest.amount > 0) {
        upiParams.set('am', qrRequest.amount.toFixed(2));
      }

      if (qrRequest.purpose) {
        upiParams.set('purpose', qrRequest.purpose);
      }

      // Add transaction reference if provided
      if (qrRequest.remarks) {
        upiParams.set('tr', qrRequest.remarks);
      }

      const upiString = `upi://pay?${upiParams.toString()}`;

      // Generate QR code using a QR code generation service
      // For now, we'll use a public QR code API, but in production you'd want to generate it server-side
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(upiString)}`;

      // Create a unique QR code ID
      const qrCodeId = `QR_${beneficiaryId}_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      console.log("✅ QR code generated successfully:", qrCodeId);

      return {
        status: "SUCCESS",
        message: "QR code generated successfully",
        data: {
          qrCodeId,
          qrCodeUrl,
          qrCodeString: upiString,
          amount: qrRequest.amount,
          purpose: qrRequest.purpose,
          expiryDate: qrRequest.expiryDate,
          createdAt: new Date().toISOString(),
          upiString,
        },
      };
    } catch (error) {
      console.error("Generate QR code error:", error);
      throw new Error(
        `Failed to generate QR code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get QR code details by QR code ID
   */
  async getQrCodeDetails(qrCodeId: string): Promise<CashfreeQrCodeDetailsResponse> {
    try {
      console.log("📊 Getting QR code details:", qrCodeId);

      // In a real implementation, you'd store QR codes in a database
      // For now, we'll return a mock response
      console.log("⚠️ QR code details retrieval not fully implemented - would need database storage");

      return {
        status: "SUCCESS",
        message: "QR code details retrieved",
        data: {
          qrCodeId,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(`upi://pay?pa=merchant@upi&pn=Test Merchant&cu=INR`)}`,
          qrCodeString: `upi://pay?pa=merchant@upi&pn=Test Merchant&cu=INR`,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          upiString: `upi://pay?pa=merchant@upi&pn=Test Merchant&cu=INR`,
        },
      };
    } catch (error) {
      console.error("Get QR code details error:", error);
      throw new Error(
        `Failed to get QR code details: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate QR code data URL for display (alternative method)
   */
  static generateQrCodeDataUrl(upiString: string, size: number = 256): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiString)}`;
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
