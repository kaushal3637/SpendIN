import { NextRequest, NextResponse } from "next/server";
import { getUpiTransactionCollection } from "@/lib/getCollections";
import {
  isValidChainId,
  getChainInfo,
  getSupportedChains,
} from "@/lib/chain-validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      upiId,
      merchantName,
      totalUsdToPay,
      inrAmount,
      walletAddress,
      txnHash,
      chainId,
      isSuccess = false,
    } = body;

    // Validate required fields
    if (
      !upiId ||
      !merchantName ||
      !totalUsdToPay ||
      !inrAmount ||
      chainId === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: upiId, merchantName, totalUsdToPay, inrAmount, chainId",
        },
        { status: 400 }
      );
    }

    // Validate chain ID
    if (!isValidChainId(chainId)) {
      const supportedChains = getSupportedChains();
      return NextResponse.json(
        {
          error: `Invalid chain ID: ${chainId}. Only supported chains are allowed.`,
          validChains: supportedChains.map((chain) => ({
            id: chain.id,
            name: chain.name,
            symbol: chain.symbol,
            isTestnet: chain.isTestnet,
          })),
        },
        { status: 400 }
      );
    }

    const TransactionModel = await getUpiTransactionCollection();

    // Create transaction data
    const transactionData = {
      upiId,
      merchantName,
      totalUsdToPay: totalUsdToPay.toString(),
      inrAmount: inrAmount.toString(),
      walletAddress,
      txnHash,
      chainId,
      isSuccess,
      scannedAt: new Date(),
    };

    // Store the transaction
    const transaction = new TransactionModel(transactionData);
    const savedTransaction = await transaction.save();

    const chainInfo = getChainInfo(chainId);

    return NextResponse.json({
      success: true,
      message: `Transaction stored successfully on ${chainInfo?.name}`,
      transactionId: savedTransaction._id,
      chain: {
        id: chainId,
        name: chainInfo?.name,
        symbol: chainInfo?.symbol,
        isTestnet: chainInfo?.isTestnet,
      },
    });
  } catch (error) {
    console.error("Error storing UPI transaction:", error);

    // Handle duplicate transaction hash error
    if (error && typeof error === "object" && "code" in error) {
      const mongoError = error as {
        code?: number;
        keyPattern?: Record<string, number>;
      };
      if (mongoError.code === 11000 && mongoError.keyPattern?.txnHash) {
        return NextResponse.json(
          {
            error: "Transaction already exists",
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to store transaction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
