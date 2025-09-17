import { encodeFunctionData, http, createPublicClient, parseAbi, createWalletClient, custom } from 'viem'
import { entryPoint08Address, entryPoint08Abi, getUserOperationHash } from 'viem/account-abstraction'
import { chains } from '@/lib/chains'
import accountAbi from './aa-abi'
import { getUSDCAddress, getTreasuryAddress } from '@/config/constant'

export function createAaClients(chainId: number, pimlicoApiKey: string) {
  const chain = chains.find(c => c.id === chainId)
  if (!chain) throw new Error('Unsupported chain')
  const publicClient = createPublicClient({ chain, transport: http() })
  return { chain, publicClient }
}

export async function sendUserOpViaBackend(params: { eip1193: any; userAddress: `0x${string}`; smartAccountAddress: `0x${string}`; chainId: number; amount: bigint; pimlicoApiKey: string; backendUrl: string; accountContract: `0x${string}` }) {
  const { eip1193, userAddress, smartAccountAddress, chainId, amount, pimlicoApiKey, backendUrl, accountContract } = params
  const { chain, publicClient } = createAaClients(chainId, pimlicoApiKey)
  const walletClient = createWalletClient({ chain, transport: custom(eip1193), account: userAddress })

  const usdc = getUSDCAddress(chainId) as `0x${string}`
  const to = getTreasuryAddress(chainId) as `0x${string}`
  const transferData = encodeFunctionData({ abi: parseAbi(["function transfer(address to, uint256 value)"]), functionName: 'transfer', args: [to, amount] })
  const callData = encodeFunctionData({ abi: accountAbi, functionName: 'execute', args: [usdc, BigInt(0), transferData] })

  const nonce = await publicClient.readContract({ address: entryPoint08Address, abi: entryPoint08Abi, functionName: 'getNonce', args: [smartAccountAddress, BigInt(0)] }) as bigint

  // Build minimal userOp (v0.8 packed fields)
  const zero32 = (`0x${'00'.repeat(32)}`) as `0x${string}`
  const userOp: any = {
    sender: smartAccountAddress,
    nonce,
    initCode: '0x',
    callData,
    accountGasLimits: zero32,
    preVerificationGas: BigInt(0),
    gasFees: zero32,
    paymasterAndData: '0x',
    signature: '0x',
  }

  // Sponsor with our custom paymaster
  const sponsorReq = await fetch(`${backendUrl}/api/paymaster/sponsor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userOp: JSON.parse(JSON.stringify(userOp, (_: string, v: any) => typeof v === 'bigint' ? `0x${v.toString(16)}` : v)),
      entryPoint: entryPoint08Address
    })
  })
  const sponsorRes = await sponsorReq.json()
  if (!sponsorRes.ok) throw new Error(sponsorRes.error || 'paymaster sponsorship failed')
  const sponsored: any = sponsorRes
  const finalOp = { ...userOp, ...sponsored } as any

  // Sign userOp hash with connected wallet
  const hash = getUserOperationHash({ chainId: chain.id, entryPointAddress: entryPoint08Address, entryPointVersion: '0.8', userOperation: { ...finalOp, sender: smartAccountAddress } })
  const sig = await walletClient.signMessage({ account: userAddress, message: { raw: hash } as any } as any)
  finalOp.signature = sig

  // Build EIP-7702 Authorization typed data and signature
  const eoaNonce = await publicClient.getTransactionCount({ address: userAddress })
  const typedData = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Authorization: [
        { name: 'chainId', type: 'uint64' },
        { name: 'address', type: 'address' },
        { name: 'nonce', type: 'uint64' }
      ],
    },
    primaryType: 'Authorization',
    domain: {
      name: chain.name,
      version: '1',
      chainId: chain.id,
      verifyingContract: accountContract,
    },
    message: {
      chainId: chain.id,
      address: userAddress,
      nonce: Number(eoaNonce),
    },
  } as const
  const authSignature = await (walletClient as any).request({ method: 'eth_signTypedData_v4', params: [userAddress, JSON.stringify(typedData)] })

  // Send to backend bundler wrapper
  const response = await fetch(`${backendUrl}/api/aa/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authorization: { chainId: chain.id, address: userAddress, nonce: Number(eoaNonce), signature: authSignature, signer: userAddress, accountContract },
      userOp: JSON.parse(JSON.stringify(finalOp, (_: string, v: any) => typeof v === 'bigint' ? `0x${v.toString(16)}` : v)),
    })
  })
  const data = await response.json()
  if (!response.ok || !data?.ok) throw new Error(data?.error || 'aa/send failed')
  return data.txHash as string
}

export async function sendSponsoredUsdcTransferViaBackend(params: { eip1193: any; userAddress: `0x${string}`; smartAccountAddress: `0x${string}`; chainId: number; amount: bigint; pimlicoApiKey: string; backendUrl: string; accountContract: `0x${string}` }) {
  return sendUserOpViaBackend(params)
}


