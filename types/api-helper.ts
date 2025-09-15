export interface BeneficiaryRequest {
  name: string;
  vpa: string;
}

export interface BeneficiaryResponse {
  success: boolean;
  message: string;
  data?: {
    database: {
      beneficiaryId: string;
      name: string;
      vpa: string;
      isActive: boolean;
    };
  };
  error?: string;
}

export interface QRCodeRequest {
  vpa: string;
  amount?: number;
  purpose?: string;
  remarks?: string;
}

export interface QRCodeData {
  qrCodeId: string;
  qrCodeUrl: string;
  qrCodeString: string;
  amount?: number;
  purpose?: string;
  expiryDate?: string;
  createdAt: string;
  upiString: string;
}

export interface QRCodeResponse {
  success: boolean;
  message: string;
  data?: {
    status: string;
    message: string;
    data: QRCodeData;
  };
  error?: string;
}
