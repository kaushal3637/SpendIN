'use client'

import { useState, useEffect, useCallback } from 'react'
import { Copy, Server, Globe, RefreshCw, Check, type LucideIcon } from 'lucide-react'

export default function ServerInfoPage() {
  const [serverInfo, setServerInfo] = useState({
    ip: '',
    hostname: '',
    userAgent: '',
    headers: {} as Record<string, string>,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [externalIp, setExternalIp] = useState<string>('')

  const fetchServerInfo = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch server information from our API
      const response = await fetch('/api/server-info')
      if (response.ok) {
        const data = await response.json()
        setServerInfo(data)
      }

      // Also try to get external IP from a public service
      await fetchExternalIp()
    } catch (error) {
      console.error('Error fetching server info:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServerInfo()
  }, [fetchServerInfo])

  const fetchExternalIp = async () => {
    try {
      const services = [
        'https://api.ipify.org?format=json',
        'https://httpbin.org/ip',
        'https://api64.ipify.org?format=json'
      ]

      for (const service of services) {
        try {
          const response = await fetch(service)
          const data = await response.json()
          setExternalIp(data.ip || data.origin || '')
          break
        } catch {
          continue
        }
      }
    } catch (error) {
      console.error('Error fetching external IP:', error)
    }
  }

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const InfoCard = ({
    title,
    value,
    fieldName,
    icon: Icon,
    canCopy = true
  }: {
    title: string
    value: string
    fieldName: string
    icon: LucideIcon
    canCopy?: boolean
  }) => (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-emerald-100 p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] hover:border-emerald-200 touch-manipulation">
      <div className="flex flex-col gap-3 mb-3 sm:mb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-lg flex-shrink-0">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base lg:text-lg leading-tight truncate">{title}</h3>
          </div>
          {canCopy && value && (
            <button
              onClick={() => copyToClipboard(value, fieldName)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 hover:text-emerald-800 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0 touch-manipulation"
            >
              {copiedField === fieldName ? (
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
              )}
              <span className="hidden sm:inline font-medium">
                {copiedField === fieldName ? 'Copied!' : 'Copy'}
              </span>
            </button>
          )}
        </div>
        <div className="font-mono text-xs sm:text-sm lg:text-base bg-slate-50 border border-slate-200 p-2.5 sm:p-3 lg:p-4 rounded-lg break-all text-slate-800 leading-relaxed min-h-[2.5rem] sm:min-h-[3rem] flex items-center">
          {value || 'Not available'}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8 relative overflow-hidden safe-area-inset">
      {/* Animated background elements - matching app theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 sm:-top-32 lg:-top-40 -right-12 sm:-right-24 lg:-right-32 w-32 h-32 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-full bg-gradient-to-r from-emerald-400/6 to-teal-400/6 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-16 sm:-bottom-32 lg:-bottom-40 -left-12 sm:-left-24 lg:-left-32 w-32 h-32 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-full bg-gradient-to-r from-teal-400/6 to-emerald-400/6 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 sm:w-72 sm:h-72 lg:w-96 lg:h-96 rounded-full bg-gradient-to-r from-emerald-400/4 to-teal-400/4 blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12 pt-2 sm:pt-4">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Server className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 leading-tight">
              Server Information
            </h1>
          </div>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-slate-600 max-w-4xl mx-auto px-2 sm:px-4 leading-relaxed">
            Server IP address for <span className="text-emerald-600 font-semibold">Cashfree authorization</span> and other integrations.
          </p>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center mb-6 sm:mb-8 lg:mb-12 px-4">
          <button
            onClick={fetchServerInfo}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:via-emerald-600 hover:to-teal-700 disabled:from-emerald-400 disabled:via-emerald-300 disabled:to-teal-400 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-sm sm:text-base lg:text-lg min-w-[140px] sm:min-w-[160px] touch-manipulation"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="whitespace-nowrap">
              {isLoading ? 'Loading...' : 'Refresh Info'}
            </span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8 sm:py-12 lg:py-16 px-4">
            <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 animate-spin text-emerald-600 mx-auto mb-4 sm:mb-6" />
            <p className="text-slate-600 text-sm sm:text-base lg:text-lg">Fetching server information...</p>
          </div>
        )}

        {/* Server Information Cards */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 px-1 sm:px-2">
            <InfoCard
              title="External IP Address"
              value={externalIp}
              fieldName="external-ip"
              icon={Globe}
            />

            <InfoCard
              title="Server IP"
              value={serverInfo.ip}
              fieldName="server-ip"
              icon={Server}
            />

            <InfoCard
              title="Hostname"
              value={serverInfo.hostname}
              fieldName="hostname"
              icon={Server}
            />

            <InfoCard
              title="User Agent"
              value={serverInfo.userAgent}
              fieldName="user-agent"
              icon={Server}
            />
          </div>
        )}

      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-gentle {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-gradient-x {
          background-size: 400% 400%;
          animation: gradient-x 3s ease infinite;
        }

        /* Mobile-specific improvements */
        @media (max-width: 640px) {
          .safe-area-inset {
            padding-top: env(safe-area-inset-top, 0px);
            padding-bottom: env(safe-area-inset-bottom, 0px);
            padding-left: env(safe-area-inset-left, 0px);
            padding-right: env(safe-area-inset-right, 0px);
          }

          /* Improve touch targets on mobile */
          button {
            min-height: 44px;
            min-width: 44px;
          }

          /* Better text selection on mobile */
          .font-mono {
            -webkit-user-select: all;
            -moz-user-select: all;
            -ms-user-select: all;
            user-select: all;
          }
        }

        /* Prevent horizontal scroll on mobile */
        @media (max-width: 768px) {
          body {
            overflow-x: hidden;
          }
        }

        /* Smooth scrolling for better mobile experience */
        * {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  )
}
