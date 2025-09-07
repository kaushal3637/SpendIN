import QRCode from 'qrcode';

/**
 * Generate QR code as data URL
 */
export async function generateQRCodeDataURL(data: string, options?: QRCode.QRCodeToDataURLOptions): Promise<string> {
  try {
    const defaultOptions: QRCode.QRCodeToDataURLOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M',
      ...options
    };

    const qrCodeDataURL = await QRCode.toDataURL(data, defaultOptions);
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate QR code as buffer (for file storage)
 */
export async function generateQRCodeBuffer(data: string, options?: QRCode.QRCodeToBufferOptions): Promise<Buffer> {
  try {
    const defaultOptions: QRCode.QRCodeToBufferOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M',
      ...options
    };

    const qrCodeBuffer = await QRCode.toBuffer(data, defaultOptions);
    return qrCodeBuffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw new Error(`Failed to generate QR code buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate UPI QR code data for a customer
 */
export function generateUpiQrData(upiId: string, name: string, amount?: number, merchantCode?: string): string {
  let qrData = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&cu=INR`;

  if (amount && amount > 0) {
    qrData += `&am=${amount.toFixed(2)}`;
  }

  if (merchantCode) {
    qrData += `&mc=${encodeURIComponent(merchantCode)}`;
  }

  // Add transaction reference for uniqueness
  const transactionRef = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  qrData += `&tr=${encodeURIComponent(transactionRef)}`;

  return qrData;
}

/**
 * Generate QR code for customer with UPI details
 */
export async function generateCustomerQRCode(customer: {
  upiId: string;
  name: string;
  upiName?: string;
  amount?: number;
}, options?: QRCode.QRCodeToDataURLOptions): Promise<{
  qrCodeDataURL: string;
  qrData: string;
}> {
  try {
    const qrData = generateUpiQrData(
      customer.upiId,
      customer.upiName || customer.name,
      customer.amount
    );

    const qrCodeDataURL = await generateQRCodeDataURL(qrData, options);

    return {
      qrCodeDataURL,
      qrData
    };
  } catch (error) {
    console.error('Error generating customer QR code:', error);
    throw new Error(`Failed to generate customer QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate QR code data
 */
export function validateQrData(qrData: string): boolean {
  try {
    // Basic validation - should start with upi://pay?
    if (!qrData.startsWith('upi://pay?')) {
      return false;
    }

    // Should contain required parameters
    const requiredParams = ['pa']; // Payee address is mandatory
    const urlParams = new URLSearchParams(qrData.replace('upi://pay?', ''));

    for (const param of requiredParams) {
      if (!urlParams.has(param) || !urlParams.get(param)?.trim()) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating QR data:', error);
    return false;
  }
}
