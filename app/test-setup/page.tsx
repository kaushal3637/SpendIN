'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { UserPlus, QrCode, Trash2, RefreshCw, CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email?: string
  contact?: string
}

interface QrCode {
  id: string
  name: string
  amount: number | null
  image_url: string
  status: string
  customer_id: string
  upi_uri?: string
  test_upi_id?: string
  is_mock?: boolean
}

interface TestSetupStatus {
  customers: number
  qrCodes: number
  setupComplete: boolean
  customerList: Customer[]
  qrCodeList: QrCode[]
  note?: string
}

export default function TestSetupPage() {
  const [status, setStatus] = useState<TestSetupStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    contact: ''
  })
  const [qrForm, setQrForm] = useState({
    customerId: '',
    amount: '',
    name: ''
  })

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/razorpay/test-setup')
      const data = await response.json()
      if (data.success) {
        setStatus(data)
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to fetch test setup status')
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleCreateCustomers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/razorpay/test-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_customers' })
      })
      const data = await response.json()
      if (data.success) {
        setSuccess(`Created ${data.customers.length} test customers`)
        fetchStatus()
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to create test customers')
    }
    setLoading(false)
  }

  const handleCreateQrCodes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/razorpay/test-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_qr_codes' })
      })
      const data = await response.json()
      if (data.success) {
        setSuccess(`Created ${data.qrCodes.length} QR codes`)
        fetchStatus()
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to create QR codes')
    }
    setLoading(false)
  }

  const handleCompleteSetup = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/razorpay/test-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup_complete' })
      })
      const data = await response.json()
      if (data.success) {
        setSuccess('Complete test setup finished!')
        fetchStatus()
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to complete setup')
    }
    setLoading(false)
  }

  const handleCreateSingleCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/razorpay/test-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      })
      const data = await response.json()
      if (data.success) {
        setSuccess('Test customer created successfully')
        setCustomerForm({ name: '', email: '', contact: '' })
        fetchStatus()
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to create customer')
    }
    setLoading(false)
  }

  const handleCreateQrCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/razorpay/test-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...qrForm,
          amount: parseFloat(qrForm.amount)
        })
      })
      const data = await response.json()
      if (data.success) {
        setSuccess('QR code created successfully')
        setQrForm({ customerId: '', amount: '', name: '' })
        fetchStatus()
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to create QR code')
    }
    setLoading(false)
  }

  const handleCleanup = async () => {
    if (!confirm('Are you sure you want to cleanup all test data? This will close all test QR codes.')) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/razorpay/test-setup', {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        setSuccess('Test data cleanup completed')
        fetchStatus()
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to cleanup test data')
    }
    setLoading(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Razorpay Test Setup
          </h1>
          <p className="text-gray-600">
            Create test customers and QR codes to test payout functionality
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {status?.note && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">Note</span>
            </div>
            <p className="text-blue-700">{status.note}</p>
          </div>
        )}

        {/* Current Status */}
        {status && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Current Status</h2>
              <button
                onClick={fetchStatus}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{status.customers}</div>
                <div className="text-blue-800">Test Customers</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{status.qrCodes}</div>
                <div className="text-green-800">QR Codes</div>
              </div>
              <div className={`p-4 rounded-lg ${status.setupComplete ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <div className={`text-2xl font-bold ${status.setupComplete ? 'text-green-600' : 'text-yellow-600'}`}>
                  {status.setupComplete ? '✓' : '⚠'}
                </div>
                <div className={status.setupComplete ? 'text-green-800' : 'text-yellow-800'}>
                  Setup {status.setupComplete ? 'Complete' : 'Incomplete'}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCreateCustomers}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                Create Test Customers
              </button>
              <button
                onClick={handleCreateQrCodes}
                disabled={loading || status.customers === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <QrCode className="w-4 h-4" />
                Create QR Codes
              </button>
              <button
                onClick={handleCompleteSetup}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Complete Setup
              </button>
              <button
                onClick={handleCleanup}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Cleanup Test Data
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Single Customer */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Test Customer</h3>
            <form onSubmit={handleCreateSingleCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <input
                  type="tel"
                  value={customerForm.contact}
                  onChange={(e) => setCustomerForm({ ...customerForm, contact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                Create Customer
              </button>
            </form>
          </div>

          {/* Create QR Code */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create QR Code</h3>
            <form onSubmit={handleCreateQrCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                <select
                  value={qrForm.customerId}
                  onChange={(e) => setQrForm({ ...qrForm, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Select a customer</option>
                  {status?.customerList?.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  value={qrForm.amount}
                  onChange={(e) => setQrForm({ ...qrForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">QR Code Name</label>
                <input
                  type="text"
                  value={qrForm.name}
                  onChange={(e) => setQrForm({ ...qrForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Optional custom name"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !qrForm.customerId}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <QrCode className="w-4 h-4" />
                Create QR Code
              </button>
            </form>
          </div>
        </div>

        {/* Test Customers List */}
        {status?.customerList && status.customerList.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Customers</h3>
            <div className="space-y-3">
              {status.customerList.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-600">
                      {customer.email} • {customer.contact}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(customer.id)}
                    className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy ID
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR Codes List */}
        {status?.qrCodeList && status.qrCodeList.length > 0 ? (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test QR Codes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {status.qrCodeList.map((qr) => (
                <div key={qr.id} className="border border-gray-200 rounded-lg p-4">
                  {qr.is_mock ? (
                    // Mock QR Code Display
                    <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg mb-3 flex flex-col items-center justify-center border-2 border-dashed border-blue-300">
                      <QrCode className="w-12 h-12 text-blue-500 mb-2" />
                      <div className="text-center">
                        <div className="text-xs font-medium text-blue-700">Mock QR Code</div>
                        <div className="text-xs text-blue-600 mt-1">For Testing</div>
                      </div>
                    </div>
                  ) : (
                    // Real QR Code Display
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      <Image
                        src={qr.image_url}
                        alt={qr.name}
                        width={200}
                        height={200}
                        className="max-w-full max-h-full rounded object-contain"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="font-medium text-gray-900 truncate">{qr.name}</div>
                    <div className="text-sm text-gray-600">
                      Amount: ₹{qr.amount}
                    </div>
                    <div className="text-sm text-gray-600">
                      Status: <span className={`font-medium ${qr.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                        {qr.status}
                      </span>
                      {qr.is_mock && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                          Mock
                        </span>
                      )}
                    </div>

                    {qr.test_upi_id && (
                      <div className="text-sm text-gray-600">
                        Test UPI: <span className="font-mono text-blue-600">{qr.test_upi_id}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {qr.upi_uri && (
                        <button
                          onClick={() => copyToClipboard(qr.upi_uri!)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
                          title="Copy UPI URI"
                        >
                          <Copy className="w-3 h-3" />
                          UPI URI
                        </button>
                      )}
                      <button
                        onClick={() => copyToClipboard(qr.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        ID
                      </button>
                      {!qr.is_mock && (
                        <button
                          onClick={() => window.open(qr.image_url, '_blank')}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </button>
                      )}
                    </div>

                    {qr.upi_uri && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600 break-all">
                        {qr.upi_uri}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : status?.qrCodeList && status.qrCodeList.length === 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Codes</h3>
            <div className="text-center py-8">
              <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">QR Codes Not Available</h4>
              <p className="text-gray-600 mb-4">
                UPI QR code creation requires special permissions on your Razorpay test account.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h5 className="font-medium text-blue-900 mb-2">How to enable QR codes:</h5>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Go to your Razorpay Dashboard</li>
                  <li>Contact Razorpay support to enable UPI features</li>
                  <li>Request activation for QR code generation</li>
                  <li>This usually takes 1-2 business days</li>
                </ol>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <p>You can still test payout functionality using the created customers!</p>
                <div className="mt-3 space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">Mock QR Code Testing:</h5>
                    <div className="text-xs text-green-800 space-y-1">
                      <p>✅ <strong>Mock QR codes ready</strong> - Use test UPI IDs below</p>
                      <p>• <strong>success@razorpay</strong> - Always succeeds (₹100)</p>
                      <p>• <strong>failure@razorpay</strong> - Always fails</p>
                      <p>• <strong>pending@razorpay</strong> - Stays pending (₹500)</p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Test Payment API:</h5>
                    <div className="text-xs text-blue-800">
                      <p>Use <code>/api/test-mock-payment</code> to simulate payments</p>
                      <p>Example: <code>POST /api/test-mock-payment</code></p>
                      <p>Body: <code>{'{ "qrId": "mock_qr_xxx", "upiId": "success@razorpay" }'}</code></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
