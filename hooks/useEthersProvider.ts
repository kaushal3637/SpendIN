import { useWallets } from '@privy-io/react-auth'
import { useMemo } from 'react'
import { ethers } from 'ethers'

export function useEthersProvider() {
  const { wallets } = useWallets()

  const injected = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyWin = window as any
    const eth = anyWin?.ethereum
    if (!eth) return null
    if (Array.isArray(eth.providers)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mm = eth.providers.find((p: any) => p?.isMetaMask)
      return mm || eth.providers[0]
    }
    return eth
  }, [])

  const getProvider = async () => {
    // 1) Prefer Privy wallet provider
    if (wallets.length > 0) {
      const privyEth = await wallets[0].getEthereumProvider()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new ethers.providers.Web3Provider(privyEth as any)
    }
    // 2) Fallback to injected (MetaMask)
    if (injected) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new ethers.providers.Web3Provider(injected as any)
    }
    throw new Error('No Ethereum provider available')
  }

  return { getProvider }
}