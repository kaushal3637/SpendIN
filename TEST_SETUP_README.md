# Razorpay Test Setup Guide

This guide will help you set up test customers and QR codes in Razorpay's test mode to verify your payout functionality.

## 🚀 Quick Start

### 1. Access Test Setup Page

Navigate to `/test-setup` in your application to access the test management interface.

### 2. Environment Setup

Ensure your `.env.local` file has test mode Razorpay credentials:

```bash
# Test Mode Credentials (required)
RAZORPAY_API_KEY=rzp_test_your_test_api_key
RAZORPAY_API_SECRET=your_test_api_secret
RAZORPAY_X_ACCOUNT=your_test_x_account_id
```

### 3. Create Test Data

Use the test setup page to create test customers and QR codes:

1. **Create Test Customers**: Click "Create Test Customers" to create 3 sample customers
2. **Create QR Codes**: Click "Create QR Codes" to generate QR codes for each customer
3. **Complete Setup**: Click "Complete Setup" to do both steps at once

## 📋 Test Data Created

### Test Customers
- **Test Merchant 1**: Restaurant (₹9876543210)
- **Test Merchant 2**: Retail Store (₹9876543211)
- **Test Merchant 3**: Services (₹9876543212)

### QR Codes
Each customer gets a QR code with different amounts:
- ₹100 for Merchant 1
- ₹250 for Merchant 2
- ₹500 for Merchant 3

## 🔧 API Endpoints

### Test Setup Management
```http
GET  /api/razorpay/test-setup     # Get current test setup status
POST /api/razorpay/test-setup     # Create test data (customers/QR codes)
DELETE /api/razorpay/test-setup   # Cleanup test data
```

### Individual Operations
```http
POST /api/razorpay/test-customer  # Create single test customer
GET  /api/razorpay/test-customer  # Get all test customers
POST /api/razorpay/test-qr        # Create QR code for customer
GET  /api/razorpay/test-qr        # Get all test QR codes
```

## 🧪 Testing Payout Flow

### 1. Create Test Transaction
Use the QR codes you created to simulate payments in your app.

### 2. Trigger Payout
Once a USDC payment is confirmed, trigger the payout:

```bash
curl -X POST http://localhost:3000/api/razorpay/trigger-payout \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "your_transaction_id"}'
```

### 3. Check Payout Status
Monitor payout status using the existing payout API:

```bash
curl http://localhost:3000/api/razorpay/payout-status?transactionId=your_transaction_id
```

## 🎯 Manual Testing in Razorpay Dashboard

### 1. Access Test Mode
- Go to your Razorpay Dashboard
- Toggle to "Test Mode" using the switch in the top navigation

### 2. Simulate Payments
- Use the QR codes from your test setup
- Make test payments through UPI apps in test mode
- Payments will appear as successful without real money movement

### 3. Manage Payouts
- Navigate to Payouts section in test mode
- View created payouts and manually change their status
- Test different payout scenarios (success, failure, pending)

## 📊 Test Scenarios

### Successful Payout Flow
1. Scan QR code → Parse UPI data
2. Enter amount → Convert INR to USDC
3. Confirm payment → USDC transaction
4. Trigger payout → INR sent to merchant
5. Check status → Payout completed

### Error Scenarios
- Test with invalid UPI IDs
- Test insufficient balance
- Test payout failures
- Test status updates

## 🔍 Verification Steps

### 1. Check Test Customers
```bash
curl http://localhost:3000/api/razorpay/test-customer
```

### 2. Check Test QR Codes
```bash
curl http://localhost:3000/api/razorpay/test-qr
```

### 3. Check Test Setup Status
```bash
curl http://localhost:3000/api/razorpay/test-setup
```

### 4. Verify Payout Creation
```bash
curl http://localhost:3000/api/razorpay/trigger-payout \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "test_txn_123"}'
```

## 🧹 Cleanup

### Remove Test Data
Use the "Cleanup Test Data" button on the test setup page or:

```bash
curl -X DELETE http://localhost:3000/api/razorpay/test-setup
```

This will close all test QR codes while keeping customers for future use.

## 🔒 Security Notes

- All test operations are isolated from live mode
- No real money transactions occur
- Test data is clearly marked with special identifiers
- API keys are separate for test and live modes

## 🚨 Important Reminders

1. **Always use test mode credentials** for development
2. **Switch to live credentials** only when ready for production
3. **Test thoroughly** before going live
4. **Keep test and live data separate**
5. **Document your test scenarios** for future reference

## 📞 Support

- Razorpay Test Mode Dashboard: [dashboard.razorpay.com](https://dashboard.razorpay.com)
- Razorpay Documentation: [docs.razorpay.com](https://docs.razorpay.com)
- API Reference: [docs.razorpay.com/api](https://docs.razorpay.com/api)

## 🔄 UPI Transactions & QR Codes in Test Mode

### **Understanding Test Mode Limitations**
- **UPI QR Codes**: Require special permissions (not enabled by default)
- **Rate Limiting**: API calls are limited in test mode
- **Bharat QR**: Available as alternative in test mode

### **Available Testing Options**

#### **1. Bharat QR Codes (Recommended)**
The system automatically falls back to Bharat QR when UPI QR is not available:
```bash
# System handles this automatically
✅ Created Bharat QR code for Test Merchant 1: qr_xxx
```

#### **2. Mock QR Code Testing**
Use the mock QR codes with test UPI IDs for complete payment simulation:
```bash
# Test successful payment using mock QR
curl -X POST http://localhost:3000/api/test-mock-payment \
  -H "Content-Type: application/json" \
  -d '{"qrId": "mock_qr_test", "upiId": "success@razorpay"}'

# Test failed payment using mock QR
curl -X POST http://localhost:3000/api/test-mock-payment \
  -H "Content-Type: application/json" \
  -d '{"qrId": "mock_qr_test", "upiId": "failure@razorpay"}'
```

#### **3. Test UPI Transaction Simulation**
Use Razorpay's test UPI IDs for direct transaction testing:
```bash
# Test successful payment
curl -X POST http://localhost:3000/api/test-upi-transaction \
  -H "Content-Type: application/json" \
  -d '{"upiId": "success@razorpay", "amount": 100}'

# Test failed payment
curl -X POST http://localhost:3000/api/test-upi-transaction \
  -H "Content-Type: application/json" \
  -d '{"upiId": "failure@razorpay", "amount": 100}'
```

#### **4. Enable Full UPI Features**
To get complete UPI QR code support:
1. **Dashboard**: [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. **Switch to Test Mode** (top navigation toggle)
3. **Contact Support**:
   - Email: merchantonboarding@razorpay.com
   - Phone: 022-3344-5465
   - Request: "Enable UPI QR code generation for test account"
4. **Wait Time**: 1-2 business days

### **Rate Limiting Solutions**
- ✅ **Automatic Delays**: System adds 1-second delays between API calls
- ✅ **Rate Limit Handling**: Automatic retry with 2-second wait on 429 errors
- ✅ **Graceful Degradation**: Continues with available features

### **Test UPI IDs Reference**
| UPI ID | Behavior | Use Case |
|--------|----------|----------|
| `success@razorpay` | ✅ Always succeeds | Test successful payments |
| `failure@razorpay` | ❌ Always fails | Test error handling |
| `pending@razorpay` | ⏳ Stays pending | Test pending flows |

Happy testing! 🎉
