# Cashfree Payout Integration Setup Guide

This guide will help you set up Cashfree Payout API integration for testing QR code-based payouts.

## Prerequisites

1. **Cashfree Account**: Sign up at [Cashfree](https://www.cashfree.com) for a merchant account
2. **API Credentials**: Get your test mode API credentials from the Cashfree dashboard
3. **MongoDB**: Ensure MongoDB is running and accessible

## Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```env
# Cashfree Payout API Configuration (Test Mode)
# Get these from https://sandbox.cashfree.com -> Developers -> API Keys
CASHFREE_APP_ID=CF_TEST_APP_ID
CASHFREE_SECRET_KEY=CF_TEST_SECRET_KEY
CASHFREE_CLIENT_ID=CF_TEST_CLIENT_ID
CASHFREE_CLIENT_SECRET=CF_TEST_CLIENT_SECRET

# Database Configuration (if not already set)
MONGODB_URI=mongodb://localhost:27017/stableupi
```

## Getting Cashfree API Credentials

1. **Sign up/Login** to [Cashfree Dashboard](https://sandbox.cashfree.com)
2. **Navigate to Developers** section in the sidebar
3. **Click on "API Keys"** or "Generate API Keys"
4. **Copy the following credentials**:
   - **App ID**: Your unique application identifier
   - **Secret Key**: Used for API authentication
   - **Client ID**: OAuth client identifier
   - **Client Secret**: OAuth client secret

## Test Mode vs Production Mode

### Test Mode (Sandbox)
- **Base URL**: `https://sandbox.cashfree.com/payout`
- **Credentials**: Use the test credentials from above
- **Features**: Full API functionality with dummy data
- **Limits**: May have transaction limits for testing

### Production Mode
- **Base URL**: `https://api.cashfree.com/payout`
- **Credentials**: Different from test mode (get from production dashboard)
- **Features**: Real money transfers
- **Verification**: Requires business verification and KYC

## API Endpoints Used

### 1. Authentication
```
POST https://sandbox.cashfree.com/payout/payout/v1/authorize
```

### 2. Add Beneficiary
```
POST https://sandbox.cashfree.com/payout/payout/v1/addBeneficiary
```

### 3. Initiate Transfer
```
POST https://sandbox.cashfree.com/payout/payout/v1/requestTransfer
```

### 4. Get Transfer Status
```
GET https://sandbox.cashfree.com/payout/payout/v1/getTransferStatus?transferId={transferId}
```

## Testing the Integration

### Step 1: Create Test Customers
1. Visit `/test/customers` in your application
2. Click "Create Test Customer"
3. Fill in customer details (name, email, phone)
4. Leave UPI ID empty for auto-generation or enter a custom one

### Step 2: Generate QR Codes
1. Click "Generate QR" for any customer
2. Download the QR code or copy the UPI ID
3. Use this QR code for testing payouts

### Step 3: Test Auto Payout
1. Go to the scan page (`/scan`)
2. Enable "Auto Payout (Test Mode)" toggle
3. Enter a payout amount (₹100-₹1000 recommended for testing)
4. Scan the customer QR code
5. Watch for the automatic payout processing

### Step 4: Verify Transactions
1. Check the payout status in the UI
2. Use the transfer ID to check status via API
3. View customer transaction history

## Test Data for Cashfree

When using test mode, you can use these dummy values:

### Bank Account Details (for beneficiary creation)
- **Account Number**: `1234567890`
- **IFSC Code**: `HDFC0000001`
- **Account Holder Name**: Customer's name

### UPI IDs for Testing
- Use format: `username@paytm` (Paytm UPI)
- Use format: `username@oksbi` (SBI UPI)
- Use format: `username@ybl` (Yono by SBI)

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check if API credentials are correct
   - Ensure you're using test/sandbox credentials for test mode

2. **Beneficiary Addition Failed**
   - Verify beneficiary details format
   - Check if UPI ID format is valid
   - Ensure bank details are in correct format

3. **Transfer Failed**
   - Check if beneficiary is properly added
   - Verify transfer amount limits
   - Ensure sufficient balance in your Cashfree account

4. **QR Code Not Generating**
   - Check if qrcode package is installed
   - Verify customer data is complete

### API Response Codes

- **200**: Success
- **400**: Bad Request (check request format)
- **401**: Unauthorized (check API credentials)
- **409**: Conflict (duplicate beneficiary/customer)
- **500**: Internal Server Error (check server logs)

## Security Best Practices

1. **Never commit API credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Validate all inputs** before making API calls
4. **Implement rate limiting** for API endpoints
5. **Log sensitive operations** without exposing credentials
6. **Use HTTPS** for all API communications

## Support

- **Cashfree Documentation**: https://docs.cashfree.com/docs/payouts
- **API Reference**: https://docs.cashfree.com/reference/payouts
- **Sandbox Dashboard**: https://sandbox.cashfree.com
- **Support**: Contact Cashfree support through their dashboard

## Next Steps

1. Test all API endpoints thoroughly in sandbox mode
2. Implement proper error handling and user feedback
3. Add transaction logging and monitoring
4. Set up webhooks for real-time transaction updates
5. Implement retry logic for failed transactions
6. Add compliance checks and fraud prevention
