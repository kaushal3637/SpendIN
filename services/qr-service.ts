import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import {
  QrScanningServiceConfig,
  ScanningState,
} from "@/types/qr-service.types";
import { ParsedQrResponse } from "@/types/upi.types";

export class QrScanningService {
  private codeReader: BrowserMultiFormatReader | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private config: QrScanningServiceConfig | null = null;
  private scanningState: ScanningState = {
    isScanning: false,
    hasPermission: null,
    error: null,
    scanResult: null,
    isLoading: false,
  };

  constructor(config: QrScanningServiceConfig) {
    this.config = config;
  }

  /**
   * Request camera permission
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      stream.getTracks().forEach((track) => track.stop());

      this.updateState({ hasPermission: true });
      return true;
    } catch (err) {
      console.error("Camera permission denied:", err);
      this.updateState({
        hasPermission: false,
        error: "Please allow camera access and try again.",
      });
      return false;
    }
  }

  /**
   * Parse QR data using the API
   */
  async parseQrData(qrString: string): Promise<ParsedQrResponse | null> {
    try {
      this.updateState({ isLoading: true });

      const response = await fetch("/api/scans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrData: qrString }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to parse QR data");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error parsing QR data:", err);
      const errorMessage = `Failed to parse QR data: ${
        err instanceof Error ? err.message : "Unknown error"
      }`;
      this.config?.onError(errorMessage);
      return null;
    } finally {
      this.updateState({ isLoading: false });
    }
  }

  /**
   * Initialize the QR code reader
   */
  private initializeCodeReader(): BrowserMultiFormatReader {
    if (!this.codeReader) {
      this.codeReader = new BrowserMultiFormatReader();
    }
    return this.codeReader;
  }

  /**
   * Get available video devices and find the back camera
   */
  private async findBestCameraDevice(): Promise<MediaDeviceInfo | null> {
    try {
      const codeReader = this.initializeCodeReader();
      const videoInputDevices = await codeReader.listVideoInputDevices();

      if (videoInputDevices.length === 0) {
        throw new Error("No camera devices found");
      }

      // Find the back camera (environment facing)
      let selectedDevice = videoInputDevices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear") ||
          device.label.toLowerCase().includes("environment")
      );

      // If no back camera found, try to find one without "front" in the name
      if (!selectedDevice) {
        selectedDevice = videoInputDevices.find(
          (device) =>
            !device.label.toLowerCase().includes("front") &&
            !device.label.toLowerCase().includes("user")
        );
      }

      // Fallback to first device if we can't identify back camera
      if (!selectedDevice) {
        selectedDevice = videoInputDevices[0];
      }

      return selectedDevice;
    } catch (error) {
      console.error("Error finding camera device:", error);
      this.config?.onError(
        `Camera error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return null;
    }
  }

  /**
   * Start QR code scanning
   */
  async startScanning(videoElement: HTMLVideoElement): Promise<void> {
    if (!videoElement) {
      throw new Error("Video element is required for scanning");
    }

    this.videoElement = videoElement;
    this.updateState({ error: null, scanResult: null });

    // First, request camera permission
    const permissionGranted = await this.requestCameraPermission();

    if (!permissionGranted) {
      return;
    }

    try {
      const selectedDevice = await this.findBestCameraDevice();
      if (!selectedDevice) {
        return;
      }

      const codeReader = this.initializeCodeReader();

      // Try the selected camera first, fallback to auto-selection if it fails
      let result;
      try {
        result = await codeReader.decodeOnceFromVideoDevice(
          selectedDevice.deviceId,
          videoElement
        );
      } catch {
        // Fallback to auto-selection (ZXing will choose best camera)
        result = await codeReader.decodeOnceFromVideoDevice(
          undefined,
          videoElement
        );
      }

      if (result) {
        this.updateState({ scanResult: result.getText(), isScanning: false });

        // Parse the QR data
        const parsed = await this.parseQrData(result.getText());

        if (parsed) {
          this.config?.onQrDetected(result.getText(), parsed);
        }
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        // Continue scanning if no QR code found
        if (this.scanningState.isScanning) {
          setTimeout(() => this.startScanning(videoElement), 500);
        }
      } else {
        const errorMessage = `Camera error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`;
        this.updateState({ error: errorMessage, isScanning: false });
        this.config?.onError(errorMessage);
      }
    }
  }

  /**
   * Stop scanning and cleanup
   */
  stopScanning(): void {
    if (this.codeReader) {
      this.codeReader.reset();
      this.codeReader = null;
    }
    this.updateState({ isScanning: false });
  }

  /**
   * Toggle scanning state
   */
  async toggleScanning(videoElement: HTMLVideoElement): Promise<void> {
    if (this.scanningState.isScanning) {
      this.stopScanning();
    } else {
      // If permission was previously denied, try to request it again
      if (this.scanningState.hasPermission === false) {
        this.updateState({ error: null, scanResult: null });
        const permissionGranted = await this.requestCameraPermission();
        if (permissionGranted) {
          this.updateState({ isScanning: true });
          await this.startScanning(videoElement);
        }
      } else {
        this.updateState({ isScanning: true });
        await this.startScanning(videoElement);
      }
    }
  }

  /**
   * Reset scanning state
   */
  reset(): void {
    this.updateState({
      scanResult: null,
      error: null,
      isScanning: false,
      isLoading: false,
    });
    this.stopScanning();
  }

  /**
   * Get current scanning state
   */
  getScanningState(): ScanningState {
    return { ...this.scanningState };
  }

  /**
   * Update scanning state and notify listeners
   */
  private updateState(updates: Partial<ScanningState>): void {
    this.scanningState = { ...this.scanningState, ...updates };
    this.config?.onStateChange(updates);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopScanning();
    this.videoElement = null;
    this.config = null;
  }
}
