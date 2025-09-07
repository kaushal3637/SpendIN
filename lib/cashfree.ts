import { getCashfreeConfig } from '@/config/constant';

export interface CashfreeBeneficiary {
  beneId: string;
  name: string;
  email: string;
  phone?: string;
  address1: string;
  city: string;
  state: string;
  pincode: string;
  bankAccount?: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
  };
  vpa?: string;
}

export interface CashfreeTransferRequest {
  beneId: string;
  amount: number;
  transferId: string;
  remarks?: string;
  transferMode?: 'banktransfer' | 'upi' | 'paytm' | 'amazonpay' | 'card';
}

export interface CashfreeTransferResponse {
  status: string;
  message: string;
  data?: {
    transferId: string;
    referenceId: string;
    utr?: string;
    acknowledged?: number;
  };
}

export interface CashfreeBeneficiaryResponse {
  status: string;
  message: string;
  data?: {
    beneId: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    addedOn: string;
  };
}

export interface CashfreeTransferStatusResponse {
  status: string;
  message: string;
  data?: {
    transferId: string;
    referenceId: string;
    amount: number;
    status: string;
    utr?: string;
    addedOn: string;
    processedOn?: string;
  };
}

export interface CashfreeBeneficiaryDetailsResponse {
  status: string;
  message: string;
  data?: {
    beneId: string;
    name: string;
    email: string;
    phone?: string;
    address1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    status: string;
    addedOn: string;
    bankAccount?: {
      accountNumber: string;
      ifsc: string;
      accountHolderName: string;
    };
    vpa?: string;
  };
}

interface CashfreeBeneficiaryRequest {
  beneId: string;
  name: string;
  email: string;
  phone: string;
  bankAccount: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
  };
  address1: string;
  city: string;
  state: string;
  pincode: string;
  vpa?: string;
}

class CashfreeService {
  private config: ReturnType<typeof getCashfreeConfig>;

  constructor() {
    this.config = getCashfreeConfig();
  }

  /**
   * Get authorization token from Cashfree
   */
  private async getAuthToken(): Promise<string> {
    try {
      const response = await fetch(`${this.config.BASE_URL}/payout/v1/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: this.config.APP_ID,
          secretKey: this.config.SECRET_KEY,
        }),
      });

      if (!response.ok) {
        throw new Error(`Auth failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 'SUCCESS' || !data.data?.token) {
        throw new Error(`Auth failed: ${data.message || 'Invalid response'}`);
      }

      return data.data.token;
    } catch (error) {
      console.error('Cashfree auth error:', error);
      throw new Error(`Failed to authenticate with Cashfree: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add a beneficiary for payouts
   */
  async addBeneficiary(beneficiary: CashfreeBeneficiary): Promise<CashfreeBeneficiaryResponse> {
    try {
      const token = await this.getAuthToken();

      const requestBody: CashfreeBeneficiaryRequest = {
        beneId: beneficiary.beneId,
        name: beneficiary.name,
        email: beneficiary.email,
        phone: beneficiary.phone || '9999999999', // Default phone for test mode
        bankAccount: beneficiary.bankAccount || {
          accountNumber: '1234567890', // Test account
          ifsc: 'HDFC0000001', // Test IFSC
          accountHolderName: beneficiary.name,
        },
        address1: beneficiary.address1,
        city: beneficiary.city,
        state: beneficiary.state,
        pincode: beneficiary.pincode,
        ...(beneficiary.vpa && { vpa: beneficiary.vpa }),
      };

      const response = await fetch(`${this.config.BASE_URL}/payout/v1/addBeneficiary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Add beneficiary failed: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      return {
        status: data.status,
        message: data.message || 'Beneficiary added successfully',
        data: data.data,
      };
    } catch (error) {
      console.error('Add beneficiary error:', error);
      throw new Error(`Failed to add beneficiary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initiate a payout transfer
   */
  async initiateTransfer(transferRequest: CashfreeTransferRequest): Promise<CashfreeTransferResponse> {
    try {
      const token = await this.getAuthToken();

      const requestBody = {
        beneId: transferRequest.beneId,
        amount: transferRequest.amount.toFixed(2),
        transferId: transferRequest.transferId,
        transferMode: transferRequest.transferMode || 'upi', // Default to UPI
        remarks: transferRequest.remarks || 'UPI Payout',
      };

      const response = await fetch(`${this.config.BASE_URL}/payout/v1/requestTransfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Transfer failed: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      return {
        status: data.status,
        message: data.message || 'Transfer initiated successfully',
        data: data.data,
      };
    } catch (error) {
      console.error('Transfer error:', error);
      throw new Error(`Failed to initiate transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(transferId: string): Promise<CashfreeTransferStatusResponse> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.config.BASE_URL}/payout/v1/getTransferStatus?transferId=${transferId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get status failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get transfer status error:', error);
      throw new Error(`Failed to get transfer status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get beneficiary details
   */
  async getBeneficiary(beneId: string): Promise<CashfreeBeneficiaryDetailsResponse> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.config.BASE_URL}/payout/v1/getBeneficiary?beneId=${beneId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Get beneficiary failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get beneficiary error:', error);
      throw new Error(`Failed to get beneficiary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate test UPI ID for development
   */
  static generateTestUpiId(name: string): string {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
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
