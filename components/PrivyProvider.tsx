'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { privyConfig } from '@/lib/privy'
import { PRIVY_APP_ID } from '@/config/constant'
import { WalletProvider } from '@/context/WalletContext'

interface PrivyProviderWrapperProps {
  children: React.ReactNode
}

export default function PrivyProviderWrapper({ children }: PrivyProviderWrapperProps) {
  // Check if PRIVY_APP_ID is properly configured
  if (!PRIVY_APP_ID || PRIVY_APP_ID === 'Privy_App_ID') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Configuration Error</h2>
          <p className="text-gray-700 mb-4">
            Privy App ID is not configured. Please set the following environment variables:
          </p>
          <div className="text-left bg-gray-100 p-3 rounded text-sm font-mono">
            <p>NEXT_PUBLIC_DEVELOPMENT_PRIVY_APP_ID=your_privy_app_id</p>
            <p>NEXT_PUBLIC_PRODUCTION_PRIVY_APP_ID=your_privy_app_id</p>
          </div>
          <p className="text-gray-600 text-sm mt-4">
            Copy the env.example file to .env.local and configure your Privy App ID.
          </p>
        </div>
      </div>
    )
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={privyConfig}
    >
      <WalletProvider>
        {children}
      </WalletProvider>
    </PrivyProvider>
  )
}
