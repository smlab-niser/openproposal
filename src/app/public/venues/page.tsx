'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  CalendarIcon, 
  BuildingOfficeIcon, 
  CurrencyDollarIcon,
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/lib/utils'

interface PublicCall {
  id: string
  title: string
  description: string
  status: string
  openDate?: string
  closeDate?: string
  totalBudget?: number
  currency: string
  fundingProgram: {
    name: string
    agency: {
      name: string
      website?: string
    }
  }
  proposals: any[]
  _count: {
    proposals: number
  }
}

export default function PublicVenuesPage() {
  const [calls, setCalls] = useState<PublicCall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPublicCalls = async () => {
      try {
        const response = await fetch(getApiUrl('/api/public/calls'))
        if (response.ok) {
          const data = await response.json()
          setCalls(data)
        } else {
          setError('Failed to fetch public venues')
        }
      } catch {
        setError('Error loading public venues')
      } finally {
        setLoading(false)
      }
    }

    fetchPublicCalls()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAcceptedCount = (proposals: any[]) => {
    return proposals.filter(p => p.status === 'ACCEPTED').length
  }

  const getRejectedCount = (proposals: any[]) => {
    return proposals.filter(p => p.status === 'REJECTED').length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading public venues...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Public Venues</h1>
                <p className="mt-2 text-gray-600">
                  Browse public funding calls and their outcomes
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/admin/public-venues"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <CogIcon className="h-4 w-4 mr-2" />
                  Admin Controls
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {calls.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No public venues</h3>
            <p className="mt-1 text-sm text-gray-500">
              No funding calls have been made public yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {calls.map((call) => (
              <div
                key={call.id}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
              >
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        <Link
                          href={`/public/venues/${call.id}`}
                          className="hover:text-blue-600"
                        >
                          {call.title}
                        </Link>
                      </h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                        {call.fundingProgram.agency.website ? (
                          <a
                            href={call.fundingProgram.agency.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600"
                          >
                            {call.fundingProgram.agency.name}
                          </a>
                        ) : (
                          <span>{call.fundingProgram.agency.name}</span>
                        )}
                        <span className="mx-2">•</span>
                        <span>{call.fundingProgram.name}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {call.description}
                      </p>
                    </div>
                    <div className="ml-6 flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                        {call.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {call.totalBudget && (
                      <div className="flex items-center text-sm text-gray-500">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        <span>
                          {call.totalBudget.toLocaleString()} {call.currency}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      <span>{call._count.proposals} submissions</span>
                    </div>

                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      <span>{getAcceptedCount(call.proposals)} accepted</span>
                    </div>

                    <div className="flex items-center text-sm text-red-600">
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      <span>{getRejectedCount(call.proposals)} rejected</span>
                    </div>
                  </div>

                  {(call.closeDate || call.openDate) && (
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {call.openDate && (
                        <span>Opened: {new Date(call.openDate).toLocaleDateString()}</span>
                      )}
                      {call.openDate && call.closeDate && <span className="mx-2">•</span>}
                      {call.closeDate && (
                        <span>Closed: {new Date(call.closeDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <Link
                      href={`/public/venues/${call.id}`}
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details & Reviews
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
