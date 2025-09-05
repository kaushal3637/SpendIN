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
