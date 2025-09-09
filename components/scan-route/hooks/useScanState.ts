import { useState, useCallback } from "react";
import { ParsedQrResponse } from "@/types/upi.types";
import {
  ConversionResult,
  PaymentResult,
  PayoutResult,
  BeneficiaryDetails,
} from "@/types/api-validator.types";
import { ScanningState } from "@/types/qr-service.types";
import { ScanState, ScanActions } from "@/types/scanstate-hook.types";

const initialScanState: ScanState = {
  showModal: false,
  showConversionModal: false,
  showReason: false,
  showConfetti: false,
  parsedData: null,
  userAmount: "",
  conversionResult: null,
  paymentResult: null,
  payoutResult: null,
  beneficiaryDetails: null,
  storedTransactionId: null,
  isConverting: false,
  isProcessingPayment: false,
  paymentStep: "",
  isTestMode: false,
  scanningState: {
    isScanning: false,
    hasPermission: null,
    error: null,
    scanResult: null,
    isLoading: false,
  },
};

export function useScanState(): ScanState & ScanActions {
  // Modal states
  const [showModal, setShowModal] = useState(initialScanState.showModal);
  const [showConversionModal, setShowConversionModal] = useState(
    initialScanState.showConversionModal
  );
  const [showReason, setShowReason] = useState(initialScanState.showReason);
  const [showConfetti, setShowConfetti] = useState(
    initialScanState.showConfetti
  );

  // Data states
  const [parsedData, setParsedData] = useState<ParsedQrResponse | null>(
    initialScanState.parsedData
  );
  const [userAmount, setUserAmount] = useState(initialScanState.userAmount);
  const [conversionResult, setConversionResult] =
    useState<ConversionResult | null>(initialScanState.conversionResult);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    initialScanState.paymentResult
  );
  const [payoutResult, setPayoutResult] = useState<PayoutResult | null>(
    initialScanState.payoutResult
  );
  const [beneficiaryDetails, setBeneficiaryDetails] =
    useState<BeneficiaryDetails | null>(initialScanState.beneficiaryDetails);
  const [storedTransactionId, setStoredTransactionId] = useState<string | null>(
    initialScanState.storedTransactionId
  );

  // UI states
  const [isConverting, setIsConverting] = useState(
    initialScanState.isConverting
  );
  const [isProcessingPayment, setIsProcessingPayment] = useState(
    initialScanState.isProcessingPayment
  );
  const [paymentStep, setPaymentStep] = useState(initialScanState.paymentStep);
  const [isTestMode, setIsTestMode] = useState(initialScanState.isTestMode);

  // Scanning states
  const [scanningState, setScanningState] = useState<ScanningState>(
    initialScanState.scanningState
  );

  // Utility functions
  const updateScanningState = useCallback((updates: Partial<ScanningState>) => {
    setScanningState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetScanState = useCallback(() => {
    setShowModal(false);
    setShowConversionModal(false);
    setShowReason(false);
    setShowConfetti(false);
    setParsedData(null);
    setUserAmount("");
    setConversionResult(null);
    setPaymentResult(null);
    setPayoutResult(null);
    setBeneficiaryDetails(null);
    setStoredTransactionId(null);
    setIsConverting(false);
    setIsProcessingPayment(false);
    setPaymentStep("");
    setIsTestMode(false);
    setScanningState({
      isScanning: false,
      hasPermission: null,
      error: null,
      scanResult: null,
      isLoading: false,
    });
  }, []);

  const resetPaymentState = useCallback(() => {
    setPaymentResult(null);
    setPayoutResult(null);
    setIsProcessingPayment(false);
    setPaymentStep("");
  }, []);

  return {
    // State values
    showModal,
    showConversionModal,
    showReason,
    showConfetti,
    parsedData,
    userAmount,
    conversionResult,
    paymentResult,
    payoutResult,
    beneficiaryDetails,
    storedTransactionId,
    isConverting,
    isProcessingPayment,
    paymentStep,
    isTestMode,
    scanningState,

    // Actions
    setShowModal,
    setShowConversionModal,
    setShowReason,
    setShowConfetti,
    setParsedData,
    setUserAmount,
    setConversionResult,
    setPaymentResult,
    setPayoutResult,
    setBeneficiaryDetails,
    setStoredTransactionId,
    setIsConverting,
    setIsProcessingPayment,
    setPaymentStep,
    setIsTestMode,
    setScanningState,
    updateScanningState,
    resetScanState,
    resetPaymentState,
  };
}
