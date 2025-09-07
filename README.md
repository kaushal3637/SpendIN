# StableUPI - Revolutionary Web3 Payment System

A cutting-edge Next.js application that bridges traditional UPI payments with Web3 technology, enabling seamless cryptocurrency transactions through simple QR code scanning. Built with gas sponsorship, real-time conversion, and automated merchant payouts.

## 🌟 Key Features

### 🔄 Advanced QR Code Processing
- **Real-time Camera Scanning**: Device camera integration for instant QR code detection
- **Intelligent UPI Parsing**: Advanced parsing engine supporting personal, static merchant, and dynamic merchant QR types
- **Multi-format Support**: Handles various UPI URI formats with comprehensive validation
- **Error Recovery**: Robust error handling with fallback mechanisms

### 💰 Smart Currency Conversion
- **Live INR ↔ USDC Conversion**: Real-time rates via CoinGecko API with automatic updates
- **Network-Optimized Fees**: Chain-specific fee calculation for optimal cost efficiency
- **Precision Processing**: 6-decimal precision for accurate USDC transactions
- **Rate Caching**: Intelligent caching with 60-second refresh intervals

### 🚀 Enterprise Web3 Integration
- **Seamless Wallet Connection**: Privy.io integration for frictionless user onboarding
- **Gas Sponsorship**: Complete ETH gas fee sponsorship - users pay only in USDC
- **ERC-20 USDC Transfers**: Secure token transfers with balance verification
- **EIP-7702 User Operations**: Advanced account abstraction with meta-transactions
- **Multi-Chain Support**: Native support for Arbitrum Sepolia and Ethereum Sepolia testnets

### 💸 Automated Merchant Payouts
- **Cashfree Integration**: Enterprise-grade payout processing with test and production modes
- **Instant Settlements**: Automatic INR payouts to merchant UPI IDs upon successful transactions
- **Beneficiary Management**: Automated customer registration as Cashfree beneficiaries
- **Real-time Status Tracking**: Live payout status monitoring with detailed transaction logs
- **Test Mode Support**: Complete sandbox environment for development and testing

### 👥 Customer & QR Management
- **Dynamic Customer Creation**: Automated customer onboarding with UPI ID generation
- **QR Code Generation**: Custom QR code creation with embedded UPI payment details
- **Beneficiary Registration**: Seamless integration with Cashfree payout network
- **Transaction History**: Comprehensive logging and status tracking

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - Runtime environment
- **MongoDB** - Database for customer and transaction storage
- **Web3 Wallet** - MetaMask, Coinbase Wallet, or any Web3-compatible wallet
- **Cashfree Account** - For automated payout features (optional for basic scanning)
- **CoinGecko API Key** - For live currency conversion rates

### Installation & Setup

1. **Clone the Repository**
```bash
git clone <repository-url>
cd stableupi
```

2. **Install Dependencies**
```bash
yarn install
```

3. **Environment Configuration**
```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Web3 Configuration
NEXT_PUBLIC_CANDIDE_API_KEY=your_candide_api_key_here
NEXT_PUBLIC_TREASURY_ADDRESS=0xYourTreasuryAddressHere
CANDIDE_API_KEY=your_candide_api_key_here

# Database
DEVELOPMENT_MONGODB_URI=mongodb://localhost:27017/stableupi
PRODUCTION_MONGODB_URI=mongodb://localhost:27017/stableupi

# Currency Conversion
COINGECKO_API_KEY=your_coingecko_api_key

# Cashfree Payout (Optional - for automated payouts)
CASHFREE_APP_ID=your_test_app_id
CASHFREE_SECRET_KEY=your_test_secret_key
CASHFREE_CLIENT_ID=your_test_client_id
CASHFREE_CLIENT_SECRET=your_test_client_secret
```

4. **Start MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or using local MongoDB installation
mongod
```

5. **Run Development Server**
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## 🧪 Testing the Full Flow

### 1. Basic QR Scanning
1. Navigate to `/scan`
2. Connect your Web3 wallet
3. Allow camera permissions
4. Enter payment amount in INR
5. Scan any UPI QR code
6. Confirm the USDC transaction

### 2. Automated Payout Testing
1. **Setup Cashfree**: Follow [CASHFREE_SETUP.md](./CASHFREE_SETUP.md)
2. **Create Test Customers**: Visit `/test/customers`
3. **Generate QR Codes**: Create QR codes for test customers
4. **Enable Auto-Payout**: Go to `/scan` → toggle "Auto Payout (Test Mode)"
5. **Test Transactions**: Scan customer QR codes and watch automated INR payouts
6. **Monitor Status**: Check payout status in real-time

### 3. Supported Test Data
```bash
# Test UPI IDs
testuser@paytm
merchant@oksbi
customer@ybl

# Test Amounts
₹100 - ₹1000 (recommended for testing)
```

## 📁 Project Structure

```
stableupi/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── 7702/                 # EIP-7702 User Operations (Deprecated)
│   │   │   ├── prepare-userop/   # User operation preparation
│   │   │   └── send-userop/      # User operation execution
│   │   ├── cashfree-beneficiary/ # Cashfree beneficiary management
│   │   │   ├── [beneId]/         # Beneficiary-specific operations
│   │   │   └── add/              # Add new beneficiary
│   │   ├── conversion/           # Currency conversion services
│   │   │   └── inr-to-usd/       # INR to USDC conversion
│   │   ├── customers/            # Customer management
│   │   │   ├── create/           # Create new customers
│   │   │   └── [customerId]/     # Customer-specific operations
│   │   │       └── qrcode/       # QR code generation
│   │   ├── payouts/              # Payout operations
│   │   │   ├── initiate/         # Initiate payouts
│   │   │   └── status/           # Check payout status
│   │   ├── scans/                # QR code scanning
│   │   ├── server-info/          # Server information
│   │   ├── store-upi-transaction/ # Transaction storage
│   │   └── update-upi-transaction/ # Transaction updates
│   ├── scan/                     # QR scanner page
│   ├── server-info/              # Server info display
│   ├── test/                     # Test utilities
│   │   └── customers/            # Customer test management
│   ├── favicon.ico
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React Components
│   ├── ChainButtons.tsx          # Network selection
│   ├── Features.tsx              # Features showcase
│   ├── Footer.tsx                # Site footer
│   ├── Hero.tsx                  # Hero section
│   ├── HowItWorks.tsx            # How it works section
│   ├── Navbar.tsx                # Navigation
│   ├── PrivyProvider.tsx         # Web3 provider
│   ├── scan-route/               # QR scanner components
│   │   └── ScanPage.tsx          # Main scanner interface
│   └── SwitchNetwork.tsx         # Network switching
├── config/                       # Configuration files
│   └── constant.ts               # App constants and settings
├── context/                      # React Context
│   └── WalletContext.tsx         # Wallet state management
├── lib/                          # Utility libraries
│   ├── abstractionkit.ts         # Web3 abstraction utilities
│   ├── cashfree.ts               # Cashfree API client
│   ├── chain-validation.ts       # Blockchain validation
│   ├── chains.ts                 # Chain configurations
│   ├── dbConnect.ts              # Database connection
│   ├── getCollections.ts         # Database collections
│   ├── privy.ts                  # Privy authentication
│   ├── qr-generator.ts           # QR code generation
│   ├── qr-storage.ts             # QR data storage
│   └── upi.ts                    # UPI parsing utilities
├── models/                       # Database models
│   ├── Customer.ts               # Customer schema
│   └── Transactions.ts           # Transaction schema
├── types/                        # TypeScript definitions
│   ├── cashfree.types.ts         # Cashfree API types
│   ├── customer.types.ts         # Customer types
│   └── upi.types.ts              # UPI types
├── public/                       # Static assets
├── node_modules/                 # Dependencies
├── package.json                  # Project metadata
├── tsconfig.json                 # TypeScript config
├── next.config.ts                # Next.js config
├── tailwind.config.js            # Tailwind CSS config
├── eslint.config.mjs             # ESLint config
├── env.example                   # Environment template
└── README.md                     # Project documentation
```

## 🔗 API Endpoints

### Core API Routes

#### 🔄 QR Code Processing
- `POST /api/scans` - Parse and validate UPI QR data
  ```json
  {
    "qrData": "upi://pay?pa=merchant@upi&pn=Test Merchant&am=100.00"
  }
  ```

#### 💰 Currency Conversion
- `POST /api/conversion/inr-to-usd` - Convert INR to USDC with network fees
  ```json
  {
    "amount": 1000,
    "chainId": 421614
  }
  ```

#### 👥 Customer Management
- `POST /api/customers/create` - Create customer with UPI ID
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "upiId": "john@paytm"
  }
  ```
- `GET /api/customers/[customerId]/qrcode` - Generate customer QR code

#### 💸 Payout Management
- `POST /api/payouts/initiate` - Initiate payout to beneficiary
  ```json
  {
    "beneficiaryId": "bene_123",
    "amount": 1000,
    "currency": "INR"
  }
  ```
- `GET /api/payouts/status?transferId=transfer_123` - Check payout status

#### 🏦 Cashfree Beneficiary Management
- `POST /api/cashfree-beneficiary/add` - Add new beneficiary
- `GET /api/cashfree-beneficiary/[beneId]` - Get beneficiary details

#### 🔐 EIP-7702 User Operations (Legacy)
- `POST /api/7702/prepare-userop` - Prepare user operation *(Deprecated)*
- `POST /api/7702/send-userop` - Send user operation *(Deprecated)*

#### 📊 Transaction Management
- `POST /api/store-upi-transaction` - Store UPI transaction
- `POST /api/update-upi-transaction` - Update transaction status
- `GET /api/server-info` - Get server information

## ⚙️ Environment Variables

### Required Configuration

```env
# ==========================================
# WEB3 CONFIGURATION
# ==========================================

# Candide API Key (Required for bundler and paymaster services)
CANDIDE_API_KEY=your_candide_api_key_here
NEXT_PUBLIC_CANDIDE_API_KEY=your_candide_api_key_here

# Treasury Address (Required for receiving payments)
NEXT_PUBLIC_TREASURY_ADDRESS=0xYourTreasuryAddressHere

# ==========================================
# DATABASE CONFIGURATION
# ==========================================

# MongoDB Connection Strings
DEVELOPMENT_MONGODB_URI=mongodb://localhost:27017/stableupi
PRODUCTION_MONGODB_URI=mongodb://your_production_mongodb_uri

# ==========================================
# EXTERNAL API KEYS
# ==========================================

# CoinGecko API (Required for currency conversion)
COINGECKO_API_KEY=your_coingecko_api_key

# ==========================================
# CASHFREE PAYOUT CONFIGURATION (Optional)
# ==========================================

# Test Mode Credentials
CASHFREE_APP_ID=CF_TEST_APP_ID
CASHFREE_SECRET_KEY=CF_TEST_SECRET_KEY
CASHFREE_CLIENT_ID=CF_TEST_CLIENT_ID
CASHFREE_CLIENT_SECRET=CF_TEST_CLIENT_SECRET

# Production Mode Credentials (Optional)
CASHFREE_APP_ID_PROD=CF_PROD_APP_ID
CASHFREE_SECRET_KEY_PROD=CF_PROD_SECRET_KEY
CASHFREE_CLIENT_ID_PROD=CF_PROD_CLIENT_ID
CASHFREE_CLIENT_SECRET_PROD=CF_PROD_CLIENT_SECRET

# Fund Source IDs (Optional)
CASHFREE_FUNDSOURCE_ID=CASHFREE_DEFAULT
CASHFREE_FUNDSOURCE_ID_PROD=your_production_fundsource_id

# ==========================================
# APPLICATION URLS (Optional)
# ==========================================

NEXT_PUBLIC_DEVELOPMENT_URL=http://localhost:3000
NEXT_PUBLIC_PRODUCTION_URL=https://yourdomain.com
```

### Getting API Keys

1. **Candide API Key**: Sign up at [Candide Wallet](https://www.candidewallet.com/)
2. **CoinGecko API Key**: Get from [CoinGecko API](https://www.coingecko.com/en/api)
3. **Cashfree Credentials**: Register at [Cashfree](https://www.cashfree.com/) → Developers → API Keys

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Wallet   │    │  StableUPI App  │    │  Cashfree API   │
│                 │    │                 │    │                 │
│ • MetaMask      │◄──►│ • QR Scanner    │◄──►│ • Payout API    │
│ • Coinbase      │    │ • Currency Conv │    │ • Beneficiary   │
│ • Privy Auth    │    │ • Web3 Tx       │    │ • Status Check  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Blockchain     │    │   Database      │    │  CoinGecko API │
│                 │    │                 │    │                 │
│ • USDC Transfer │    │ • Customers     │    │ • Exchange Rates│
│ • Gas Sponsor   │    │ • Transactions  │    │ • Rate Cache    │
│ • Multi-Chain   │    │ • Payout Status │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **QR Scan** → Parse UPI data → Validate merchant details
2. **Currency Conversion** → INR to USDC → Add network fees
3. **Web3 Transaction** → Prepare meta-transaction → Sign & execute
4. **Merchant Payout** → Register beneficiary → Initiate transfer → Track status

## 🛠️ Technology Stack

### Frontend & UI
- **Next.js 15** - React framework with App Router
- **React 19** - UI library with concurrent features
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v4** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

### Backend & Database
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database for customer/transactions
- **Mongoose** - MongoDB object modeling

### Web3 & Blockchain
- **Privy.io** - Web3 wallet authentication
- **Ethers.js v6** - Ethereum blockchain interaction
- **AbstractionKit** - Account abstraction utilities
- **Viem** - Lightweight Ethereum library
- **@zxing/library** - QR code scanning and generation

### External Integrations
- **Cashfree Payout API** - Automated INR payouts
- **CoinGecko API** - Live cryptocurrency prices
- **Candide Services** - Bundler and paymaster for gas sponsorship

## 💻 Development

### Available Scripts

```bash
# Development
yarn dev              # Start development server with Turbopack
yarn dev:debug        # Start with debug mode

# Production
yarn build            # Build for production with Turbopack
yarn start            # Start production server

# Quality & Testing
yarn lint             # Run ESLint
yarn type-check       # TypeScript type checking

# Database
yarn db:seed          # Seed database with test data
yarn db:migrate       # Run database migrations
```

### Development Workflow

1. **Local Development**
   ```bash
   yarn dev
   # Visit http://localhost:3000
   ```

2. **Testing Features**
   ```bash
   # Test QR scanning: http://localhost:3000/scan
   # Test customer management: http://localhost:3000/test/customers
   # View server info: http://localhost:3000/server-info
   ```

3. **Database Setup**
   ```bash
   # Start MongoDB locally or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest

   # Or install MongoDB locally
   brew install mongodb-community  # macOS
   sudo apt install mongodb        # Ubuntu
   ```

### Core Implementation Details

#### 🔄 QR Code Processing Pipeline
```typescript
// 1. Camera access and scanning
const codeReader = new BrowserMultiFormatReader()
const result = await codeReader.decodeFromVideoDevice()

// 2. UPI URI parsing and validation
const parsedData = parseAndValidateQr(qrData)

// 3. Data formatting for display
const formattedData = formatQrDataForDisplay(parsedResponse)
```

#### 💰 Currency Conversion Engine
```typescript
// Real-time INR to USDC conversion with caching
const conversion = await fetch('/api/conversion/inr-to-usd', {
  method: 'POST',
  body: JSON.stringify({ amount: 1000, chainId: 421614 })
})

// Response includes network fees and total cost
{
  inrAmount: 1000,
  usdAmount: 13.45,
  usdcAmount: 13.45,
  networkFee: 0.5,
  totalUsdcAmount: 13.95
}
```

#### 🚀 Web3 Transaction Flow
```typescript
// Prepare USDC meta-transaction with gas sponsorship
const { metaTransaction, send } = await prepareUSDCMetaTransaction({
  recipient: treasuryAddress,
  usdcAddress: USDC_CONTRACT_ADDRESSES[chainId],
  amountUsdc: usdcAmount,
  userSigner: signer,
  chainId: chainId,
  backendApiKey: apiKey
})

// Execute the transaction (gas-free for user)
await send()
```

#### 💸 Automated Payout System
```typescript
// 1. Register beneficiary with Cashfree
const beneficiary = await cashfreeService.addBeneficiary(customerDetails)

// 2. Initiate payout
const payout = await cashfreeService.initiatePayout({
  beneficiaryId: beneficiary.id,
  amount: inrAmount,
  currency: 'INR'
})

// 3. Track status
const status = await cashfreeService.getPayoutStatus(payout.transferId)
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel --prod
   ```

2. **Environment Variables**
   - Set all environment variables in Vercel dashboard
   - Use production MongoDB URI
   - Configure production Cashfree credentials

3. **Domain Configuration**
   ```bash
   vercel domains add yourdomain.com
   ```

### Docker Deployment

1. **Build Docker Image**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN yarn install --frozen-lockfile
   COPY . .
   RUN yarn build
   EXPOSE 3000
   CMD ["yarn", "start"]
   ```

2. **Run with Docker Compose**
   ```yaml
   version: '3.8'
   services:
     stableupi:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
       depends_on:
         - mongodb
     mongodb:
       image: mongo:latest
       ports:
         - "27017:27017"
   ```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set production API keys and secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure monitoring and logging
- [ ] Set up backup strategies
- [ ] Configure rate limiting
- [ ] Test all payment flows

## 🔧 Troubleshooting

### Common Issues

#### QR Scanner Not Working
```bash
# Check camera permissions
# Ensure HTTPS in production (required for camera access)
# Verify @zxing/library is properly imported
```

#### Web3 Connection Failed
```bash
# Verify NEXT_PUBLIC_CANDIDE_API_KEY is set
# Check if wallet is connected to supported network
# Ensure treasury address is configured
```

#### Currency Conversion Failed
```bash
# Verify COINGECKO_API_KEY is valid
# Check API rate limits
# Ensure network connectivity
```

#### Cashfree Payout Errors
```bash
# Verify test credentials are correct
# Check beneficiary details format
# Ensure sufficient balance in Cashfree account
```

### Debug Commands

```bash
# Check environment variables
console.log(process.env.CANDIDE_API_KEY)

# Test database connection
yarn db:connect

# Check API endpoints
curl -X GET http://localhost:3000/api/server-info

# Monitor MongoDB
docker logs mongodb
```

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Bad Request | Check request format and parameters |
| 401 | Unauthorized | Verify API keys and credentials |
| 409 | Conflict | Check for duplicate entries |
| 500 | Server Error | Check server logs and environment |

## 🤝 Contributing

### Development Setup
1. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/stableupi.git
   cd stableupi
   ```

2. **Branch Strategy**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

3. **Code Standards**
   ```bash
   yarn lint          # Check code style
   yarn type-check    # Verify TypeScript types
   ```

4. **Testing**
   ```bash
   # Test QR scanning functionality
   # Test Web3 transactions on testnet
   # Test Cashfree payout flow
   ```

### Pull Request Process
1. Update documentation for new features
2. Add tests for new functionality
3. Ensure all lint checks pass
4. Update CHANGELOG.md if needed
5. Request review from maintainers

### Code Guidelines
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Keep components modular and reusable
- Handle errors gracefully

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Resources

### Documentation
- **[CASHFREE_SETUP.md](./CASHFREE_SETUP.md)** - Cashfree integration guide
- **[API Documentation](./docs/api.md)** - Complete API reference
- **[Deployment Guide](./docs/deployment.md)** - Production deployment steps

### External Resources
- **Next.js Docs**: https://nextjs.org/docs
- **Privy.io**: https://docs.privy.io
- **Cashfree API**: https://docs.cashfree.com
- **CoinGecko API**: https://www.coingecko.com/en/api
- **Ethers.js**: https://docs.ethers.org

### Community
- **Issues**: [GitHub Issues](https://github.com/yourusername/stableupi/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/stableupi/discussions)
- **Discord**: Join our community server

### Security
- **Report Vulnerabilities**: security@yourdomain.com
- **Security Policy**: [SECURITY.md](./SECURITY.md)

---

<div align="center">

**Built with ❤️ for the future of Web3 payments**

⭐ Star this repo if you find it useful!

[Report Bug](https://github.com/yourusername/stableupi/issues) • [Request Feature](https://github.com/yourusername/stableupi/issues) • [Contribute](CONTRIBUTING.md)

</div>
