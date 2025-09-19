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

// Estimate network fee dynamically using gas price and approximate gas usage
async function estimateNetworkFeeUsdc(chainId: number): Promise<{ feeUsdc: number; networkName: string }>{
  const chain = getChainById(chainId);
  const rpcUrl = chain?.rpcUrls?.default?.http?.[0];
  const networkName = chain?.name || "Unknown Network";

  // Fallback: if RPC not found, default minimal fee
  if (!rpcUrl) {
    return { feeUsdc: 0.5, networkName };
  }

  try {
    // 1) Fetch current gas price
    const gasResp = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_gasPrice", params: [] }),
      // Do not cache
      next: { revalidate: 0 },
    });

    if (!gasResp.ok) throw new Error(`RPC gas price fetch failed: ${gasResp.status}`);
    const gasJson = await gasResp.json();
    const gasPriceWeiHex = gasJson?.result as string;
    if (!gasPriceWeiHex) throw new Error("Invalid gas price response");

    // Approximate gas used for our flow
    const gasUsed = 87000; // as provided
    const gasPriceWei = parseInt(gasPriceWeiHex, 16);
    const feeWei = gasUsed * gasPriceWei; // fits safely in Number for typical L2 gas

    // Convert wei -> ETH
    const feeEth = feeWei / 1e18;

    // 2) Fetch ETH price in USD using CoinGecko
    if (!COINGECKO_API_KEY) throw new Error("CoinGecko API key missing");
    const pricesResp = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_last_updated_at=true`,
      {
        headers: { Authorization: `Bearer ${COINGECKO_API_KEY}`, Accept: "application/json" },
        next: { revalidate: 30 },
      }
    );
    if (!pricesResp.ok) throw new Error(`CoinGecko price fetch failed: ${pricesResp.status}`);
    const prices = await pricesResp.json();
    const ethUsd = prices?.ethereum?.usd as number | undefined;
    if (!ethUsd) throw new Error("ETH USD price unavailable");

    // 3) Convert ETH fee -> USD -> USDC (1:1)
    const feeUsd = feeEth * ethUsd;
    const feeUsdc = Number(feeUsd.toFixed(6));

    console.log(`Gas fee calculation: gasUsed=${gasUsed}, gasPriceWei=${gasPriceWei}, feeWei=${feeWei}, feeEth=${feeEth}, ethUsd=${ethUsd}, feeUsd=${feeUsd}, feeUsdc=${feeUsdc}`);

    // Safety floor/ceiling to avoid zero or extreme values
    const bounded = Math.min(Math.max(feeUsdc, 0.05), 5.0);
    console.log(`Final bounded fee: ${bounded}`);
    return { feeUsdc: bounded, networkName };
  } catch (err) {
    console.error("Dynamic fee estimation failed, using fallback:", err);
    // Fallback fee
    return { feeUsdc: 0.5, networkName };
  }
}

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

    // Get dynamic network fee (USDC) and network name
    const { feeUsdc: networkFee, networkName } = await estimateNetworkFeeUsdc(chainId);

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

    // Get INR:USD via USDT and ETH USD concurrently
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=tether,ethereum&vs_currencies=inr,usd&include_last_updated_at=true`,
      {
        headers: {
          Authorization: `Bearer ${COINGECKO_API_KEY}`,
          Accept: "application/json",
        },
        next: { revalidate: 60 },
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
    const inrPrice = data.tether?.inr; // INR per USDT (~USD)
    const lastUpdated = data.tether?.last_updated_at || data.ethereum?.last_updated_at;

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
