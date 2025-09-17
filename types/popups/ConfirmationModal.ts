import { ParsedQrResponse } from "@/types/upi.types";
import { BeneficiaryDetails } from "@/types/api-validator.types";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (finalAmount: number) => void;
  parsedData: ParsedQrResponse | null;
  userAmount: string;
  isConverting: boolean;
  beneficiaryDetails: BeneficiaryDetails | null;
  connectedChain?: number;
  isValidChainId?: (chainId: number) => boolean;
}
