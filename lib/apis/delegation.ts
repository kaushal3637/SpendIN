import { BACKEND_URL } from "@/config/constant";

// Types for EIP-7702 delegation
export interface DelegationAuthorization {
  chainId: number;
  address: string;
  nonce: number | string;
  signature: string;
  signer: string;
}

export interface DelegationTransaction {
  to: string;
  data: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
}

export interface DelegationRequest {
  authorization: DelegationAuthorization;
  transaction: DelegationTransaction;
}

export interface EstimateRequest {
  authorization: {
    chainId: number;
    address: string;
  };
  intent: {
    token: string;
    to: string;
    amount: string;
  };
}

export interface DelegationResponse {
  ok: boolean;
  type?: string;
  txHash?: string;
  error?: string;
  code?: string;
}

export interface EstimateResponse {
  ok: boolean;
  gasEstimate?: string;
  effectiveGasPrice?: string;
  gasCostWei?: string;
  feeUSDC?: string;
  transferAmount?: string;
  note?: string;
  error?: string;
  code?: string;
}

/**
 * Submit EIP-7702 delegation transaction to backend
 * @param request - Delegation request with authorization and transaction data
 * @param backendUrl - Optional backend URL override
 * @returns Promise with delegation result
 */
export async function submitDelegation(
  request: DelegationRequest,
  backendUrl?: string
): Promise<DelegationResponse> {
  try {
    const url = backendUrl || `${BACKEND_URL}:3001`; // Default to port 3001 for delegation service
    
    console.log('🔄 Submitting delegation transaction:', {
      chainId: request.authorization.chainId,
      to: request.transaction.to,
      signer: request.authorization.signer
    });

    const response = await fetch(`${url}/api/delegate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Delegation submission failed:', data);
      return {
        ok: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        code: data.code || 'UNKNOWN'
      };
    }

    console.log('✅ Delegation submitted successfully:', data);
    return data;

  } catch (error) {
    console.error('❌ Error submitting delegation:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'NETWORK_ERROR'
    };
  }
}

/**
 * Validate delegation authorization data
 * @param auth - Authorization data to validate
 * @returns Validation result with errors if any
 */
export function validateDelegationAuthorization(auth: Partial<DelegationAuthorization>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!auth.chainId || typeof auth.chainId !== 'number') {
    errors.push('Chain ID is required and must be a number');
  }

  if (!auth.address?.trim()) {
    errors.push('Address is required');
  } else if (!/^0x[a-fA-F0-9]{40}$/.test(auth.address)) {
    errors.push('Invalid address format');
  }

  if (auth.nonce === undefined || auth.nonce === null) {
    errors.push('Nonce is required');
  }

  if (!auth.signature?.trim()) {
    errors.push('Signature is required');
  } else if (!/^0x[a-fA-F0-9]{130}$/.test(auth.signature)) {
    errors.push('Invalid signature format');
  }

  if (!auth.signer?.trim()) {
    errors.push('Signer address is required');
  } else if (!/^0x[a-fA-F0-9]{40}$/.test(auth.signer)) {
    errors.push('Invalid signer address format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate delegation transaction data
 * @param tx - Transaction data to validate
 * @returns Validation result with errors if any
 */
export function validateDelegationTransaction(tx: Partial<DelegationTransaction>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!tx.to?.trim()) {
    errors.push('Transaction target (to) is required');
  } else if (!/^0x[a-fA-F0-9]{40}$/.test(tx.to)) {
    errors.push('Invalid transaction target address format');
  }

  if (!tx.data?.trim()) {
    errors.push('Transaction data is required');
  } else if (!/^0x[a-fA-F0-9]*$/.test(tx.data)) {
    errors.push('Invalid transaction data format');
  }

  if (!tx.value?.trim()) {
    errors.push('Transaction value is required');
  }

  if (!tx.gasLimit?.trim()) {
    errors.push('Gas limit is required');
  }

  if (!tx.gasPrice?.trim()) {
    errors.push('Gas price is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
