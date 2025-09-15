import { BACKEND_URL, API_KEY } from '@/config/constant'
import { BeneficiaryResponse, BeneficiaryRequest } from '@/types/api-helper'

/**
 * Add a new beneficiary for payouts
 * @param beneficiaryData - Beneficiary information (name and vpa only)
 * @returns Promise with beneficiary creation result
 */
export async function addBeneficiary(beneficiaryData: BeneficiaryRequest): Promise<BeneficiaryResponse> {
  try {
    console.log('Adding beneficiary via API:', beneficiaryData.vpa)

    const response = await fetch(`${BACKEND_URL}/api/phonepe/beneficiary/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY!
      },
      body: JSON.stringify(beneficiaryData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    console.log('✅ Beneficiary added successfully:', data)
    
    return {
      success: true,
      message: data.message || "Beneficiary added successfully",
      data: data.data
    }

  } catch (error) {
    console.error('❌ Error adding beneficiary:', error)
    
    return {
      success: false,
      message: `Failed to add beneficiary: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get beneficiary details by VPA
 * @param vpa - VPA to search for
 * @returns Promise with beneficiary details
 */
export async function getBeneficiaryByVpa(vpa: string): Promise<{
  success: boolean
  message: string
  data?: {
    beneficiaryId: string
    name: string
    vpa: string
    isActive: boolean
    totalReceived: number
    totalPaid: number
    transactionCount: number
    createdAt: string
    updatedAt: string
  }
  error?: string
}> {
  try {
    console.log('Getting beneficiary details by VPA:', vpa)

    const response = await fetch(`${BACKEND_URL}/api/phonepe/beneficiary/vpa/${encodeURIComponent(vpa)}`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY!
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    console.log('✅ Beneficiary details retrieved:', data)
    
    return {
      success: true,
      message: data.message || "Beneficiary details retrieved successfully",
      data: data.data
    }

  } catch (error) {
    console.error('❌ Error getting beneficiary details:', error)
    
    return {
      success: false,
      message: `Failed to get beneficiary details: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Validate beneficiary data before submission
 * @param data - Beneficiary data to validate
 * @returns Validation result with errors if any
 */
export function validateBeneficiaryData(data: Partial<BeneficiaryRequest>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Required fields
  if (!data.name?.trim()) {
    errors.push('Beneficiary name is required')
  }

  if (!data.vpa?.trim()) {
    errors.push('VPA (UPI ID) is required')
  }

  // VPA format validation
  if (data.vpa?.trim()) {
    const vpaRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
    if (!vpaRegex.test(data.vpa)) {
      errors.push('Invalid UPI ID format')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generate QR code for a beneficiary
 * @param qrData - QR code generation parameters
 * @returns Promise with QR code generation result
 */
// export async function generateQRCode(qrData: QRCodeRequest): Promise<QRCodeResponse> {
//   try {
//     console.log('🔄 Generating QR code via API:', qrData.beneficiaryId)

//     const response = await fetch(`${BACKEND_URL}/api/phonepe/qr/generate`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'x-api-key': API_KEY!
//       },
//       body: JSON.stringify(qrData),
//     })

//     if (!response.ok) {
//       const errorData = await response.json()
//       throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
//     }

//     const data = await response.json()
    
//     console.log('✅ QR code generated successfully:', data.data?.qrCodeId)
    
//     return {
//       success: true,
//       message: data.message || "QR code generated successfully",
//       data: data.data
//     }

//   } catch (error) {
//     console.error('❌ Error generating QR code:', error)
    
//     return {
//       success: false,
//       message: `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`,
//       error: error instanceof Error ? error.message : 'Unknown error'
//     }
//   }
// }

/**
 * Get beneficiary details by ID
 * @param beneficiaryId - Beneficiary ID to lookup
 * @returns Promise with beneficiary details
 */
// export async function getBeneficiaryDetails(beneficiaryId: string): Promise<unknown> {
//   try {
//     console.log('🔄 Getting beneficiary details via API:', beneficiaryId)

//     const response = await fetch(`${BACKEND_URL}/api/phonepe/beneficiary/${beneficiaryId}`, {
//       method: 'GET',
//       headers: {
//         'x-api-key': API_KEY!
//       },
//     })

//     if (!response.ok) {
//       const errorData = await response.json()
//       throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
//     }

//     const data = await response.json()
    
//     console.log('✅ Beneficiary details retrieved:', data)
    
//     return data

//   } catch (error) {
//     console.error('❌ Error getting beneficiary details:', error)
//     throw error
//   }
// }

// Types for payment status checking
// export interface PaymentStatusResponse {
//   success: boolean
//   code: 'PAYMENT_SUCCESS' | 'PAYMENT_ERROR' | 'PAYMENT_PENDING' | 'PAYMENT_CANCELLED' | 'PAYMENT_DECLINED' | 'TRANSACTION_NOT_FOUND' | 'BAD_REQUEST' | 'AUTHORIZATION_FAILED' | 'INTERNAL_SERVER_ERROR'
//   message: string
//   data?: {
//     transactionId: string
//     merchantId: string
//     providerReferenceId: string
//     amount: number
//     paymentState: 'COMPLETED' | 'FAILED' | 'PENDING'
//     payResponseCode: string
//     paymentModes?: Array<{
//       mode: string
//       amount: number
//       utr: string
//     }>
//   }
// }

/**
 * Check payment/payout status using PhonePe Status API
 * @param transactionId - Transaction ID to check status for
 * @returns Promise with payment status
 */
// export async function checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
//   try {
//     console.log('🔄 Checking payment status via API:', transactionId)

//     const response = await fetch(`${BACKEND_URL}/api/phonepe/status/${transactionId}`, {
//       method: 'GET',
//       headers: {
//         'x-api-key': API_KEY!
//       },
//     })

//     if (!response.ok) {
//       const errorData = await response.json()
//       throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
//     }

//     const data = await response.json()
    
//     console.log('✅ Payment status retrieved:', data)
    
//     return data

//   } catch (error) {
//     console.error('❌ Error checking payment status:', error)
//     throw error
//   }
// }

/**
 * Poll payment status until completion or timeout
 * @param transactionId - Transaction ID to poll
 * @param maxAttempts - Maximum number of polling attempts (default: 10)
 * @param intervalMs - Polling interval in milliseconds (default: 3000)
 * @returns Promise with final payment status
 */
// export async function pollPaymentStatus(
//   transactionId: string, 
//   maxAttempts: number = 10, 
//   intervalMs: number = 3000
// ): Promise<PaymentStatusResponse> {
//   console.log(`🔄 Starting payment status polling for ${transactionId}`)
  
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       const status = await checkPaymentStatus(transactionId)
      
//       console.log(`📊 Polling attempt ${attempt}/${maxAttempts}: ${status.code}`)
      
//       // If payment is completed (success or failure), return immediately
//       if (status.code === 'PAYMENT_SUCCESS' || 
//           status.code === 'PAYMENT_ERROR' || 
//           status.code === 'PAYMENT_CANCELLED' || 
//           status.code === 'PAYMENT_DECLINED') {
//         console.log(`✅ Final status received: ${status.code}`)
//         return status
//       }
      
//       // If still pending and not the last attempt, wait before next poll
//       if (attempt < maxAttempts && status.code === 'PAYMENT_PENDING') {
//         console.log(`⏳ Payment still pending, waiting ${intervalMs}ms before next check...`)
//         await new Promise(resolve => setTimeout(resolve, intervalMs))
//       } else if (attempt === maxAttempts) {
//         console.log(`⏰ Polling timeout reached after ${maxAttempts} attempts`)
//         return status
//       }
      
//     } catch (error) {
//       console.error(`❌ Polling attempt ${attempt} failed:`, error)
      
//       // If it's the last attempt, throw the error
//       if (attempt === maxAttempts) {
//         throw error
//       }
      
//       // Otherwise, wait and try again
//       await new Promise(resolve => setTimeout(resolve, intervalMs))
//     }
//   }
  
//   throw new Error('Payment status polling failed after maximum attempts')
// }

/**
 * Validate beneficiary data before submission
 * @param data - Beneficiary data to validate
 * @returns Validation result with errors if any
 */
// export function validateBeneficiaryData(data: Partial<BeneficiaryRequest>): {
//   isValid: boolean
//   errors: string[]
// } {
//   const errors: string[] = []

//   // Required fields
//   if (!data.beneId?.trim()) {
//     errors.push('Beneficiary ID is required')
//   }

//   if (!data.name?.trim()) {
//     errors.push('Beneficiary name is required')
//   }

//   // Payment method validation
//   const hasVpa = data.vpa?.trim()
//   const hasBankAccount = data.bankAccount?.accountNumber?.trim() && data.bankAccount?.ifsc?.trim()

//   if (!hasVpa && !hasBankAccount) {
//     errors.push('Either UPI ID (VPA) or Bank Account + IFSC must be provided')
//   }

//   // VPA format validation
//   if (hasVpa && data.vpa) {
//     const vpaRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
//     if (!vpaRegex.test(data.vpa)) {
//       errors.push('Invalid UPI ID format')
//     }
//   }

//   // IFSC validation
//   if (hasBankAccount && data.bankAccount?.ifsc) {
//     const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
//     if (!ifscRegex.test(data.bankAccount.ifsc)) {
//       errors.push('Invalid IFSC code format')
//     }
//   }

//   // Email validation (if provided)
//   if (data.email?.trim()) {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
//     if (!emailRegex.test(data.email)) {
//       errors.push('Invalid email format')
//     }
//   }

//   // Phone validation (if provided)
//   if (data.phone?.trim()) {
//     const phoneRegex = /^[6-9]\d{9}$/
//     if (!phoneRegex.test(data.phone)) {
//       errors.push('Invalid phone number format (should be 10 digits starting with 6-9)')
//     }
//   }

//   return {
//     isValid: errors.length === 0,
//     errors
//   }
// }
