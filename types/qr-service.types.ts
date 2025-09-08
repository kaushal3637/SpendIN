import { ParsedQrResponse } from "./upi.types";

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export interface ScanningState {
  isScanning: boolean;
  hasPermission: boolean | null;
  error: string | null;
  scanResult: string | null;
  isLoading: boolean;
}

export interface QrScanningServiceConfig {
  onQrDetected: (qrData: string, parsedData: ParsedQrResponse) => void;
  onError: (error: string) => void;
  onStateChange: (state: Partial<ScanningState>) => void;
}
