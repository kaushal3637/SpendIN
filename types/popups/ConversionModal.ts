import { ParsedQrResponse } from "@/types/upi.types";
import {
  ConversionResult,
  BeneficiaryDetails,
} from "@/types/api-validator.types";

export interface ConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPay: () => void;
  parsedData: ParsedQrResponse | null;
  userAmount: string;
  conversionResult: ConversionResult | null;
  networkFeeUsdc: number;
  usdcBalance: string;
  isCheckingBalance: boolean;
  isProcessingPayment: boolean;
  paymentStep: string;
  balanceError: string | null;
  beneficiaryDetails: BeneficiaryDetails | null;
  connectedChain?: number;
  isValidChainId?: (chainId: number) => boolean;
}
