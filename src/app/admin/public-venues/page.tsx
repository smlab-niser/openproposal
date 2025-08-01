'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getApiUrl } from '@/lib/utils'
import { 
  EyeIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  LockClosedIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface CallForPublic {
  id: string
  title: string
  description: string
  status: string
  isPublic: boolean
  resultsPublic: boolean
  closeDate?: string
  fundingProgram: {
    name: string
    agency: {
      name: string
    }
  }
  _count: {
    proposals: number
  }
}

export default function AdminPublicVenuesPage() {
  const [calls, setCalls] = useState<CallForPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('auth-token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchCalls = async () => {
      try {
        const response = await fetch(getApiUrl('/api/calls'), {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          setCalls(data)
        } else if (response.status === 403) {
          setError('Access denied. Admin privileges required.')
        } else {
          setError('Failed to fetch calls')
        }
      } catch {
        setError('Error loading calls')
      } finally {
        setLoading(false)
      }
    }

    fetchCalls()
  }, [router])

  const toggleResultsVisibility = async (callId: string, currentStatus: boolean) => {
    const token = localStorage.getItem('auth-token')
    if (!token) return

    setUpdating(callId)
    try {
      const response = await fetch(getApiUrl(`/api/admin/calls/${callId}/visibility`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resultsPublic: !currentStatus })
      })

      if (response.ok) {
        const updatedCall = await response.json()
        setCalls(prev => prev.map(call => 
          call.id === callId 
            ? { ...call, resultsPublic: updatedCall.resultsPublic }
            : call
        ))
      } else {
        setError('Failed to update visibility')
      }
    } catch {
      setError('Error updating visibility')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calls...</p>
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
          <Link
            href="/admin"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            Back to Admin
          </Link>
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
                <h1 className="text-3xl font-bold text-gray-900">Manage Public Venues</h1>
                <p className="mt-2 text-gray-600">
                  Control the public visibility of funding call results
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/public/venues"
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <GlobeAltIcon className="h-4 w-4 mr-2" />
                  View Public Site
                </Link>
                <Link
                  href="/admin"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Funding Calls</h2>
            <p className="mt-1 text-sm text-gray-600">
              Toggle public visibility of proposal results and reviews
            </p>
          </div>

          {calls.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No calls found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No funding calls available.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {calls.map((call) => (
                <div key={call.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {call.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                          {call.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                        <span>{call.fundingProgram.agency.name}</span>
                        <span className="mx-2">•</span>
                        <span>{call.fundingProgram.name}</span>
                        <span className="mx-2">•</span>
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        <span>{call._count.proposals} proposals</span>
                      </div>

                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {call.description}
                      </p>

                      <div className="mt-3 flex items-center space-x-4">
                        <div className="flex items-center text-sm">
                          {call.isPublic ? (
                            <>
                              <GlobeAltIcon className="h-4 w-4 text-green-600 mr-1" />
                              <span className="text-green-600">Call is public</span>
                            </>
                          ) : (
                            <>
                              <LockClosedIcon className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-gray-500">Call is private</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center text-sm">
                          {call.resultsPublic ? (
                            <>
                              <EyeIcon className="h-4 w-4 text-blue-600 mr-1" />
                              <span className="text-blue-600">Results are public</span>
                            </>
                          ) : (
                            <>
                              <EyeSlashIcon className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-gray-500">Results are private</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ml-6 flex items-center space-x-3">
                      {call.resultsPublic && (
                        <Link
                          href={`/public/venues/${call.id}`}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                        >
                          View Public Page
                        </Link>
                      )}
                      
                      <button
                        onClick={() => toggleResultsVisibility(call.id, call.resultsPublic)}
                        disabled={updating === call.id}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${
                          call.resultsPublic
                            ? 'text-red-700 bg-red-100 hover:bg-red-200'
                            : 'text-green-700 bg-green-100 hover:bg-green-200'
                        } ${updating === call.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {updating === call.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        ) : call.resultsPublic ? (
                          <EyeSlashIcon className="h-4 w-4 mr-2" />
                        ) : (
                          <EyeIcon className="h-4 w-4 mr-2" />
                        )}
                        {call.resultsPublic ? 'Make Private' : 'Make Public'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
