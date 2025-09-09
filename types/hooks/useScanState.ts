import { ParsedQrResponse } from "@/types/upi.types";
import {
  ConversionResult,
  PaymentResult,
  PayoutResult,
  BeneficiaryDetails,
} from "@/types/api-validator.types";
import { ScanningState } from "@/types/qr-service.types";

export interface ScanState {
  // Modal states
  showModal: boolean;
  showConversionModal: boolean;
  showReason: boolean;
  showConfetti: boolean;

  // Data states
  parsedData: ParsedQrResponse | null;
  userAmount: string;
  conversionResult: ConversionResult | null;
  paymentResult: PaymentResult | null;
  payoutResult: PayoutResult | null;
  beneficiaryDetails: BeneficiaryDetails | null;
  storedTransactionId: string | null;

  // UI states
  isConverting: boolean;
  isProcessingPayment: boolean;
  paymentStep: string;
  isTestMode: boolean;

  // Scanning states
  scanningState: ScanningState;
}

export interface ScanActions {
  // Modal actions
  setShowModal: (show: boolean) => void;
  setShowConversionModal: (show: boolean) => void;
  setShowReason: (show: boolean) => void;
  setShowConfetti: (show: boolean) => void;

  // Data actions
  setParsedData: (data: ParsedQrResponse | null) => void;
  setUserAmount: (amount: string) => void;
  setConversionResult: (result: ConversionResult | null) => void;
  setPaymentResult: (result: PaymentResult | null) => void;
  setPayoutResult: (result: PayoutResult | null) => void;
  setBeneficiaryDetails: (details: BeneficiaryDetails | null) => void;
  setStoredTransactionId: (id: string | null) => void;

  // UI actions
  setIsConverting: (converting: boolean) => void;
  setIsProcessingPayment: (processing: boolean) => void;
  setPaymentStep: (step: string) => void;
  setIsTestMode: (testMode: boolean) => void;

  // Scanning actions
  setScanningState: (state: ScanningState) => void;
  updateScanningState: (updates: Partial<ScanningState>) => void;

  // Utility actions
  resetScanState: () => void;
  resetPaymentState: () => void;
}
