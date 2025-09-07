export interface CashfreeBeneficiary {
  beneId: string;
  name: string;
  email: string;
  phone?: string;
  address1: string;
  city: string;
  state: string;
  pincode: string;
  bankAccount?: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
  };
  vpa?: string;
}

export interface CashfreeTransferRequest {
  beneId: string; // Internal format, converted to beneficiary_id for V2 API
  amount: number;
  transferId: string; // Internal format, converted to transfer_id for V2 API
  remarks?: string;
  transferMode?: "banktransfer" | "upi" | "paytm" | "amazonpay" | "card";
}

export interface CashfreeTransferResponse {
  status: string;
  message: string;
  data?: {
    // V1 format
    transferId?: string;
    referenceId?: string;
    utr?: string;
    acknowledged?: number;
    // V2 format
    transfer_id?: string;
    reference_id?: string;
  };
}

export interface CashfreeBeneficiaryResponse {
  status: string;
  message: string;
  data?: {
    // V1 format
    beneId?: string;
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
    addedOn?: string;
    // V2 format
    beneficiary_id?: string;
    beneficiary_name?: string;
    beneficiary_status?: string;
    added_on?: string;
    beneficiary_instrument_details?: {
      bank_account_number?: string;
      bank_ifsc?: string;
      vpa?: string;
    };
    beneficiary_contact_details?: {
      beneficiary_email?: string;
      beneficiary_phone?: string;
      beneficiary_country_code?: string;
      beneficiary_address?: string;
      beneficiary_city?: string;
      beneficiary_state?: string;
      beneficiary_postal_code?: string;
    };
  };
}

export interface CashfreeTransferStatusResponse {
  status: string;
  message: string;
  data?: {
    transferId: string;
    referenceId: string;
    amount: number;
    status: string;
    utr?: string;
    addedOn: string;
    processedOn?: string;
  };
}

export interface CashfreeBeneficiaryDetailsResponse {
  status: string;
  message: string;
  data?: {
    beneId: string;
    name: string;
    email: string;
    phone?: string;
    address1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    status: string;
    addedOn: string;
    bankAccount?: {
      accountNumber: string;
      ifsc: string;
      accountHolderName: string;
    };
    vpa?: string;
  };
}
