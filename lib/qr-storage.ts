import { StoredQrData, ParsedQrResponse } from '@/types/upi.types';

/**
 * Simple in-memory storage for QR data
 * In production, consider using Redis, database, or other persistent storage
 */
class QrStorage {
  private lastParsedQr: StoredQrData | null = null;

  /**
   * Store the parsed QR data
   */
  storeQrData(qrString: string, parsedData: ParsedQrResponse): void {
    this.lastParsedQr = {
      timestamp: new Date(),
      qrString,
      parsedData
    };
  }

  /**
   * Retrieve the last parsed QR data
   */
  getLastQrData(): StoredQrData | null {
    return this.lastParsedQr;
  }

  /**
   * Clear the stored QR data
   */
  clearQrData(): void {
    this.lastParsedQr = null;
  }
}

// Export a singleton instance
export const qrStorage = new QrStorage();
