import { NextResponse } from "next/server";
import { qrStorage } from "@/lib/qr-storage";
import { formatQrDataForDisplay } from "@/lib/upi";

/**
 * GET /api/scans/last
 * Returns the last parsed QR data in human-readable format
 */
export async function GET() {
  try {
    // Retrieve the last parsed QR data from shared storage
    const lastParsedQr = qrStorage.getLastQrData();

    if (!lastParsedQr) {
      return new NextResponse(
        "No QR data has been parsed yet. Please use POST /api/parse-qr first.",
        {
          status: 404,
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );
    }

    // Format the data for human-readable display
    const formattedData = formatQrDataForDisplay(lastParsedQr.parsedData);
    console.log("Formatted Data:", formattedData);
    // Add timestamp information
    const timestampInfo = `\nLast Parsed: ${lastParsedQr.timestamp.toISOString()}\nOriginal QR: ${
      lastParsedQr.qrString
    }\n\n`;
    const fullOutput = timestampInfo + formattedData;

    return new NextResponse(fullOutput, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Error retrieving QR data:", error);

    return new NextResponse("Internal server error while retrieving QR data", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
