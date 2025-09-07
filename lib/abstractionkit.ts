import { ethers } from "ethers";
import { getRpcUrlForChain } from "@/config/constant";

// Type for USDC meta transaction request
interface USDCMetaTransactionRequest {
  from: string;
  to: string;
  value: string;
  validAfter: number;
  validBefore: number;
  nonce: string;
  signature: {
    v: number;
    r: string;
    s: string;
  };
  chainId: number;
}

export type CreateUSDCMetaTxInput = {
  recipient: string;
  usdcAddress: string;
  amountUsdc: string; // decimal string
  userSigner: ethers.Signer;
  chainId: number;
  backendApiKey: string;
  backendUrl?: string;
  upiMerchantDetails?: {
    pa: string;
    pn?: string;
    am?: string;
    cu?: string;
    mc?: string;
    tr?: string;
  };
};

export type CreateUSDCMetaTxResult = {
  metaTransaction: USDCMetaTransactionRequest;
  send: () => Promise<{ success?: boolean; transactionHash?: string; receipt?: unknown }>;
};

// Implements USDC meta transaction using transferWithAuthorization
export async function prepareUSDCMetaTransaction({ 
  recipient, 
  usdcAddress, 
  amountUsdc, 
  userSigner, 
  chainId, 
  backendApiKey, 
  backendUrl = 'http://localhost:3001',
  upiMerchantDetails 
}: CreateUSDCMetaTxInput): Promise<CreateUSDCMetaTxResult> {
  const userAddress = await userSigner.getAddress();
  const RPC_URL = getRpcUrlForChain(chainId);
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  console.log(`Preparing USDC meta transaction for ${userAddress} on chain ${chainId}`);

  // Check user's USDC balance
  try {
    const erc20 = new ethers.Contract(
      usdcAddress,
      ["function balanceOf(address) view returns (uint256)"],
      provider
    );
    const balance: bigint = await erc20.balanceOf(userAddress);
    const amount = ethers.parseUnits(amountUsdc, 6);
    if (balance < amount) {
      const balanceFmt = ethers.formatUnits(balance, 6);
      const amountFmt = ethers.formatUnits(amount, 6);
      throw new Error(
        `Insufficient USDC balance. User ${userAddress} has ${balanceFmt}, needs ${amountFmt} USDC.`
      );
    }
  } catch (balanceErr) {
    throw balanceErr as Error;
  }

  // Step 1: Prepare the meta transaction via backend
  console.log('Step 1: Preparing USDC meta transaction via backend...');
  const prepareResponse = await fetch(`${backendUrl}/api/payments/prepare-meta-transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': backendApiKey
    },
    body: JSON.stringify({
      from: userAddress,
      to: recipient,
      value: amountUsdc,
      chainId: chainId
    })
  });

  if (!prepareResponse.ok) {
    const errorData = await prepareResponse.json();
    throw new Error(`Failed to prepare meta transaction: ${errorData.error || 'Unknown error'}`);
  }

  const prepareData = await prepareResponse.json();
  const { nonce, typedData, validAfter, validBefore } = prepareData.data;
  
  console.log('Meta transaction prepared successfully');

  // Step 2: Sign the typed data for the meta transaction
  console.log('Step 2: Signing meta transaction...');
  let signature: string;
  try {
    if ('signTypedData' in userSigner) {
      signature = await (userSigner as ethers.Signer & { signTypedData: (domain: unknown, types: unknown, message: unknown) => Promise<string> }).signTypedData(
        typedData.domain,
        typedData.types,
        typedData.message
      );
    } else {
      // Fallback for signers that don't support signTypedData
      const digest = ethers.TypedDataEncoder.hash(
        typedData.domain,
        typedData.types,
        typedData.message
      );
      signature = await (userSigner as ethers.Signer).signMessage(ethers.getBytes(digest));
    }
  } catch (error) {
    console.error('Failed to sign meta transaction:', error);
    throw new Error('Failed to sign meta transaction');
  }

  // Parse signature components
  const sig = ethers.Signature.from(signature);
  
  // Create the meta transaction request
  const metaTransactionRequest = {
    from: userAddress,
    to: recipient,
    value: amountUsdc,
    validAfter,
    validBefore,
    nonce,
    signature: {
      v: sig.v,
      r: sig.r,
      s: sig.s
    },
    chainId
  };
  
  console.log('USDC meta transaction signed and ready to send');

  return {
    metaTransaction: metaTransactionRequest,
    send: async () => {
      console.log('Step 3: Sending meta transaction for execution...');
      
      // Default UPI merchant details if not provided
      const defaultUpiMerchantDetails = upiMerchantDetails || {
        pa: 'treasury@upi',
        am: (parseFloat(amountUsdc) * 83).toFixed(2), // Convert USDC to INR
        cu: 'INR'
      };
      
      const executeResponse = await fetch(`${backendUrl}/api/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': backendApiKey
        },
        body: JSON.stringify({
          metaTransactionRequest,
          upiMerchantDetails: defaultUpiMerchantDetails,
          chainId
        })
      });
      
      if (!executeResponse.ok) {
        const errorData = await executeResponse.json();
        throw new Error(`Failed to execute meta transaction: ${errorData.error || 'Unknown error'}`);
      }
      
      const executeData = await executeResponse.json();
      console.log('Meta transaction executed successfully');
      
      return {
        success: executeData.success,
        transactionHash: executeData.data?.transactionHash,
        receipt: executeData.data
      };
    }
  };
}

// Legacy types for backward compatibility
export type Create7702TxInput = {
  recipient: string;
  usdcAddress: string;
  amountUsdc: string; // decimal string
  userSigner: ethers.Signer;
  chainId: number;
  candideApiKey: string;
};

export type Create7702TxResult = {
  userOperation: unknown;
  send: () => Promise<{ success?: boolean; transactionHash?: string; receipt?: unknown; userOpHash?: string }>;
};

// Legacy function for backward compatibility
export async function prepare7702UserOp(input: Create7702TxInput): Promise<Create7702TxResult> {
  console.warn('⚠️ prepare7702UserOp is deprecated. Use prepareUSDCMetaTransaction instead.');
  
  const metaInput: CreateUSDCMetaTxInput = {
    ...input,
    backendApiKey: input.candideApiKey, // Reuse the API key
  };
  
  const metaResult = await prepareUSDCMetaTransaction(metaInput);
  
  return {
    userOperation: metaResult.metaTransaction as unknown,
    send: async () => {
      const result = await metaResult.send();
      return {
        ...result,
        userOpHash: result.transactionHash // Map transaction hash to userOpHash for compatibility
      };
    }
  };
}