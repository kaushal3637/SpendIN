'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { privyConfig, PRIVY_APP_ID } from '@/lib/privy'
import { WalletProvider } from '@/context/WalletContext'

interface PrivyProviderWrapperProps {
  children: React.ReactNode
}

export default function PrivyProviderWrapper({ children }: PrivyProviderWrapperProps) {
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
