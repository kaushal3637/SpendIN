import { ParsedQrResponse } from "./upi.types";
import { QrScannerRef } from "./qr-service.types";

export interface ConversionResult {
  inrAmount: number;
  usdAmount: number;
  usdcAmount: number;
  exchangeRate: number;
  lastUpdated: string;
  networkFee: number;
  networkName: string;
  totalUsdcAmount: number;
}

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  upiPaymentId?: string;
  upiPaymentStatus?: string;
  upiPayoutDetails?: {
    transferId: string;
    status: string;
    message: string;
    amount: number;
  };
  error?: string;
  status: string;
  refund?: {
    amount: string;
    fee?: string;
    transactionHash?: string;
    to?: string;
  };
}

export interface PayoutResult {
  success: boolean;
  payout?: {
    transferId: string;
    amount: number;
    status: string;
    message: string;
  };
  error?: string;
}

export interface BeneficiaryDetails {
  beneficiary_id?: string;
  beneficiary_name?: string;
  beneficiary_email?: string;
  beneficiary_phone?: string;
  beneficiary_instrument_details?: {
    vpa?: string;
    bank_account_number?: string;
    bank_ifsc?: string;
  };
  beneficiary_contact_details?: {
    beneficiary_email?: string;
    beneficiary_phone?: string;
  };
}

export interface ScanStateSetters {
  setParsedData: (data: ParsedQrResponse | null) => void;
  setShowModal: (show: boolean) => void;
  setUserAmount: (amount: string) => void;
  setConversionResult: (result: ConversionResult | null) => void;
  setShowConversionModal: (show: boolean) => void;
  setShowReason: (show: boolean) => void;
  setPayoutResult: (result: PayoutResult | null) => void;
  setBeneficiaryDetails: (details: BeneficiaryDetails | null) => void;
  setPaymentResult: (result: PaymentResult | null) => void;
  setStoredTransactionId: (id: string | null) => void;
  qrScannerRef: React.MutableRefObject<QrScannerRef | null>;
}
