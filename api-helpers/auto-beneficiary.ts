import { BACKEND_URL, API_KEY } from "@/config/constant";
import { ParsedQrResponse } from "@/types/upi.types";

export interface AutoBeneficiaryRequest {
  upiDetails: {
    pa: string;
    pn?: string;
    am?: string;
    cu?: string;
    mc?: string;
    tr?: string;
  };
}

export interface AutoBeneficiaryResponse {
  success: boolean;
  data?: {
    beneficiaryId: string;
    customerId: string;
    isNewBeneficiary: boolean;
    upiId: string;
    merchantName: string;
    originalUpiId?: string;
    processingUpiId?: string;
    isFailureMode?: boolean;
  };
  error?: string;
  message?: string;
}


/**
 * Creates an auto-beneficiary from UPI QR data
 * @param upiDetails - UPI details from scanned QR code
 * @returns Promise<AutoBeneficiaryResponse>
 */
export async function createAutoBeneficiary(upiDetails: {
  pa: string;
  pn?: string;
  am?: string;
  cu?: string;
  mc?: string;
  tr?: string;
}): Promise<AutoBeneficiaryResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auto-beneficiary/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY!
      },
      body: JSON.stringify({
        upiDetails
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create auto-beneficiary');
    }

    return data;
  } catch (error) {
    console.error('Auto-beneficiary creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create auto-beneficiary'
    };
  }
}


/**
 * Creates auto-beneficiary from parsed QR data
 * @param parsedData - Parsed QR response
 * @returns Promise<AutoBeneficiaryResponse>
 */
export async function createBeneficiaryFromQR(parsedData: ParsedQrResponse): Promise<AutoBeneficiaryResponse> {
  if (!parsedData.isValid || !parsedData.data.pa) {
    return {
      success: false,
      error: 'Invalid QR data or missing UPI ID'
    };
  }

  return createAutoBeneficiary({
    pa: parsedData.data.pa,
    pn: parsedData.data.pn,
    am: parsedData.data.am,
    cu: parsedData.data.cu,
    mc: parsedData.data.mc,
    tr: parsedData.data.tr
  });
}
