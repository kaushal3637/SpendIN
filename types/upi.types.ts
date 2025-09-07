export type QrType = "personal" | "static_merchant" | "dynamic_merchant";

export interface UpiQrData {
  // Mandatory field
  pa: string; // Payee address (VPA/UPI ID)

  // Optional fields
  pn?: string; // Payee name
  am?: string; // Transaction amount
  cu?: string; // Currency code
  mc?: string; // Merchant code
  tr?: string; // Transaction reference
  mode?: string; // Payment mode
  purpose?: string; // Purpose of transaction
  orgid?: string; // Organization ID
  sign?: string; // Digital signature
  [key: string]: string | undefined; // Allow additional parameters
}

export interface ParsedQrResponse {
  qrType: QrType;
  isValid: boolean;
  data: UpiQrData;
  errors?: string[];
  formattedData?: string;
}

export interface QrValidationResult {
  isValid: boolean;
  errors: string[];
}

// In-memory storage for the last parsed QR data
export interface StoredQrData {
  timestamp: Date;
  qrString: string;
  parsedData: ParsedQrResponse;
}

// Razorpay Integration Types
export interface RazorpayPayoutStatus {
  payout_id: string;
  status: 'pending' | 'processing' | 'processed' | 'cancelled' | 'rejected' | 'failed';
  amount: number;
  currency: string;
  upi_id: string;
  merchant_name: string;
  failure_reason?: string;
  processed_at?: Date;
  created_at: Date;
}

export interface PayoutRequest {
  upiId: string;
  merchantName: string;
  amount: number;
  referenceId: string;
  transactionId: string;
  notes?: Record<string, string>;
}

export interface PayoutResponse {
  success: boolean;
  payout_id?: string;
  error?: string;
  status?: string;
  amount?: number;
  currency?: string;
}
