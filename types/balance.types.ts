export interface USDCBalanceCheckResult {
  hasSufficientBalance: boolean;
  balance: string;
  error?: string;
}

export interface PrivyWallet {
  getEthereumProvider: () => Promise<unknown>;
}
