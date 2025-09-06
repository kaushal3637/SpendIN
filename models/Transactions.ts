import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  upiId: String, // Payee UPI ID
  merchantName: String, // Name of merchant
  totalUsdToPay: String, // Total USD to pay
  inrAmount: String, // INR amount
  walletAddress: String, // Connected wallet address (optional)
  txnHash: String, // Transaction hash (optional, updated later)
  isSuccess: {
    type: Boolean,
    default: false
  },
  scannedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: Date,
}, {
  timestamps: true
});

TransactionSchema.index({ txnHash: 1 }, { unique: true, sparse: true });

export default mongoose.models.UpiTransaction || mongoose.model('UpiTransaction', TransactionSchema, 'UpiTransactions');
