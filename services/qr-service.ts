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
  private scanningLoop: boolean = false; // Add flag to control scanning loop

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
   * Start continuous QR code scanning
   */
  private async startContinuousScanning(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.scanningLoop || !videoElement) return;

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

      if (result && this.scanningLoop) {
        this.scanningLoop = false; // Stop the scanning loop
        this.updateState({ scanResult: result.getText() });

        // Parse the QR data
        const parsed = await this.parseQrData(result.getText());

        if (parsed) {
          this.config?.onQrDetected(result.getText(), parsed);
        }
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        // Continue scanning if no QR code found
        if (this.scanningLoop) {
          setTimeout(() => this.startContinuousScanning(videoElement), 500);
        }
      } else {
        const errorMessage = `Camera error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`;
        this.updateState({ error: errorMessage, isScanning: false });
        this.scanningLoop = false;
        this.config?.onError(errorMessage);
      }
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
    this.updateState({ error: null, scanResult: null, isScanning: true });

    // First, request camera permission
    const permissionGranted = await this.requestCameraPermission();

    if (!permissionGranted) {
      this.updateState({ isScanning: false });
      return;
    }

    // Start the scanning loop
    this.scanningLoop = true;
    await this.startContinuousScanning(videoElement);
  }

  /**
   * Stop scanning and cleanup
   */
  stopScanning(): void {
    this.scanningLoop = false; // Stop the scanning loop
    if (this.codeReader) {
      this.codeReader.reset();
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
          await this.startScanning(videoElement);
        }
      } else {
        await this.startScanning(videoElement);
      }
    }
  }

  /**
   * Reset scanning state and restart camera
   */
  async resetAndRestart(videoElement: HTMLVideoElement): Promise<void> {
    // Stop current scanning
    this.stopScanning();
    
    // Clear results and errors
    this.updateState({
      scanResult: null,
      error: null,
      isLoading: false,
    });

    // Restart scanning if we have permission
    if (this.scanningState.hasPermission === true && videoElement) {
      await this.startScanning(videoElement);
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
    this.scanningLoop = false; // Stop scanning loop
    // Clear config first to prevent state updates during cleanup
    this.config = null;
    this.stopScanning();
    if (this.codeReader) {
      this.codeReader = null;
    }
    this.videoElement = null;
  }
}