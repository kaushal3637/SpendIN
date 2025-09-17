import { ethers } from "ethers";
import { USDC_CONTRACT_ADDRESSES } from "@/config/constant";
import { PrivyWallet, USDCBalanceCheckResult } from "@/types/balance.types";

/**
 * Check USDC balance for a wallet on a specific chain
 * @param wallet - The wallet object from Privy
 * @param requiredAmount - Required USDC amount (in USDC units, not wei)
 * @param chainId - Chain ID to check balance on
 * @returns Promise with balance check result
 */
export async function checkUSDCBalance(
  wallet: PrivyWallet,
  requiredAmount: number,
  chainId?: number
): Promise<USDCBalanceCheckResult> {
  if (!wallet) {
    return {
      hasSufficientBalance: false,
      balance: "0",
      error: "Wallet not connected",
    };
  }

  try {
    // Get the wallet provider and signer
    const provider = await wallet.getEthereumProvider();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ethersProvider = new ethers.providers.Web3Provider(provider as any);
    const signer = await ethersProvider.getSigner();

    // Get current chain ID if not provided
    const currentChainId =
      chainId || Number((await ethersProvider.getNetwork()).chainId);

    // Get USDC contract address for current network
    const usdcAddress =
      USDC_CONTRACT_ADDRESSES[
        currentChainId as keyof typeof USDC_CONTRACT_ADDRESSES
      ];
    if (!usdcAddress) {
      throw new Error(
        `USDC contract not configured for chain ID: ${currentChainId}`
      );
    }

    // USDC Contract ABI (minimal)
    const usdcAbi = [
      "function balanceOf(address account) external view returns (uint256)",
      "function decimals() external view returns (uint8)",
    ];

    // Create contract instance
    const usdcContract = new ethers.Contract(
      usdcAddress,
      usdcAbi,
      ethersProvider
    );

    // Get user's wallet address
    const userAddress = await signer.getAddress();

    // Get USDC balance
    const balance = await usdcContract.balanceOf(userAddress);
    const decimals = await usdcContract.decimals();

    // Convert to readable format
    const formattedBalance = ethers.utils.formatUnits(balance, decimals);

    // Check if user has sufficient balance
    const requiredAmountFloat = parseFloat(requiredAmount.toString());
    const currentBalanceFloat = parseFloat(formattedBalance);

    return {
      hasSufficientBalance: currentBalanceFloat >= requiredAmountFloat,
      balance: formattedBalance,
    };
  } catch {
    console.error("Error checking USDC balance:");
    return {
      hasSufficientBalance: false,
      balance: "0",
      error: "Failed to check USDC balance",
    };
  }
}

/**
 * Get USDC contract address for a given chain ID
 * @param chainId - Chain ID to get USDC address for
 * @returns USDC contract address or null if not found
 */
export function getUSDCContractAddress(chainId: number): string | null {
  return (
    USDC_CONTRACT_ADDRESSES[chainId as keyof typeof USDC_CONTRACT_ADDRESSES] ||
    null
  );
}

/**
 * Format USDC amount for display
 * @param amount - Amount in USDC (not wei)
 * @param decimals - Number of decimal places to show
 * @returns Formatted amount string
 */
export function formatUSDCAmount(
  amount: number | string,
  decimals: number = 6
): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return numAmount.toFixed(decimals);
}
