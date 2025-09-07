'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { QrCode, User, Plus, Copy, CheckCircle, AlertCircle, Download, DollarSign, X } from 'lucide-react'

interface Customer {
  customerId: string
  name: string
  email: string
  phone?: string
  upiId: string
  upiName: string
  isActive: boolean
  isBeneficiaryAdded: boolean
  isTestMode: boolean
  createdAt: string
  qrCodeData: string
  totalReceived?: number
  totalPaid?: number
  transactionCount?: number
}

interface CreateCustomerRequest {
  name: string
  email: string
  phone?: string
  upiId?: string
  upiName?: string
}

interface PayoutResponse {
  success: boolean
  payout: {
    transferId: string
    amount: number
    status: string
    message: string
    referenceId?: string
    utr?: string
    acknowledged?: number
    initiatedAt: string
  }
  customer: Customer
  error?: string
}

export default function TestCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [showPayoutForm, setShowPayoutForm] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState<string>('')
  const [payoutRemarks, setPayoutRemarks] = useState<string>('')
  const [isProcessingPayout, setIsProcessingPayout] = useState(false)
  const [payoutResult, setPayoutResult] = useState<PayoutResponse | null>(null)
  const [copiedText, setCopiedText] = useState<string>('')

  // Form state for creating customers
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    email: '',
    phone: '',
    upiId: '',
    upiName: ''
  })

  // Load customers on component mount
  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    setIsLoading(true)
    try {
      // In a real app, you'd have an API to list customers
      // For now, we'll just show an empty list or load from localStorage for demo
      const savedCustomers = localStorage.getItem('testCustomers')
      if (savedCustomers) {
        setCustomers(JSON.parse(savedCustomers))
      }
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createCustomer = async () => {
    if (!formData.name || !formData.email) {
      alert('Name and email are required')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/customers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isTestMode: true
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create customer')
      }

      const data = await response.json()
      const newCustomer = data.customer

      // Add to customers list
      const updatedCustomers = [...customers, newCustomer]
      setCustomers(updatedCustomers)
      localStorage.setItem('testCustomers', JSON.stringify(updatedCustomers))

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        upiId: '',
        upiName: ''
      })
      setShowCreateForm(false)

      alert(`Customer created successfully! Customer ID: ${newCustomer.customerId}`)

    } catch (error) {
      console.error('Error creating customer:', error)
      alert(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const generateQRCode = async (customer: Customer, amount?: number) => {
    setIsLoading(true)
    setSelectedCustomer(customer)

    try {
      const amountParam = amount ? `?amount=${amount}` : ''
      const response = await fetch(`/api/customers/${customer.customerId}/qrcode${amountParam}`)

      if (!response.ok) {
        throw new Error('Failed to generate QR code')
      }

      const data = await response.json()
      setQrCodeUrl(data.qrCodeDataURL)

    } catch (error) {
      console.error('Error generating QR code:', error)
      alert(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const initiatePayout = async () => {
    if (!selectedCustomer || !payoutAmount) {
      alert('Please select a customer and enter an amount')
      return
    }

    const amount = parseFloat(payoutAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setIsProcessingPayout(true)
    try {
      const response = await fetch('/api/payouts/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selectedCustomer.customerId,
          amount,
          remarks: payoutRemarks || `Test payout to ${selectedCustomer.name}`,
        }),
      })

      const data = await response.json()
      setPayoutResult(data)

      if (data.success) {
        alert(`Payout initiated successfully! Transfer ID: ${data.payout.transferId}`)
      } else {
        alert(`Payout failed: ${data.error || data.payout.message}`)
      }

    } catch (error) {
      console.error('Error initiating payout:', error)
      alert(`Failed to initiate payout: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessingPayout(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      setTimeout(() => setCopiedText(''), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl) return

    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `qr-${selectedCustomer?.customerId || 'customer'}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cashfree Payout Test Dashboard
          </h1>
          <p className="text-gray-600">
            Create test customers, generate QR codes, and test payout functionality
          </p>
        </div>

        {/* Create Customer Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Test Customer
          </button>
        </div>

        {/* Create Customer Form */}
        {showCreateForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Customer</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="+91 9876543210"
                />
              </div>
              <div>
                <label htmlFor="upiId" className="block text-sm font-medium text-gray-700">
                  UPI ID (leave empty for auto-generation)
                </label>
                <input
                  type="text"
                  id="upiId"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="john@paytm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="upiName" className="block text-sm font-medium text-gray-700">
                  UPI Display Name (optional)
                </label>
                <input
                  type="text"
                  id="upiName"
                  value={formData.upiName}
                  onChange={(e) => setFormData({ ...formData, upiName: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={createCustomer}
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Customer'}
              </button>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {selectedCustomer && qrCodeUrl && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    QR Code for {selectedCustomer.name}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedCustomer(null)
                      setQrCodeUrl('')
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="text-center mb-4">
                  <Image
                    src={qrCodeUrl}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="mx-auto mb-4"
                    unoptimized
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>UPI ID:</strong> {selectedCustomer.upiId}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Customer ID:</strong> {selectedCustomer.customerId}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={downloadQRCode}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                  <button
                    onClick={() => setShowPayoutForm(true)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Test Payout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payout Form Modal */}
        {showPayoutForm && selectedCustomer && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Test Payout to {selectedCustomer.name}
                  </h3>
                  <button
                    onClick={() => setShowPayoutForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="payoutAmount" className="block text-sm font-medium text-gray-700">
                      Amount (INR)
                    </label>
                    <input
                      type="number"
                      id="payoutAmount"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="100.00"
                      min="0.01"
                      max="25000"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label htmlFor="payoutRemarks" className="block text-sm font-medium text-gray-700">
                      Remarks (optional)
                    </label>
                    <input
                      type="text"
                      id="payoutRemarks"
                      value={payoutRemarks}
                      onChange={(e) => setPayoutRemarks(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Test payout"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPayoutForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={initiatePayout}
                    disabled={isProcessingPayout || !payoutAmount}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isProcessingPayout ? 'Processing...' : 'Initiate Payout'}
                  </button>
                </div>

                {payoutResult && (
                  <div className="mt-4 p-4 rounded-md bg-gray-50">
                    <div className="flex items-center">
                      {payoutResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${payoutResult.success ? 'text-green-800' : 'text-red-800'}`}>
                        {payoutResult.success ? 'Payout Successful' : 'Payout Failed'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {payoutResult.payout.message}
                    </p>
                    {payoutResult.payout.transferId && (
                      <p className="text-sm text-gray-600">
                        Transfer ID: {payoutResult.payout.transferId}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customers List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Test Customers</h2>

            {customers.length === 0 ? (
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No customers</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first test customer.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div key={customer.customerId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900">{customer.name}</h3>
                          <p className="text-sm text-gray-500">{customer.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => generateQRCode(customer)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          Generate QR
                        </button>
                        <button
                          onClick={() => copyToClipboard(customer.customerId, 'customerId')}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy ID
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">UPI ID:</span>
                        <span className="ml-2 font-mono">{customer.upiId}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-2 ${customer.isBeneficiaryAdded ? 'text-green-600' : 'text-yellow-600'}`}>
                          {customer.isBeneficiaryAdded ? 'Beneficiary Added' : 'Beneficiary Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Paid:</span>
                        <span className="ml-2">₹{customer.totalPaid || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Transactions:</span>
                        <span className="ml-2">{customer.transactionCount || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Copied notification */}
        {copiedText && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
            {copiedText} copied to clipboard!
          </div>
        )}
      </div>
    </div>
  )
}
