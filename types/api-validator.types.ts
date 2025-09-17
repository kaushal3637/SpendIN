import { ParsedQrResponse } from "./upi.types";
import { QrScannerRef } from "./qr-service.types";

export interface ConversionResult {
  inrAmount: number;
  usdAmount: number;
  usdcAmount: number;
  exchangeRate: number;
  lastUpdated: string;
  networkName: string;
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
  beneficiaryId: string;
  name: string;
  vpa: string;
  isActive: boolean;
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
  setShowConfetti: (show: boolean) => void;
  setPaymentResult: (result: PaymentResult | null) => void;
  setStoredTransactionId: (id: string | null) => void;
  qrScannerRef: React.MutableRefObject<QrScannerRef | null>;
}
