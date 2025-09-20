// Simplified beneficiary API types - only name and vpa
export interface BeneficiaryRequest {
  name: string
  vpa: string
}

export interface BeneficiaryResponse {
  success: boolean
  message: string
  data?: {
    database: {
      beneficiaryId: string
      name: string
      vpa: string
      isActive: boolean
    }
  }
  error?: string
}

export interface QRCodeRequest {
  beneficiaryId: string
  amount?: number
  purpose?: string
  remarks?: string
}

export interface QRCodeResponse {
  success: boolean
  message: string
  data?: {
    qrCodeId: string
    qrCodeUrl: string
    qrCodeString: string
    amount?: number
    purpose?: string
    expiryDate?: string
    createdAt: string
    upiString: string
  }
  error?: string
}