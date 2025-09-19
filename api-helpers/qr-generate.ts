// utils/qrCodeApi.ts
import { BACKEND_URL, API_KEY } from "@/config/constant";
import { QRCodeRequest, QRCodeResponse } from "@/types/api-helpers/qr-generation";

/**
 * Generate QR Code using the API
 * @param requestData - QR code generation parameters
 * @returns Promise<QRCodeResponse>
 * @throws QRCodeAPIError
 */

export async function generateQRCode(requestData: QRCodeRequest): Promise<QRCodeResponse> {
    try {
        // Prepare request body, filtering out undefined values
        const requestBody: Record<string, any> = {
            beneficiaryId: requestData.beneficiaryId.trim(),
        };

        if (requestData.amount !== undefined && requestData.amount > 0) {
            requestBody.amount = requestData.amount;
        }
        if (requestData.purpose?.trim()) {
            requestBody.purpose = requestData.purpose.trim();
        }
        if (requestData.remarks?.trim()) {
            requestBody.remarks = requestData.remarks.trim();
        }

        const response = await fetch(`${BACKEND_URL}/api/cashfree/qr/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY!
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        return {
            success: true,
            message: data.message || "QR code generated successfully",
            qrCode: data.data?.data || data.data
        };

    } catch (error) {
        return {
            success: false,
            message: "Failed to generate QR Code",
        }
    }
}