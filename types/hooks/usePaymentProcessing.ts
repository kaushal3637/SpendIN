import { ParsedQrResponse } from "@/types/upi.types";
import {
  ConversionResult,
  BeneficiaryDetails,
} from "@/types/api-validator.types";

export interface StoreTransactionData {
  upiId: string;
  merchantName: string;
  totalUsdToPay: number;
  inrAmount: string;
  walletAddress: undefined;
  txnHash: undefined;
  chainId: number;
  isSuccess: boolean;
}

export interface StoreTransactionResponse {
  transactionId: string;
  chain: string;
}

// Payout types removed: payout now handled entirely in backend via PhonePe

export interface PaymentProcessingOptions {
  parsedData: ParsedQrResponse | null;
  userAmount: string;
  conversionResult: ConversionResult | null;
  beneficiaryDetails: BeneficiaryDetails | null;
  connectedChain: number | undefined;
  networkFeeUsdc: number | undefined;
  onPaymentResult: (result: {
    success: boolean;
    status: string;
    transactionHash?: string;
    error?: string;
  }) => void;
  onPaymentStep: (step: string) => void;
  onStoreTransaction: (
    data: StoreTransactionData
  ) => Promise<StoreTransactionResponse>;
  onUpdateTransaction: (
    transactionId: string,
    txnHash: string,
    isSuccess: boolean,
    walletAddress?: string
  ) => Promise<boolean>;
  onSuccess: () => void;
}
