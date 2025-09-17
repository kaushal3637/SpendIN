// ERC-7702 UserOperation types
export interface ERC7702UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  accountGasLimits: string;
  preVerificationGas: string;
  gasFees: string;
  paymasterAndData: string;
  signature: string;
  eip7702Auth?: {
    chainId: string;
    nonce: string;
    yParity: string;
    r: string;
    s: string;
  };
}

// ERC-7702 transaction input types
export interface ERC7702TransactionInput {
  recipient: string;
  usdcAddress: string;
  amountUsdc: string;
  userSigner: any; // ethers.Signer
  chainId: number;
  backendApiKey: string;
  backendUrl?: string;
  upiMerchantDetails?: {
    pa: string;
    pn: string;
    am: string;
    cu: string;
    mc: string;
    tr: string;
  };
}

// ERC-7702 transaction result types
export interface ERC7702TransactionResult {
  userOperation: ERC7702UserOperation;
  send: () => Promise<{ 
    success?: boolean; 
    transactionHash?: string; 
    receipt?: any; 
    userOpHash?: string 
  }>;
}
