// Types for beneficiary API
export interface BeneficiaryRequest {
  beneId: string
  name: string
  email?: string
  phone?: string
  vpa?: string
  bankAccount?: {
    accountNumber: string
    ifsc: string
    accountHolderName: string
  }
}

export interface BeneficiaryResponse {
  success: boolean
  message: string
  data?: {
    cashfree?: {
      success: boolean
      message: string
      beneficiary?: { 
        beneficiary_id: string
        beneficiary_status?: string 
      }
    }
    database?: {
      success: boolean
      message: string
      customerId?: string
      name?: string
      upiId?: string
      isBeneficiaryAdded?: boolean
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