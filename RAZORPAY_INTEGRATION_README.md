# Razorpay Payout Integration for StableUPI

This integration enables automated INR payouts to UPI IDs after successful USDC payments, completing your Web3 to traditional banking payment flow.

## 🚀 Quick Start

### 1. Environment Setup

Add these environment variables to your `.env.local` file:

```bash
# Razorpay Configuration
RAZORPAY_API_KEY=rzp_test_your_api_key
RAZORPAY_API_SECRET=your_api_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_X_ACCOUNT=your_x_account_id

# For production, use live credentials:
RAZORPAY_API_KEY=rzp_live_your_api_key
RAZORPAY_API_SECRET=your_live_api_secret
RAZORPAY_WEBHOOK_SECRET=your_live_webhook_secret
RAZORPAY_X_ACCOUNT=your_live_x_account_id
```

### 2. Get Razorpay Credentials

1. **Sign up for RazorpayX**: Visit [razorpay.com/x](https://razorpay.com/x)
2. **Complete KYC**: Activate your account for payouts
3. **Generate API Keys**: Get your API key and secret from the dashboard
4. **Get X Account ID**: This is your business account ID for payouts

## 🔧 Integration Flow

### After USDC Payment Confirmation

When a user successfully pays you in USDC, trigger the INR payout:

```typescript
import { handleUsdcPaymentConfirmation } from '@/lib/usdc-payment-integration';

const result = await handleUsdcPaymentConfirmation({
  transactionId: 'your_transaction_id',
  txnHash: '0x...', // From blockchain
  walletAddress: '0x...',
  amount: '100.50', // USDC amount
  chainId: 421614,
});

if (result.success) {
  console.log('Payout initiated:', result.payoutResult);
}
```

## 📡 API Endpoints

### Create Payout
```http
POST /api/razorpay/create-payout
Content-Type: application/json

{
  "upiId": "merchant@upi",
  "merchantName": "Test Merchant",
  "amount": 1000.50,
  "referenceId": "TXN_12345",
  "transactionId": "mongodb_transaction_id",
  "notes": {
    "custom_field": "value"
  }
}
```

### Check Payout Status
```http
GET /api/razorpay/payout-status?transactionId=your_transaction_id
```

### Trigger Payout After USDC Payment
```http
POST /api/razorpay/trigger-payout
Content-Type: application/json

{
  "transactionId": "your_transaction_id"
}
```

### Webhook for Status Updates
Configure webhook URL in Razorpay dashboard:
```
https://yourdomain.com/api/razorpay/webhook
```

## 🔄 How It Works

1. **User scans QR** → UPI details extracted
2. **User pays in USDC** → Blockchain transaction confirmed
3. **INR payout triggered** → Razorpay creates contact & fund account
4. **Money sent to UPI** → Merchant receives INR instantly
5. **Status tracking** → Real-time updates via webhooks

## 📊 Database Schema Updates

The transaction model now includes Razorpay payout tracking:

```javascript
{
  razorpayPayout: {
    payout_id: "pout_xyz123",
    status: "processed", // pending, processing, processed, failed, etc.
    amount: 100050, // In paisa (₹1000.50)
    currency: "INR",
    failure_reason: null,
    payout_created_at: ISODate("2024-01-01T00:00:00Z"),
    payout_processed_at: ISODate("2024-01-01T00:00:05Z"),
    reference_id: "STABLEUPI_txn123_1704067200000"
  },
  payoutTriggered: true
}
```

## 🛠️ Key Functions

### Contact & Fund Account Management

The system automatically:
- Creates Razorpay contacts for new UPI IDs
- Sets up fund accounts for UPI VPA addresses
- Reuses existing contacts/fund accounts for repeat merchants

### Payout Creation

```typescript
const payout = await razorpayContactManager.createPayoutToUPI(
  upiId,
  merchantName,
  inrAmount,
  referenceId,
  notes
);
```

### Status Tracking

```typescript
const status = await payoutService.checkAndUpdatePayoutStatus(transactionId);
```

## 🔔 Webhook Events

Configure these webhook events in Razorpay:
- `payout.processed` - Payout successful
- `payout.failed` - Payout failed
- `payout.reversed` - Payout reversed/cancelled

## 🧪 Testing

### Test UPI IDs
Use these test UPI IDs for development:
- `success@razorpay` - Always succeeds
- `failure@razorpay` - Always fails
- `pending@razorpay` - Stays in pending state

### Testing Commands

```bash
# Check payout stats
curl http://localhost:3000/api/razorpay/trigger-payout

# Create test payout
curl -X POST http://localhost:3000/api/razorpay/create-payout \
  -H "Content-Type: application/json" \
  -d '{
    "upiId": "test@upi",
    "merchantName": "Test Merchant",
    "amount": 100,
    "referenceId": "TEST_123",
    "transactionId": "your_mongo_transaction_id"
  }'
```

## 🔒 Security

- **API Key Security**: Never expose API keys in client-side code
- **Webhook Verification**: Webhooks are verified using HMAC signatures
- **Amount Validation**: Server-side validation of all amounts
- **UPI Format Validation**: Ensures valid UPI ID formats
- **Idempotency**: Reference IDs prevent duplicate payouts

## 🐛 Error Handling

### Common Errors

1. **"Contact creation failed"**
   - Check Razorpay API credentials
   - Verify account has payout permissions

2. **"Fund account creation failed"**
   - Invalid UPI ID format
   - UPI ID not supported by Razorpay

3. **"Insufficient balance"**
   - Add funds to your RazorpayX account
   - Check account balance via API

4. **"Payout failed"**
   - Check UPI ID validity
   - Verify merchant's UPI app is active

### Error Recovery

```typescript
try {
  const result = await payoutService.triggerPayoutAfterUsdcPayment(transactionId);
  if (!result.success) {
    // Handle failure - retry later or notify user
    console.error('Payout failed:', result.error);
  }
} catch (error) {
  // Log error and implement retry mechanism
}
```

## 📈 Monitoring & Analytics

### Get Payout Statistics

```typescript
const stats = await payoutService.getPayoutStats();
// Returns: total payouts, success rate, status breakdown
```

### Monitor Pending Payouts

```typescript
const pending = await payoutService.getPendingPayouts();
// Returns transactions with pending/processing payouts
```

## 🚀 Production Deployment

### Pre-deployment Checklist

- [ ] Update to live Razorpay credentials
- [ ] Configure production webhook URL
- [ ] Test with real UPI IDs
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting
- [ ] Set up backup payout mechanisms

### Production Webhook URL

Update your Razorpay dashboard with:
```
https://your-production-domain.com/api/razorpay/webhook
```

## 📞 Support

- **Razorpay Documentation**: [docs.razorpay.com](https://docs.razorpay.com)
- **API Reference**: [docs.razorpay.com/api/x/payouts](https://docs.razorpay.com/api/x/payouts)
- **Dashboard**: [dashboard.razorpay.com](https://dashboard.razorpay.com)

## 🔄 Integration with Your USDC Flow

After implementing USDC transfers, integrate like this:

```typescript
// In your USDC payment confirmation handler
import { handleUsdcPaymentConfirmation } from '@/lib/usdc-payment-integration';

// After USDC transaction is confirmed on blockchain
const payoutResult = await handleUsdcPaymentConfirmation({
  transactionId,
  txnHash,
  walletAddress,
  amount: usdcAmount,
  chainId
});

// Update UI based on result
if (payoutResult.success) {
  showSuccessMessage('Payment successful! INR sent to merchant.');
} else {
  showErrorMessage('USDC payment confirmed, but INR payout failed.');
}
```

This completes your end-to-end Web3 payment solution! 🎉
