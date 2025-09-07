import { RAZORPAY_CONFIG } from '@/config/constant';

export interface RazorpayContact {
  id: string;
  name: string;
  email: string;
  contact: string;
  type: 'customer' | 'vendor';
  reference_id: string;
  active: boolean;
  created_at: number;
}

export interface RazorpayFundAccount {
  id: string;
  contact_id: string;
  account_type: 'vpa';
  vpa?: {
    address: string;
  };
  active: boolean;
  created_at: number;
}

export interface RazorpayPayout {
  id: string;
  entity: string;
  fund_account_id: string;
  amount: number;
  currency: string;
  notes: Record<string, string>;
  fees: number;
  tax: number;
  status: 'pending' | 'processing' | 'processed' | 'cancelled' | 'rejected' | 'failed';
  purpose: string;
  utr: string;
  mode: string;
  reference_id: string;
  narration: string;
  batch_id: string | null;
  failure_reason: string | null;
  created_at: number;
}

export interface CreateContactRequest {
  name: string;
  email?: string;
  contact?: string;
  type: 'customer' | 'vendor';
  reference_id: string;
}

export interface CreateFundAccountRequest {
  contact_id: string;
  account_type: 'vpa';
  vpa: {
    address: string;
  };
}

export interface CreatePayoutRequest {
  account_number: string;
  fund_account_id: string;
  amount: number;
  currency: 'INR';
  mode: 'UPI';
  purpose: 'payout';
  queue_if_low_balance: boolean;
  reference_id: string;
  narration: string;
  notes?: Record<string, string>;
}

class RazorpayClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private initialized = false;

  constructor() {
    this.apiKey = RAZORPAY_CONFIG.API_KEY;
    this.apiSecret = RAZORPAY_CONFIG.API_SECRET;
    this.baseUrl = RAZORPAY_CONFIG.BASE_URL;

    // Only throw error if we're in runtime and credentials are missing
    // This prevents build-time errors when environment variables aren't set
    if (typeof window === 'undefined' && (!this.apiKey || !this.apiSecret)) {
      console.warn('Razorpay API credentials not configured. Payout features will be disabled.');
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      if (!this.apiKey || !this.apiSecret) {
        throw new Error('Razorpay API credentials not configured. Please set RAZORPAY_API_KEY and RAZORPAY_API_SECRET environment variables.');
      }
      this.initialized = true;
    }
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: Record<string, unknown> | unknown
  ): Promise<unknown> {
    this.ensureInitialized();

    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    };

    if (RAZORPAY_CONFIG.X_ACCOUNT) {
      headers['X-Razorpay-Account'] = RAZORPAY_CONFIG.X_ACCOUNT;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Razorpay API error: ${response.status} - ${errorData.error?.description || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Razorpay API request failed:', error);
      throw error;
    }
  }

  // Contact Management
  async createContact(contactData: CreateContactRequest): Promise<RazorpayContact> {
    return this.makeRequest('/contacts', 'POST', contactData) as Promise<RazorpayContact>;
  }

  async getContact(contactId: string): Promise<RazorpayContact> {
    return this.makeRequest(`/contacts/${contactId}`) as Promise<RazorpayContact>;
  }

  async updateContact(contactId: string, updates: Partial<CreateContactRequest>): Promise<RazorpayContact> {
    return this.makeRequest(`/contacts/${contactId}`, 'PUT', updates) as Promise<RazorpayContact>;
  }

  // Fund Account Management
  async createFundAccount(fundAccountData: CreateFundAccountRequest): Promise<RazorpayFundAccount> {
    return this.makeRequest('/fund_accounts', 'POST', fundAccountData) as Promise<RazorpayFundAccount>;
  }

  async getFundAccount(fundAccountId: string): Promise<RazorpayFundAccount> {
    return this.makeRequest(`/fund_accounts/${fundAccountId}`) as Promise<RazorpayFundAccount>;
  }

  async getFundAccounts(contactId?: string): Promise<{ items: RazorpayFundAccount[] }> {
    const endpoint = contactId ? `/fund_accounts?contact_id=${contactId}` : '/fund_accounts';
    return this.makeRequest(endpoint) as Promise<{ items: RazorpayFundAccount[] }>;
  }

  // Payout Management
  async createPayout(payoutData: CreatePayoutRequest): Promise<RazorpayPayout> {
    return this.makeRequest('/payouts', 'POST', payoutData) as Promise<RazorpayPayout>;
  }

  async getPayout(payoutId: string): Promise<RazorpayPayout> {
    return this.makeRequest(`/payouts/${payoutId}`) as Promise<RazorpayPayout>;
  }

  async cancelPayout(payoutId: string): Promise<RazorpayPayout> {
    return this.makeRequest(`/payouts/${payoutId}/cancel`, 'POST') as Promise<RazorpayPayout>;
  }

  // Utility functions
  async getAccountBalance(): Promise<{ available_balance: number; currency: string }> {
    return this.makeRequest('/balances') as Promise<{ available_balance: number; currency: string }>;
  }

  async getPayouts(status?: string): Promise<{ items: RazorpayPayout[] }> {
    const endpoint = status ? `/payouts?status=${status}` : '/payouts';
    return this.makeRequest(endpoint) as Promise<{ items: RazorpayPayout[] }>;
  }

  // Public method for searching contacts by reference_id
  async searchContactsByReferenceId(referenceId: string): Promise<{ items: RazorpayContact[] }> {
    return this.makeRequest(`/contacts?reference_id=${referenceId}`) as Promise<{ items: RazorpayContact[] }>;
  }
}

// Export singleton instance
export const razorpayClient = new RazorpayClient();

// Utility functions for contact and fund account management
export class RazorpayContactManager {
  private client: RazorpayClient;

  constructor() {
    this.client = razorpayClient;
  }

  async createOrGetContact(upiId: string, merchantName: string): Promise<{ contact: RazorpayContact; fundAccount: RazorpayFundAccount }> {
    try {
      // Try to find existing contact by reference_id (UPI ID)
      const existingContacts = await this.client.searchContactsByReferenceId(upiId);
      let contact: RazorpayContact;

      if (existingContacts.items && existingContacts.items.length > 0) {
        contact = existingContacts.items[0];
      } else {
        // Create new contact
        contact = await this.client.createContact({
          name: merchantName || 'UPI Merchant',
          email: `${upiId.replace('@', '_')}@upi.local`,
          type: 'vendor',
          reference_id: upiId,
        });
      }

      // Check if fund account exists for this UPI
      const fundAccounts = await this.client.getFundAccounts(contact.id);
      let fundAccount: RazorpayFundAccount;

      if (fundAccounts.items && fundAccounts.items.length > 0) {
        // Check if any fund account has this VPA
        const existingFundAccount = fundAccounts.items.find(
          (fa: RazorpayFundAccount) => fa.vpa?.address === upiId && fa.active
        );

        if (existingFundAccount) {
          fundAccount = existingFundAccount;
        } else {
          // Create new fund account
          fundAccount = await this.client.createFundAccount({
            contact_id: contact.id,
            account_type: 'vpa',
            vpa: {
              address: upiId,
            },
          });
        }
      } else {
        // Create new fund account
        fundAccount = await this.client.createFundAccount({
          contact_id: contact.id,
          account_type: 'vpa',
          vpa: {
            address: upiId,
          },
        });
      }

      return { contact, fundAccount };
    } catch (error) {
      console.error('Error in createOrGetContact:', error);
      throw error;
    }
  }

  async createPayoutToUPI(
    upiId: string,
    merchantName: string,
    amount: number,
    referenceId: string,
    notes?: Record<string, string>
  ): Promise<RazorpayPayout> {
    try {
      // Get or create contact and fund account
      const { fundAccount } = await this.createOrGetContact(upiId, merchantName);

      // Create payout
      const payoutData: CreatePayoutRequest = {
        account_number: RAZORPAY_CONFIG.X_ACCOUNT,
        fund_account_id: fundAccount.id,
        amount: Math.round(amount * 100), // Convert to paisa
        currency: 'INR',
        mode: 'UPI',
        purpose: 'payout',
        queue_if_low_balance: true,
        reference_id: referenceId,
        narration: `Payment to ${merchantName} (${upiId})`,
        notes: {
          upi_id: upiId,
          merchant_name: merchantName,
          original_amount: amount.toString(),
          ...notes,
        },
      };

      const payout = await this.client.createPayout(payoutData);
      return payout;
    } catch (error) {
      console.error('Error creating payout:', error);
      throw error;
    }
  }

  async getPayoutStatus(payoutId: string): Promise<RazorpayPayout> {
    return this.client.getPayout(payoutId);
  }
}

export const razorpayContactManager = new RazorpayContactManager();
