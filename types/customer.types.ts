export interface Customer {
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  upiId: string;
  upiName: string;
  isActive: boolean;
  isBeneficiaryAdded: boolean;
  isTestMode: boolean;
  createdAt: string;
  qrCodeData: string;
  totalReceived?: number;
  totalPaid?: number;
  transactionCount?: number;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
  upiId?: string;
  upiName?: string;
}
