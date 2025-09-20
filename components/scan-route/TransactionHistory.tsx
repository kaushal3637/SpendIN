'use client'

import { useEffect, useState } from 'react'
import {
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  TrendingUp,
  Wallet,
  Calendar,
  IndianRupee,
  DollarSign,
  RefreshCw,
  Eye,
  EyeOff,
  Grid3X3,
  List,
} from 'lucide-react'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all')
  const [showWallet, setShowWallet] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const url = `${backendUrl}/api/transactions/wallet/${walletAddress}?limit=50&sortBy=scannedAt&sortOrder=desc`
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

  const getBlockExplorerUrl = (txHash: string, chainId: number) => {
    const baseUrls = {
      421614: 'https://sepolia.arbiscan.io', // Arbitrum Sepolia
      42161: 'https://arbiscan.io', // Arbitrum One
    }

    const baseUrl = baseUrls[chainId as keyof typeof baseUrls] || 'https://sepolia.arbiscan.io'
    return `${baseUrl}/tx/${txHash}`
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.merchantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.upiId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'success' && item.isSuccess) ||
      (filterStatus === 'failed' && !item.isSuccess)
    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const getStatusIcon = (isSuccess: boolean, payoutStatus?: string) => {
    if (isSuccess) {
      if (payoutStatus === 'SUCCESS') return <CheckCircle className="w-4 h-4 text-emerald-500" />
      if (payoutStatus === 'PENDING') return <Clock className="w-4 h-4 text-yellow-500" />
      return <CheckCircle className="w-4 h-4 text-emerald-500" />
    }
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const getStatusColor = (isSuccess: boolean, payoutStatus?: string) => {
    if (isSuccess) {
      if (payoutStatus === 'SUCCESS') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      if (payoutStatus === 'PENDING') return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    return 'bg-red-50 text-red-700 border-red-200'
  }

  const totalUsdSpent = items.reduce((sum, item) => sum + Number(item.totalUsdToPay), 0)
  const totalInrSpent = items.reduce((sum, item) => sum + Number(item.inrAmount), 0)
  const successRate = items.length > 0 ? (items.filter(item => item.isSuccess).length / items.length) * 100 : 0

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-1 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-7xl h-[98vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-3 sm:px-6 py-2 sm:py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <h3 className="text-white font-bold text-base sm:text-lg truncate">Transaction History</h3>

                </div>
                <p className="text-white/80 text-xs sm:text-sm truncate">
                  {total} transactions • {successRate.toFixed(1)}% success rate
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ml-2"
            >
              <XCircle className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-3 sm:px-6 py-2 sm:py-4 bg-slate-50 border-b flex-shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 border border-slate-200">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <IndianRupee className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                <span className="text-xs font-medium text-slate-600">Total INR</span>
              </div>
              <div className="text-xs sm:text-lg font-bold text-slate-900 truncate">₹{totalInrSpent.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 border border-slate-200">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs font-medium text-slate-600">Total USDC</span>
              </div>
              <div className="text-xs sm:text-lg font-bold text-slate-900">{totalUsdSpent.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 border border-slate-200">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                <span className="text-xs font-medium text-slate-600">Success Rate</span>
              </div>
              <div className="text-xs sm:text-lg font-bold text-slate-900">{successRate.toFixed(1)}%</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 border border-slate-200">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                <span className="text-xs font-medium text-slate-600">Wallet</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="text-xs font-mono text-slate-900 truncate flex-1">
                  {showWallet ? walletAddress : `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`}
                </div>
                <button
                  onClick={() => setShowWallet(!showWallet)}
                  className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                >
                  {showWallet ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-3 sm:px-6 py-2 sm:py-4 border-b bg-white flex-shrink-0">
          <div className="flex flex-col gap-2 sm:gap-4">
            {/* Search and Filters Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-900" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === 'all'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('success')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === 'success'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  Success
                </button>
                <button
                  onClick={() => setFilterStatus('failed')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === 'failed'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  Failed
                </button>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                {filteredItems.length} of {total} transactions
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  title="Grid View"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
                <span className="text-slate-600">Loading transactions...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-600 font-medium">Failed to load transactions</p>
                <p className="text-slate-500 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && filteredItems.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No transactions found</p>
                <p className="text-slate-500 text-sm mt-1">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Your transaction history will appear here'
                  }
                </p>
              </div>
            </div>
          )}

          {!isLoading && !error && filteredItems.length > 0 && (
            <div className="transition-all duration-300 ease-in-out">

              {/* Content Container */}
              <div className={`transition-all duration-300 ease-in-out ${viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'
                : 'space-y-2 sm:space-y-3'
                }`}>
                {filteredItems.map((tx) => {
                  const date = new Date(tx.scannedAt)
                  const isRecent = new Date().getTime() - date.getTime() < 1 * 60 * 60 * 1000

                  return viewMode === 'grid' ? (
                    // Grid View
                    <div key={tx.transactionId} className="bg-white border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getStatusIcon(tx.isSuccess, tx.payoutStatus)}
                          <span className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                            {tx.merchantName || 'Merchant'}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 ${getStatusColor(tx.isSuccess, tx.payoutStatus)}`}>
                          {tx.isSuccess ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </div>

                      <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Amount</span>
                          <span className="text-sm sm:text-base font-semibold text-slate-900">₹{Number(tx.inrAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">USDC</span>
                          <span className="text-xs sm:text-sm text-slate-600">{Number(tx.totalUsdToPay).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Date</span>
                          <span className="text-xs text-slate-600">{formatDate(tx.scannedAt)}</span>
                        </div>
                      </div>

                      {tx.txnHash && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <a
                            href={getBlockExplorerUrl(tx.txnHash, tx.chainId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 group"
                          >
                            <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors">
                              <code className="text-xs truncate flex-1 text-slate-900">
                                {tx.txnHash.slice(0, 6)}...{tx.txnHash.slice(-4)}
                              </code>
                              <ExternalLink className="w-3 h-3 text-slate-900 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                            </div>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    // List View
                    <div key={tx.transactionId} className="bg-white border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-sm transition-shadow">
                      {/* Mobile Layout */}
                      <div className="block sm:hidden">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getStatusIcon(tx.isSuccess, tx.payoutStatus)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-slate-900 truncate">
                                  {tx.merchantName || 'Merchant'}
                                </span>
                                {isRecent && (
                                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex-shrink-0">
                                    Recent
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 truncate">{tx.upiId}</div>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 ${getStatusColor(tx.isSuccess, tx.payoutStatus)}`}>
                            {tx.isSuccess ? 'SUCCESS' : 'FAILED'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">₹{Number(tx.inrAmount).toLocaleString()}</div>
                            <div className="text-xs text-slate-500">{Number(tx.totalUsdToPay).toFixed(2)} USDC</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500">{formatDate(tx.scannedAt)}</div>
                          </div>
                        </div>

                        {tx.txnHash && (
                          <div className="pt-2 border-t border-slate-100">
                            <a
                              href={getBlockExplorerUrl(tx.txnHash, tx.chainId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block"
                            >
                              <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors">
                                <code className="text-xs text-slate-900 flex-1 truncate">
                                  {tx.txnHash.slice(0, 8)}...{tx.txnHash.slice(-6)}
                                </code>
                                <ExternalLink className="w-3 h-3 text-slate-900 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                              </div>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:block">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              {getStatusIcon(tx.isSuccess, tx.payoutStatus)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-slate-900 truncate">
                                  {tx.merchantName || 'Merchant'}
                                </span>
                                {isRecent && (
                                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                    Recent
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 truncate">{tx.upiId}</div>
                            </div>

                            <div className="flex items-center gap-4 text-right">
                              <div>
                                <div className="font-semibold text-slate-900">₹{Number(tx.inrAmount).toLocaleString()}</div>
                                <div className="text-xs text-slate-500">{Number(tx.totalUsdToPay).toFixed(2)} USDC</div>
                              </div>

                              <div className="text-right">
                                <div className="text-xs text-slate-500 mb-1">{formatDate(tx.scannedAt)}</div>
                                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(tx.isSuccess, tx.payoutStatus)}`}>
                                  {tx.isSuccess ? 'SUCCESS' : 'FAILED'}
                                </span>
                              </div>

                              {tx.txnHash && (
                                <div className="flex items-center gap-2">
                                  <a
                                    href={getBlockExplorerUrl(tx.txnHash, tx.chainId)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group"
                                  >
                                    <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors">
                                      <code className="text-xs text-slate-900">
                                        {tx.txnHash.slice(0, 8)}...{tx.txnHash.slice(-6)}
                                      </code>
                                      <ExternalLink className="w-3 h-3 text-slate-900 group-hover:text-slate-600 transition-colors" />
                                    </div>
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 sm:px-6 py-2 sm:py-4 bg-slate-50 border-t flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-slate-600">
            <span className="text-xs sm:text-sm">Showing {filteredItems.length} of {total} transactions</span>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


