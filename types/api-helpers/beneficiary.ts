export interface BeneficiaryRequest {
    beneficiary_id: string;
    beneficiary_name: string;
    vpa?: string;
    bank_account_number?: string;
    bank_ifsc?: string;
}

export interface BankAccount {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
}

export interface BeneficiaryPayload {
    beneId: string;
    name: string;
    vpa?: string;
    bankAccount?: BankAccount;
}

export interface BeneficiaryResponse {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}

export class BeneficiaryAPIError extends Error {
    constructor(message: string, public statusCode?: number) {
        super(message);
        this.name = 'BeneficiaryAPIError';
    }
}