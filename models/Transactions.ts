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

  // Razorpay Payout Integration
  razorpayPayout: {
    payout_id: String, // Razorpay payout ID
    status: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'cancelled', 'rejected', 'failed'],
      default: null
    },
    amount: Number, // Amount in INR (in paisa)
    currency: {
      type: String,
      default: 'INR'
    },
    failure_reason: String,
    payout_created_at: Date,
    payout_processed_at: Date,
    reference_id: String, // Unique reference for this payout
  },
  payoutTriggered: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true
});

TransactionSchema.index({ txnHash: 1 }, { unique: true, sparse: true });

export default mongoose.models.UpiTransaction || mongoose.model('UpiTransaction', TransactionSchema, 'UpiTransactions');
