# StableUPI - QR Code Payment System

A comprehensive Next.js application that enables QR code-based UPI payments with Web3 integration and automated payouts using Cashfree Payout API.

## Features

### 🔄 QR Code Processing
- Real-time QR code scanning using device camera
- UPI URI parsing and validation
- Support for personal, static merchant, and dynamic merchant QR types

### 💰 Currency Conversion
- Real-time INR to USDC conversion using CoinGecko API
- Network-specific fee calculation
- Blockchain transaction processing

### 🚀 Web3 Integration
- Wallet connection via Privy.io
- ERC-20 USDC token transfers
- EIP-7702 User Operations support
- Multi-chain support (Arbitrum Sepolia, Ethereum Sepolia)

### 💸 Cashfree Payout Integration (NEW)
- Automated payouts when QR codes are scanned
- Test mode support for development
- Customer management with UPI IDs
- QR code generation for customers
- Real-time payout status tracking

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Cashfree merchant account (for payout features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stableupi
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start MongoDB and run the development server:
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Cashfree Payout Setup

For the automated payout features, follow the setup guide in [CASHFREE_SETUP.md](./CASHFREE_SETUP.md).

### Test the Payout Flow

1. **Create Test Customers**: Visit `/test/customers` to create customers with UPI IDs
2. **Generate QR Codes**: Generate QR codes for your test customers
3. **Test Auto Payout**: Go to `/scan`, enable auto-payout, and scan customer QR codes
4. **Monitor Transactions**: Check payout status and transaction history

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── customers/          # Customer management APIs
│   │   ├── payouts/           # Cashfree payout APIs
│   │   ├── scans/             # QR scanning APIs
│   │   └── conversion/        # Currency conversion APIs
│   ├── scan/                  # QR scanner page
│   ├── test/customers/        # Test customer management page
│   └── page.tsx              # Landing page
├── components/
│   ├── scan-route/           # QR scanner components
│   └── ...                   # Other UI components
├── lib/
│   ├── cashfree.ts           # Cashfree API integration
│   ├── upi.ts               # UPI parsing utilities
│   ├── qr-generator.ts      # QR code generation
│   └── ...                  # Other utilities
├── models/
│   ├── Customer.ts          # Customer data model
│   ├── Transactions.ts      # Transaction data model
│   └── ...
└── types/
    └── upi.types.ts         # TypeScript type definitions
```

## API Endpoints

### Customer Management
- `POST /api/customers/create` - Create new customer with UPI ID
- `GET /api/customers/[id]/qrcode` - Generate QR code for customer

### Payout Management
- `POST /api/payouts/initiate` - Initiate payout to customer
- `GET /api/payouts/status` - Check payout status

### QR Processing
- `POST /api/scans` - Parse and validate QR data
- `POST /api/conversion/inr-to-usd` - Convert INR to USDC

## Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/stableupi

# Cashfree Payout API (Test Mode)
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_CLIENT_ID=your_client_id
CASHFREE_CLIENT_SECRET=your_client_secret

# CoinGecko API
COINGECKO_API_KEY=your_coingecko_api_key

# Other configurations...
```

## Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Web3**: Privy.io, Ethers.js, Viem
- **QR Processing**: @zxing/library
- **Payouts**: Cashfree Payout API
- **Icons**: Lucide React

## Development

### Available Scripts

```bash
yarn dev          # Start development server
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Run ESLint
```

### Key Features Implementation

1. **QR Code Scanning**: Uses ZXing library for real-time camera-based QR scanning
2. **UPI Parsing**: Custom parser for UPI URIs with validation
3. **Currency Conversion**: CoinGecko API integration for live rates
4. **Customer Management**: MongoDB-based customer storage with UPI ID generation
5. **Automated Payouts**: Cashfree API integration for instant payouts
6. **Web3 Transactions**: ERC-20 token transfers with gas sponsorship

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues related to:
- **Cashfree Integration**: Check [CASHFREE_SETUP.md](./CASHFREE_SETUP.md)
- **Next.js**: Visit [Next.js Documentation](https://nextjs.org/docs)
- **Web3 Integration**: Check [Privy Documentation](https://docs.privy.io)

## Deploy on Vercel

The easiest way to deploy is using [Vercel Platform](https://vercel.com/new):

```bash
vercel --prod
```

Make sure to set all environment variables in your Vercel dashboard.
