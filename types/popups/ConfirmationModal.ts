import { ParsedQrResponse } from "@/types/upi.types";
import { BeneficiaryDetails } from "@/types/api-validator.types";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (finalAmount: number) => void;
  parsedData: ParsedQrResponse | null;
  userAmount: string;
  setUserAmount: (amount: string) => void;
  isConverting: boolean;
  isTestMode: boolean;
  beneficiaryDetails: BeneficiaryDetails | null;
  connectedChain?: number;
  isValidChainId?: (chainId: number) => boolean;
}
