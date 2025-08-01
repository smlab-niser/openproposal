'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  CalendarIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ClockIcon,
  UserGroupIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/lib/utils'

interface FundingCall {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'CLOSED' | 'UPCOMING' | 'ARCHIVED'
  openDate: string
  closeDate: string
  fullProposalDeadline: string | null
  expectedAwards: number | null
  totalBudget: number | null
  currency: string
  reviewVisibility: string
  allowResubmissions: boolean
  fundingProgram: {
    id: string
    name: string
    description: string
    agency: {
      name: string
      country: string
    }
  }
  requiredDocuments: Array<{
    name: string
    description: string
    required: boolean
  }>
  reviewCriteria: Array<{
    name: string
    description: string
    weight: number
  }>
  _count: {
    proposals: number
  }
}

export default function CallsPage() {
  const [calls, setCalls] = useState<FundingCall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<string>('OPEN')
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  const fetchCalls = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(getApiUrl('/api/calls'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCalls(Array.isArray(data) ? data : (data.calls || []))
      } else {
        setError('Failed to fetch funding calls')
      }
    } catch {
      setError('Error loading funding calls')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchCalls()
  }, [fetchCalls])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-red-100 text-red-800'
      case 'UPCOMING':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    // Convert currency to INR for display
    const displayCurrency = currency === 'USD' ? 'INR' : currency
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysUntilDeadline = (deadlineString: string) => {
    const deadline = new Date(deadlineString)
    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredCalls = (calls || []).filter(call => {
    // Include ARCHIVED calls in CLOSED filter for results announced calls
    const matchesFilter = filter === 'ALL' || 
                         call.status === filter || 
                         (filter === 'CLOSED' && call.status === 'ARCHIVED')
    const matchesSearch = call.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.fundingProgram.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading funding calls...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Funding Calls
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Browse available funding opportunities and submit proposals
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search funding calls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-gray-900"
            >
              <option value="ALL">All Calls</option>
              <option value="OPEN">Open</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'OPEN', label: 'Open', count: calls.filter(c => c.status === 'OPEN').length },
              { key: 'UPCOMING', label: 'Upcoming', count: calls.filter(c => c.status === 'UPCOMING').length },
              { key: 'CLOSED', label: 'Closed', count: calls.filter(c => c.status === 'CLOSED' || c.status === 'ARCHIVED').length },
              { key: 'ALL', label: 'All', count: calls.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`${
                  filter === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-900 rounded-full py-0.5 px-2.5 text-xs font-medium">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Calls List */}
        {filteredCalls.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No funding calls found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'No calls match the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {filteredCalls.map((call) => {
              const daysLeft = getDaysUntilDeadline(call.closeDate)
              const isUrgent = daysLeft <= 7 && daysLeft > 0
              
              return (
                <div key={call.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mr-3">
                          {call.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                          {call.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{call.fundingProgram.name}</p>
                      <p className="text-sm text-gray-500 line-clamp-2">{call.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center text-gray-500">
                      <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                      {call.fundingProgram?.name || 'Program TBD'}
                    </div>
                    {call.totalBudget && (
                      <div className="flex items-center text-gray-500">
                        <BanknotesIcon className="h-4 w-4 mr-2" />
                        {formatCurrency(call.totalBudget, call.currency)}
                      </div>
                    )}
                    <div className="flex items-center text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Due: {formatDate(call.closeDate)}
                    </div>
                    {call.expectedAwards && (
                      <div className="flex items-center text-gray-500">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        {call.expectedAwards} awards
                      </div>
                    )}
                  </div>

                  {call.status === 'OPEN' && (
                    <div className="mb-4">
                      {daysLeft > 0 ? (
                        <div className={`flex items-center text-sm ${isUrgent ? 'text-red-600' : 'text-gray-600'}`}>
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span className={isUrgent ? 'font-medium' : ''}>
                            {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-red-600 font-medium">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Deadline passed
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {call._count.proposals} proposal{call._count.proposals !== 1 ? 's' : ''} submitted
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/calls/${call.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                      {call.status === 'OPEN' && daysLeft > 0 && (
                        <Link
                          href={`/proposals/new?callId=${call.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Apply
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
