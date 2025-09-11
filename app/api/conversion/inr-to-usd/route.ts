import { NextRequest, NextResponse } from "next/server";
import { getChainById } from "@/lib/chains";
import { COINGECKO_API_KEY } from "@/config/constant";

interface ConversionResponse {
  inrAmount: number;
  usdAmount: number;
  usdcAmount: number;
  exchangeRate: number;
  lastUpdated: string;
  networkFee: number;
  networkName: string;
  totalUsdcAmount: number;
}

// Network fee structure based on chain ID
const getNetworkFee = (chainId: number): number => {
  switch (chainId) {
    case 421614: // Arbitrum Sepolia Testnet
      return 0.5;
    case 11155111: // Sepolia Testnet
      return 1.0;
    default:
      return 0.5; // Default to 0.5 USDC for unknown networks
  }
};

const getNetworkName = (chainId: number): string => {
  const chain = getChainById(chainId);
  return chain?.name || "Unknown Network";
};

/**
 * POST /api/conversion/inr-to-usd
 * Converts INR amount to USDC using CoinGecko API with network fees
 * Body: { "amount": 1000, "chainId": 421614 } (optional chainId, defaults to 421614)
 * Response: { inrAmount, usdAmount, usdcAmount, exchangeRate, lastUpdated, networkFee, networkName, totalUsdcAmount }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { amount, chainId = 421614 } = body; // Default to Arbitrum Sepolia

    // Validate input
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        {
          error: "Invalid amount. Please provide a positive number.",
        },
        { status: 400 }
      );
    }

    // Get network fee and name
    const networkFee = getNetworkFee(chainId);
    const networkName = getNetworkName(chainId);

    // Check for CoinGecko API key
    if (!COINGECKO_API_KEY) {
      console.error("CoinGecko API key not found");
      return NextResponse.json(
        {
          error: "API configuration error",
        },
        { status: 500 }
      );
    }

    // Get INR to USD exchange rate from CoinGecko
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=inr&include_last_updated_at=true`,
      {
        headers: {
          Authorization: `Bearer ${COINGECKO_API_KEY}`,
          Accept: "application/json",
        },
        next: { revalidate: 60 }, // Cache for 1 minute
      }
    );

    if (!response.ok) {
      console.error(
        `CoinGecko API error: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        {
          error: "Failed to fetch exchange rates",
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Extract the INR price of USDT (which is pegged to USD)
    const inrPrice = data.tether?.inr;
    const lastUpdated = data.tether?.last_updated_at;

    if (!inrPrice) {
      console.error("Invalid response from CoinGecko:", data);
      return NextResponse.json(
        {
          error: "Invalid exchange rate data",
        },
        { status: 500 }
      );
    }

    // Calculate conversion
    // Since USDC is pegged to USD (1 USDC = 1 USD), we need to convert INR to USD first
    const usdAmount = amount / inrPrice; // INR amount divided by INR per USD gives USD amount
    const usdcAmount = usdAmount; // 1 USDC = 1 USD
    const exchangeRate = 1 / inrPrice; // USD per INR

    // Calculate total USDC amount including network fee
    const totalUsdcAmount = usdcAmount + networkFee;

    const result: ConversionResponse = {
      inrAmount: amount,
      usdAmount: Number(usdAmount.toFixed(6)),
      usdcAmount: Number(usdcAmount.toFixed(6)),
      exchangeRate: Number(exchangeRate.toFixed(6)),
      lastUpdated: lastUpdated
        ? new Date(lastUpdated * 1000).toISOString()
        : new Date().toISOString(),
      networkFee,
      networkName,
      totalUsdcAmount: Number(totalUsdcAmount.toFixed(6)),
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error converting INR to USDC:", error);

    return NextResponse.json(
      {
        error: "Internal server error while converting currency",
      },
      { status: 500 }
    );
  }
}
