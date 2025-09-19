'use client'

import { useEffect, useState } from 'react'

type TransactionItem = {
  transactionId: string
  upiId: string
  merchantName?: string
  totalUsdToPay: string
  inrAmount: string
  walletAddress?: string
  txnHash?: string
  payoutTransferId?: string
  payoutStatus?: string
  payoutAmount?: number
  chainId: number
  isSuccess: boolean
  scannedAt: string
  paidAt?: string
}

type WalletHistoryResponse = {
  success: boolean
  data?: {
    walletAddress: string
    transactions: TransactionItem[]
    statistics?: {
      totalTransactions: number
      successfulTransactions: number
      totalUsdSpent: number
      totalInrSpent: number
      firstTransaction?: string | null
      lastTransaction?: string | null
    }
    pagination?: { total: number; limit: number; offset: number }
  }
  error?: string
}

export default function TransactionHistory({
  walletAddress,
  backendUrl,
  apiKey,
  onClose
}: {
  walletAddress: string
  backendUrl: string
  apiKey: string
  onClose: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<TransactionItem[]>([])
  const [total, setTotal] = useState<number>(0)

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const url = `${backendUrl}/api/transactions/wallet/${walletAddress}?limit=20&sortBy=scannedAt&sortOrder=desc`
        const res = await fetch(url, {
          headers: {
            'x-api-key': apiKey
          }
        })
        const data: WalletHistoryResponse = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load history')
        }
        setItems(data.data?.transactions || [])
        setTotal(data.data?.pagination?.total || 0)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [walletAddress, backendUrl, apiKey])

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 flex items-center justify-between">
        <h3 className="text-white font-semibold">Transaction History</h3>
        <button
          onClick={onClose}
          className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded"
        >
          Close
        </button>
      </div>
      <div className="p-4">
        <div className="text-xs text-slate-500 mb-3">
          Wallet: <span className="font-mono">{walletAddress}</span>
          {total ? <span className="ml-2">• {total} total</span> : null}
        </div>

        {isLoading && (
          <div className="text-center text-slate-600 py-6">Loading history...</div>
        )}

        {error && (
          <div className="text-center text-red-600 py-6">{error}</div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="text-center text-slate-600 py-6">No transactions found.</div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b">
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Merchant</th>
                  <th className="py-2 px-2">INR</th>
                  <th className="py-2 px-2">USDC</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">Txn</th>
                </tr>
              </thead>
              <tbody>
                {items.map((tx) => {
                  const date = new Date(tx.scannedAt)
                  const statusBadge = tx.isSuccess ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  return (
                    <tr key={tx.transactionId} className="border-b last:border-0">
                      <td className="py-2 px-2 whitespace-nowrap">{date.toLocaleString()}</td>
                      <td className="py-2 px-2">
                        <div className="font-medium text-slate-800">{tx.merchantName || 'Merchant'}</div>
                        <div className="text-xs text-slate-500">{tx.upiId}</div>
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">₹{Number(tx.inrAmount).toLocaleString()}</td>
                      <td className="py-2 px-2 whitespace-nowrap">{Number(tx.totalUsdToPay).toFixed(2)}</td>
                      <td className="py-2 px-2">
                        <span className={`text-xs px-2 py-1 rounded ${statusBadge}`}>{tx.isSuccess ? 'SUCCESS' : 'FAILED'}</span>
                        {tx.payoutStatus && (
                          <div className="text-[10px] text-slate-500 mt-1">Payout: {tx.payoutStatus}</div>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {tx.txnHash ? (
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded inline-block">
                            {tx.txnHash.slice(0, 8)}...{tx.txnHash.slice(-6)}
                          </code>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


