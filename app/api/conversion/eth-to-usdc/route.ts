import { NextRequest, NextResponse } from "next/server";
import { COINGECKO_API_KEY } from "@/config/constant";

/**
 * POST /api/conversion/eth-to-usdc
 * Body: { wei: string }
 * Response: { usdc: number, eth: number, ethUsd: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wei } = body || {};

    if (!wei || typeof wei !== "string") {
      return NextResponse.json({ error: "Missing 'wei' (string)" }, { status: 400 });
    }

    if (!COINGECKO_API_KEY) {
      return NextResponse.json({ error: "API configuration error" }, { status: 500 });
    }

    // Fetch ETH price in USD
    const resp = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_last_updated_at=true",
      {
        headers: {
          Authorization: `Bearer ${COINGECKO_API_KEY}`,
          Accept: "application/json",
        },
        next: { revalidate: 30 },
      }
    );

    if (!resp.ok) {
      return NextResponse.json({ error: "Failed to fetch ETH price" }, { status: 502 });
    }

    const data = await resp.json();
    const ethUsd = Number(data?.ethereum?.usd || 0);
    if (!ethUsd) {
      return NextResponse.json({ error: "Invalid ETH price data" }, { status: 502 });
    }

    // Convert wei -> ETH -> USD -> USDC
    const weiBig = BigInt(wei);
    const eth = Number(weiBig) / 1e18;
    const usdc = eth * ethUsd; // 1 USDC ≈ 1 USD

    return NextResponse.json(
      {
        eth,
        ethUsd,
        usdc: Number(usdc.toFixed(6)),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


