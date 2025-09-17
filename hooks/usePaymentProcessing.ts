import { useCallback, useMemo } from "react";
import { useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { encodeFunctionData, parseAbi } from "viem";
import { sendSponsoredUsdcTransferViaBackend } from "@/lib/aa";
import {
  get7702AccountAddress,
  getTreasuryAddress,
  getUSDCAddress
} from "@/config/constant";
// import { submitDelegation } from "@/lib/apis/delegation";
import { isValidChainId, getChainInfo } from "@/lib/chain-validation";
import { PaymentProcessingOptions } from "@/types/hooks/usePaymentProcessing";
import { BACKEND_URL, API_KEY } from "@/config/constant";
import { useEthersProvider } from "./useEthersProvider";
import { useWallet } from "@/context/WalletContext";
// import { getChainById } from "@/lib/chains";

export function usePaymentProcessing({
  parsedData,
  userAmount,
  conversionResult,
  beneficiaryDetails,
  connectedChain,
  networkFeeUsdc,
  onPaymentResult,
  onPaymentStep,
  onStoreTransaction,
  onUpdateTransaction,
  onSuccess,
}: PaymentProcessingOptions) {
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const { getProvider } = useEthersProvider()

  const processPayment = useCallback(async () => {
    try {
      onPaymentStep("Initiating payment...");
      onPaymentResult({ success: false, status: "pending" });

      // Check USDC balance before proceeding
      // This will be handled by the parent component

      // Validate chain ID before proceeding
      if (!connectedChain) {
        throw new Error(
          "No connected chain found. Please ensure your wallet is connected to a supported network."
        );
      }

      if (!isValidChainId(connectedChain)) {
        const chainInfo = getChainInfo(connectedChain);
        throw new Error(
          `Unsupported network: ${chainInfo?.name || "Unknown"
          } (Chain ID: ${connectedChain}). Please switch to a supported network.`
        );
      }
      const totalUsdcAmount = conversionResult!.usdcAmount + networkFeeUsdc!;

      // Store transaction in database first
      const finalAmount = parsedData!.data.am || userAmount;
      const storeTransactionData = {
        upiId: parsedData!.data.pa,
        merchantName: parsedData!.data.pn || "Unknown Merchant",
        totalUsdToPay: totalUsdcAmount,
        inrAmount: finalAmount,
        walletAddress: undefined, // Will be updated after payment
        txnHash: undefined, // Will be updated after payment
        chainId: connectedChain, // Include validated chain ID
        isSuccess: false, // Default to false, will be updated after payment
      };

      console.log("Storing transaction in database with chain validation...");
      console.log("Chain ID:", connectedChain);
      console.log("Chain Info:", getChainInfo(connectedChain));

      const storeResult = await onStoreTransaction(storeTransactionData);
      console.log("Transaction stored successfully:", storeResult);
      console.log("Transaction ID:", storeResult.transactionId);
      console.log("Chain used:", storeResult.chain);

      // Store the transaction ID for future updates
      const storedTransactionId = storeResult.transactionId;

      // Use the validated chain ID from wallet context
      const chainId = connectedChain!;

      // Step 1: Proceed with ERC-4337 gasless USDC transfer via bundler/paymaster
      console.log("Step 1: Proceeding with ERC-4337 gasless USDC transfer...");
      onPaymentStep("Processing gasless transaction...");

      const ethersProvider = await getProvider()
      const signer = ethersProvider.getSigner()
      const userAddress = await signer.getAddress()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // const ethersProvider = new ethers.providers.Web3Provider(provider as any);
      // const signer = await ethersProvider.getSigner();
      // const userAddress = await signer.getAddress();
      const usdcAddress = getUSDCAddress(chainId);

      // Get account contract for EIP-7702 delegation based on chain

      const accountContract = get7702AccountAddress(chainId);

      // Convert USDC amount to proper units (6 decimals)
      console.log('totalUsdcAmount', totalUsdcAmount);
      const usdcAmount = Math.round(totalUsdcAmount);
      console.log('usdcAmount', usdcAmount);

      // We do not adjust USDC transfer amount on the client; backend handles sponsorship/fees
      const transferAmount = usdcAmount;

      onPaymentStep("Creating EIP-7702 authorization...");

      // We'll delegate the transaction to backend to avoid RPC limitations.

      // Build ERC20 transfer calldata (viem) BEFORE signing (intent is clear)
      // const transferData = encodeFunctionData({
      //   abi: parseAbi(["function transfer(address to, uint256 value)"]),
      //   functionName: 'transfer',
      //   args: [getTreasuryAddress(chainId) as `0x${string}`, BigInt(transferAmount)],
      // });

      // Use AA path with Pimlico bundler + paymaster
      const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY as string;
      if (!pimlicoApiKey) throw new Error('Missing NEXT_PUBLIC_PIMLICO_API_KEY');
      const smartAccountAddress = get7702AccountAddress(chainId) as `0x${string}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eip1193: any = (ethersProvider.provider as any) || (window as any).ethereum;
      const userOpHash = await sendSponsoredUsdcTransferViaBackend({
        eip1193,
        userAddress: userAddress as `0x${string}`,
        smartAccountAddress,
        chainId,
        amount: BigInt(transferAmount),
        pimlicoApiKey: pimlicoApiKey,
        backendUrl: BACKEND_URL,
        accountContract: accountContract as `0x${string}`,
      });

      // Prepare EIP-712 typed data for EIP-7702 Authorization and sign via JSON-RPC
      const network = await ethersProvider.getNetwork();
      const userNonce = await ethersProvider.getTransactionCount(userAddress);
      const typedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Authorization: [
            { name: 'chainId', type: 'uint64' },
            { name: 'address', type: 'address' },
            { name: 'nonce', type: 'uint64' }
          ],
        },
        primaryType: 'Authorization',
        domain: {
          name: 'arbitrum-sepolia',
          version: '1',
          chainId: Number(network.chainId),
          verifyingContract: accountContract,
        },
        message: {
          chainId: Number(network.chainId),
          address: userAddress,
          nonce: userNonce,
        },
      } as const;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rpc = (ethersProvider.provider as any) || (window as any).ethereum;
      // const authSignature: string = await rpc.request({
      //   method: 'eth_signTypedData_v4',
      //   params: [userAddress, JSON.stringify(typedData)],
      // });
      // const { r, s, v } = ethers.utils.splitSignature(authSignature);
      // const yParity = v === 27 ? 0 : 1;
      // const authorization = {
      //   chainId: Number(network.chainId),
      //   address: userAddress as `0x${string}`,
      //   nonce: Number(userNonce),
      //   yParity,
      //   r: r as `0x${string}`,
      //   s: s as `0x${string}`,
      // } as const;

      // onPaymentStep("Submitting delegated transfer to backend...");
      // // Send to backendStableUpi relayer, which supports EIP-7702 External tx
      // const res = await fetch(`${BACKEND_URL}/api/delegate`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     authorization: {
      //       chainId: authorization.chainId,
      //       address: accountContract,
      //       nonce: authorization.nonce,
      //       signature: authSignature,
      //       signer: userAddress,
      //     },
      //     transaction: {
      //       to: userAddress,
      //       data: executeData,
      //       value: '0x0',
      //       gasLimit: '0x7A120',
      //       gasPrice: '0x0',
      //     }
      //   })
      // });
      // const data = await res.json();
      // if (!res.ok || !data?.ok) {
      //   throw new Error(data?.error || 'Delegation failed');
      // }
      // const txHash = data.txHash as string;
      // const wasSuccess = !!txHash;
      const txHash = userOpHash as string;
      const wasSuccess = !!userOpHash;

      onPaymentResult({
        success: wasSuccess,
        status: wasSuccess ? "completed" : "failed",
        transactionHash: txHash,
      });

      // Update transaction in database with payment results
      if (storedTransactionId) {
        const walletAddress = await signer.getAddress();
        await onUpdateTransaction(
          storedTransactionId,
          txHash || "",
          wasSuccess,
          walletAddress
        );
      }

      // Step 2: INR payout handled by backend (PhonePe). Frontend is done.
      onPaymentStep("");
      onSuccess();
    } catch (error) {
      console.error("Payment processing error:", error);
      onPaymentResult({
        success: false,
        error:
          error instanceof Error ? error.message : "Payment processing failed",
        status: "failed",
      });
    }
  }, [
    parsedData,
    userAmount,
    conversionResult,
    beneficiaryDetails,
    connectedChain,
    wallet,
    onPaymentResult,
    onPaymentStep,
    onStoreTransaction,
    onUpdateTransaction,
    onSuccess,
  ]);

  return {
    processPayment,
  };
}
