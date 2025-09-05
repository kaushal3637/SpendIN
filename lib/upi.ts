import { QrType, UpiQrData, ParsedQrResponse, QrValidationResult } from '@/types/upi.types';

/**
 * Parses UPI URI query parameters from a QR string
 * @param qrString - The UPI QR string (e.g., "upi://pay?pa=merchant@upi&pn=Test Merchant&am=100.00")
 * @returns Parsed UPI data object
 */
export function parseUpiUri(qrString: string): UpiQrData | null {
  try {
    // Validate input
    if (!qrString || typeof qrString !== 'string') {
      return null;
    }

    // Trim whitespace
    const trimmedString = qrString.trim();

    // Check if it's a valid UPI URI
    if (!trimmedString.startsWith('upi://pay?')) {
      return null;
    }

    // Extract query parameters
    const queryString = trimmedString.replace('upi://pay?', '');

    // Handle URL decoding for parameters that might be encoded
    let decodedQueryString: string;
    try {
      decodedQueryString = decodeURIComponent(queryString);
    } catch {
      // If decoding fails, use the original query string
      decodedQueryString = queryString;
    }

    const params = new URLSearchParams(decodedQueryString);

    // Build the UPI data object
    const upiData: UpiQrData = {
      pa: params.get('pa') || '',
    };

    // Add optional parameters if they exist
    const optionalParams = ['pn', 'am', 'cu', 'mc', 'tr', 'mode', 'purpose', 'orgid', 'sign'];

    optionalParams.forEach(param => {
      const value = params.get(param);
      if (value !== null) {
        upiData[param] = value;
      }
    });

    // Add any additional parameters not in the standard list
    for (const [key, value] of params.entries()) {
      if (!['pa', ...optionalParams].includes(key)) {
        upiData[key] = value;
      }
    }

    return upiData;
  } catch (error) {
    console.error('Error parsing UPI URI:', error);
    return null;
  }
}

/**
 * Classifies the QR type based on the parsed UPI data
 * @param upiData - The parsed UPI data
 * @returns The QR type classification
 */
export function classifyQrType(upiData: UpiQrData): QrType {
  const hasMerchantCode = !!upiData.mc;
  const hasAmount = !!upiData.am;
  const hasCurrency = !!upiData.cu;

  if (!hasMerchantCode && !hasAmount) {
    return 'personal';
  } else if (hasMerchantCode && !hasAmount) {
    return 'static_merchant';
  } else if (hasMerchantCode && hasAmount && hasCurrency) {
    return 'dynamic_merchant';
  }

  // Default fallback - treat as static merchant if merchant code exists
  return hasMerchantCode ? 'static_merchant' : 'personal';
}

/**
 * Validates the UPI QR data according to UPI standards
 * @param upiData - The parsed UPI data
 * @returns Validation result with errors if any
 */
export function validateUpiData(upiData: UpiQrData): QrValidationResult {
  const errors: string[] = [];

  // Mandatory validation: pa (payee address) must be present
  if (!upiData.pa || upiData.pa.trim() === '') {
    errors.push('Payee address (pa) is mandatory');
  }

  // If amount is present, currency must also be present
  if (upiData.am && (!upiData.cu || upiData.cu.trim() === '')) {
    errors.push('Currency (cu) is required when amount (am) is present');
  }

  // Validate merchant code if present (must be numeric)
  if (upiData.mc && !/^\d+$/.test(upiData.mc)) {
    errors.push('Merchant code (mc) must be numeric');
  }

  // Validate amount format if present (should be a valid number)
  if (upiData.am) {
    const amountStr = upiData.am.trim();
    if (amountStr === '' || isNaN(parseFloat(amountStr)) || !isFinite(parseFloat(amountStr))) {
      errors.push('Amount (am) must be a valid number');
    }
  }

  // Validate currency code format if present (should be 3 characters, uppercase)
  if (upiData.cu && (upiData.cu.length !== 3 || !/^[A-Z]{3}$/.test(upiData.cu))) {
    errors.push('Currency code (cu) must be 3 uppercase letters (e.g., INR, USD)');
  }

  // Validate payee address format (should contain @ symbol)
  if (upiData.pa && !upiData.pa.includes('@')) {
    errors.push('Payee address (pa) should be a valid UPI ID with @ symbol');
  }

  // Validate amount is positive if present
  if (upiData.am) {
    const amount = parseFloat(upiData.am);
    if (amount <= 0) {
      errors.push('Amount (am) must be a positive number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Parses and validates a UPI QR string
 * @param qrString - The UPI QR string
 * @returns Parsed QR response with validation results
 */
export function parseAndValidateQr(qrString: string): ParsedQrResponse {
  // Validate input
  if (!qrString || typeof qrString !== 'string' || qrString.trim() === '') {
    return {
      qrType: 'personal',
      isValid: false,
      data: { pa: '' },
      errors: ['QR data cannot be empty']
    };
  }

  const parsedData = parseUpiUri(qrString);

  if (!parsedData) {
    return {
      qrType: 'personal',
      isValid: false,
      data: { pa: '' },
      errors: ['Invalid UPI QR format. Must start with "upi://pay?"']
    };
  }

  const validation = validateUpiData(parsedData);
  const qrType = classifyQrType(parsedData);

  return {
    qrType,
    isValid: validation.isValid,
    data: parsedData,
    errors: validation.errors.length > 0 ? validation.errors : undefined
  };
}

/**
 * Formats parsed QR data into human-readable text
 * @param parsedResponse - The parsed QR response
 * @returns Human-readable formatted text
 */
export function formatQrDataForDisplay(parsedResponse: ParsedQrResponse): string {
  const { qrType, data, isValid, errors } = parsedResponse;

  let output = `QR Type: ${qrType.replace('_', ' ').toUpperCase()}\n`;
  output += `Valid: ${isValid ? 'Yes' : 'No'}\n\n`;

  if (errors && errors.length > 0) {
    output += `Errors:\n${errors.map(error => `- ${error}`).join('\n')}\n\n`;
  }

  output += `Parsed Data:\n`;
  output += `- Payee Address (pa): ${data.pa || 'Not provided'}\n`;

  if (data.pn) output += `- Payee Name (pn): ${data.pn}\n`;
  if (data.am) output += `- Amount (am): ${data.am}\n`;
  if (data.cu) output += `- Currency (cu): ${data.cu}\n`;
  if (data.mc) output += `- Merchant Code (mc): ${data.mc}\n`;
  if (data.tr) output += `- Transaction Reference (tr): ${data.tr}\n`;
  if (data.mode) output += `- Payment Mode: ${data.mode}\n`;
  if (data.purpose) output += `- Purpose: ${data.purpose}\n`;
  if (data.orgid) output += `- Organization ID: ${data.orgid}\n`;
  if (data.sign) output += `- Digital Signature: ${data.sign}\n`;

  // Add any additional parameters
  const standardFields = ['pa', 'pn', 'am', 'cu', 'mc', 'tr', 'mode', 'purpose', 'orgid', 'sign'];
  const additionalFields = Object.keys(data).filter(key => !standardFields.includes(key));

  if (additionalFields.length > 0) {
    output += `\nAdditional Parameters:\n`;
    additionalFields.forEach(field => {
      output += `- ${field}: ${data[field]}\n`;
    });
  }

  return output;
}
