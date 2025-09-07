'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { QrCode, User, Plus, Download, X } from 'lucide-react'
import { Customer, CreateCustomerRequest } from '@/types/customer.types'

export default function TestCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
              Test Accounts
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Create test customers, generate QR codes, and test automated payout functionality
            </p>
          </div>
        </div>

        {/* Create Customer Button */}
        <div className="mb-6 sm:mb-8 text-center">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            {showCreateForm ? 'Cancel Creation' : 'Create Test Customer'}
          </button>
        </div>

        {/* Create Customer Form */}
        {showCreateForm && (
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-xl p-6 sm:p-8 mb-8 border border-emerald-100">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-4">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Create New Customer</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-900 placeholder-slate-400"
                  placeholder="Enter customer's full name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-900 placeholder-slate-400"
                  placeholder="customer@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-900 placeholder-slate-400"
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="upiId" className="block text-sm font-semibold text-slate-700">
                  UPI ID <span className="text-xs text-slate-500">(leave empty for auto-generation)</span>
                </label>
                <input
                  type="text"
                  id="upiId"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-900 placeholder-slate-400"
                  placeholder="john@paytm"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label htmlFor="upiName" className="block text-sm font-semibold text-slate-700">
                  UPI Display Name <span className="text-xs text-slate-500">(optional)</span>
                </label>
                <input
                  type="text"
                  id="upiName"
                  value={formData.upiName}
                  onChange={(e) => setFormData({ ...formData, upiName: e.target.value })}
                  className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-900 placeholder-slate-400"
                  placeholder="Display name for UPI transactions"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-3 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={createCustomer}
                disabled={isLoading}
                className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Customer...
                  </div>
                ) : (
                  'Create Customer'
                )}
              </button>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {selectedCustomer && qrCodeUrl && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-100">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
                      <QrCode className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                      QR Code
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCustomer(null)
                      setQrCodeUrl('')
                    }}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <div className="text-center mb-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 mb-4">
                    <Image
                      src={qrCodeUrl}
                      alt="QR Code"
                      width={200}
                      height={200}
                      className="mx-auto rounded-lg shadow-sm"
                      unoptimized
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                        UPI ID
                      </p>
                      <p className="text-sm font-mono text-slate-800 break-all">
                        {selectedCustomer.upiId}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                        Customer ID
                      </p>
                      <p className="text-sm font-mono text-slate-800 break-all">
                        {selectedCustomer.customerId}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={downloadQRCode}
                    className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customers List */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden border border-emerald-100">
          <div className="px-6 py-8 sm:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-4">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Test Customers</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {customers.length} customer{customers.length !== 1 ? 's' : ''} registered
                  </p>
                </div>
              </div>
            </div>

            {customers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No customers yet</h3>
                <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                  Get started by creating your test customer to begin testing QR codes and payouts.
                </p>
                <div className="text-sm text-slate-500">
                  <p className="mb-1">Generate QR codes for testing</p>
                  <p className="mb-1">Test automated payouts</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {customers.map((customer) => (
                  <div
                    key={customer.customerId}
                    className="bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200"
                  >
                    {/* Header with Avatar and Basic Info */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-lg">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-bold text-slate-800 truncate">
                            {customer.name}
                          </h3>
                          <p className="text-sm text-slate-600 truncate mb-1">
                            {customer.email}
                          </p>
                          {customer.phone && (
                            <p className="text-xs text-slate-500 truncate">
                              {customer.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-row gap-2 sm:ml-4">
                        <button
                          onClick={() => generateQRCode(customer)}
                          className="inline-flex justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 transform hover:scale-105 flex-1 sm:flex-initial"
                        >
                          <QrCode className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden xs:inline sm:inline">Generate QR</span>
                          <span className="xs:hidden sm:hidden">QR</span>
                        </button>
                      </div>
                    </div>

                    {/* Detailed Information Grid */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
                      {/* UPI ID Card */}
                      <div className="bg-white rounded-lg p-3 sm:p-4 border border-slate-200">
                        <div className="flex items-center mb-2">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                            <span className="text-blue-600 text-xs font-bold">₹</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">
                            UPI ID
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-mono text-slate-800 break-all leading-tight min-h-[1rem] sm:min-h-[1.5rem]">
                          {customer.upiId}
                        </p>
                      </div>

                      {/* Status Card */}
                      <div className="bg-white rounded-lg p-3 sm:p-4 border border-slate-200">
                        <div className="flex items-center mb-2">
                          <div className={`w-3 h-3 rounded-full mr-2 flex-shrink-0 ${customer.isBeneficiaryAdded ? 'bg-green-500' : 'bg-yellow-500'
                            }`}></div>
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">
                            Customer ID:
                          </span>
                        </div>
                        <p className={`text-xs sm:text-sm font-medium leading-tight ${customer.isBeneficiaryAdded ? 'text-green-700' : 'text-yellow-700'
                          }`}>
                          {customer.customerId}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
