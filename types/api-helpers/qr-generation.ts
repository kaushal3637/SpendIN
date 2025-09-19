export interface QRCodeRequest {
    beneficiaryId: string;
    amount?: number;
    purpose?: string;
    remarks?: string;
}

export interface QRCodeData {
    qrCodeId: string;
    qrCodeUrl: string;
    qrCodeString: string;
    upiString: string;
    amount?: number;
    purpose?: string;
    createdAt: string;
}

export interface QRCodeResponse {
    success: boolean;
    message: string;
    qrCode?: QRCodeData;
    error?: string;
}