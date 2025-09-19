import { BACKEND_URL, API_KEY } from "@/config/constant";
import { BeneficiaryAPIError, BeneficiaryRequest, BeneficiaryPayload, BeneficiaryResponse } from "@/types/api-helpers/beneficiary";

/**
 * Validates beneficiary data
 * @param data - Beneficiary request data
 * @throws BeneficiaryAPIError if validation fails
 */
function validateBeneficiaryData(data: BeneficiaryRequest): void {
    // Required fields validation
    if (!data.beneficiary_id?.trim()) {
        throw new BeneficiaryAPIError('Beneficiary ID is required');
    }

    if (!data.beneficiary_name?.trim()) {
        throw new BeneficiaryAPIError('Beneficiary name is required');
    }

    // Payment method validation
    const hasVPA = data.vpa?.trim();
    const hasBankDetails = data.bank_account_number?.trim() && data.bank_ifsc?.trim();

    if (!hasVPA && !hasBankDetails) {
        throw new BeneficiaryAPIError('UPI ID & Bank account details are required');
    }

    // Bank details validation - if one is provided, both must be provided
    if ((data.bank_account_number?.trim() && !data.bank_ifsc?.trim()) ||
        (!data.bank_account_number?.trim() && data.bank_ifsc?.trim())) {
        throw new BeneficiaryAPIError('Both account number and IFSC are required');
    }

    // Format validations
    if (data.beneficiary_id.length > 50) {
        throw new BeneficiaryAPIError('Beneficiary ID must be 50 characters or less');
    }

    if (data.beneficiary_name.length > 100) {
        throw new BeneficiaryAPIError('Beneficiary name must be 100 characters or less');
    }

    if (data.vpa && data.vpa.length > 50) {
        throw new BeneficiaryAPIError('UPI ID must be 50 characters or less');
    }

    if (data.bank_account_number && (data.bank_account_number.length < 9 || data.bank_account_number.length > 18)) {
        throw new BeneficiaryAPIError('Bank account number must be between 9-18 digits');
    }

    if (data.bank_ifsc && data.bank_ifsc.length !== 11) {
        throw new BeneficiaryAPIError('IFSC code must be exactly 11 characters');
    }

    // Pattern validations
    const alphanumericPattern = /^[a-zA-Z0-9]+$/;
    if (!alphanumericPattern.test(data.beneficiary_id)) {
        throw new BeneficiaryAPIError('Beneficiary ID must contain only alphanumeric characters');
    }

    const namePattern = /^[a-zA-Z\s]+$/;
    if (!namePattern.test(data.beneficiary_name)) {
        throw new BeneficiaryAPIError('Beneficiary name must contain only alphabets and spaces');
    }

    if (data.vpa) {
        const vpaPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
        if (!vpaPattern.test(data.vpa)) {
            throw new BeneficiaryAPIError('Invalid UPI ID format');
        }
    }

    if (data.bank_account_number) {
        const accountPattern = /^\d+$/;
        if (!accountPattern.test(data.bank_account_number)) {
            throw new BeneficiaryAPIError('Bank account number must contain only digits');
        }
    }

    if (data.bank_ifsc) {
        const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscPattern.test(data.bank_ifsc.toUpperCase())) {
            throw new BeneficiaryAPIError('Invalid IFSC code format');
        }
    }
}

/**
 * Transforms request data to API payload format
 * @param data - Beneficiary request data
 * @returns BeneficiaryPayload
 */
function transformToPayload(data: BeneficiaryRequest): BeneficiaryPayload {
    const payload: BeneficiaryPayload = {
        beneId: data.beneficiary_id.trim(),
        name: data.beneficiary_name.trim(),
    };

    if (data.vpa?.trim()) {
        payload.vpa = data.vpa.trim();
    }

    if (data.bank_account_number?.trim() && data.bank_ifsc?.trim()) {
        payload.bankAccount = {
            accountNumber: data.bank_account_number.trim(),
            ifsc: data.bank_ifsc.trim().toUpperCase(),
            accountHolderName: data.beneficiary_name.trim()
        };
    }

    return payload;
}

/**
 * Add a new beneficiary using the Cashfree API
 * @param requestData - Beneficiary data
 * @returns Promise<BeneficiaryResponse>
 * @throws BeneficiaryAPIError
 */
export async function addBeneficiary(requestData: BeneficiaryRequest): Promise<BeneficiaryResponse> {
    try {
        // Validate input data
        validateBeneficiaryData(requestData);

        // Transform to API payload
        const payload = transformToPayload(requestData);

        const response = await fetch(`${BACKEND_URL}/api/cashfree/beneficiary/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY!
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            let errorMessage = 'Failed to add beneficiary';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch {
                // If response is not JSON, use default error message
            }
            throw new BeneficiaryAPIError(errorMessage, response.status);
        }

        const data = await response.json();

        return {
            success: true,
            message: data.message || "Beneficiary added successfully",
            data: data.data
        };

    } catch (error) {
        if (error instanceof BeneficiaryAPIError) {
            throw error;
        }

        // Handle network errors or other unexpected errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new BeneficiaryAPIError(`Network error: ${errorMessage}`);
    }
}

/**
 * Reset beneficiary form data
 * @returns Clean beneficiary data object
 */
export function getEmptyBeneficiaryData(): BeneficiaryRequest {
    return {
        beneficiary_id: '',
        beneficiary_name: '',
        vpa: '',
        bank_account_number: '',
        bank_ifsc: ''
    };
}