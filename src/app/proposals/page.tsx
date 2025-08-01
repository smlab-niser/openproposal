'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon, 
  DocumentTextIcon, 
  CalendarIcon,
  BanknotesIcon,
  UsersIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { formatDate, getApiUrl } from '@/lib/utils'

interface Proposal {
  id: string
  title: string
  abstract: string
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED'
  totalBudget: number
  currency: string
  submittedAt: string | null
  updatedAt: string
  call: {
    title: string
    closeDate: string
  } | null
  collaborators: Array<{
    user: {
      name: string
      email: string
    }
  }>
  _count: {
    reviews: number
    budgetItems: number
  }
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const router = useRouter()

  const fetchProposals = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(getApiUrl('/api/proposals'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProposals(data)
      } else {
        setError('Failed to fetch proposals')
      }
    } catch {
      setError('Error loading proposals')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800'
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredProposals = proposals.filter(proposal => {
    if (filter === 'all') return true
    return proposal.status === filter
  })

  const formatCurrency = (amount: number, currency: string) => {
    // Convert currency to INR for display
    const displayCurrency = currency === 'USD' ? 'INR' : currency
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: displayCurrency
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposals...</p>
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
              My Proposals
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your research proposals and track their progress
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              href="/proposals/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              New Proposal
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="sm:hidden">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900"
            >
              <option value="all">All Proposals</option>
              <option value="DRAFT">Drafts</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="flex space-x-8">
              {[
                { key: 'all', label: 'All Proposals', count: proposals.length },
                { key: 'DRAFT', label: 'Drafts', count: proposals.filter(p => p.status === 'DRAFT').length },
                { key: 'SUBMITTED', label: 'Submitted', count: proposals.filter(p => p.status === 'SUBMITTED').length },
                { key: 'UNDER_REVIEW', label: 'Under Review', count: proposals.filter(p => p.status === 'UNDER_REVIEW').length },
                { key: 'ACCEPTED', label: 'Accepted', count: proposals.filter(p => p.status === 'ACCEPTED').length },
                { key: 'REJECTED', label: 'Rejected', count: proposals.filter(p => p.status === 'REJECTED').length }
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
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Proposals List */}
        {filteredProposals.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new research proposal.
            </p>
            <div className="mt-6">
              <Link
                href="/proposals/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                New Proposal
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredProposals.map((proposal) => (
                <li key={proposal.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {proposal.title}
                          </h3>
                          <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                            {proposal.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {proposal.abstract}
                        </p>
                        <div className="mt-2 flex items-center text-sm text-gray-500 space-x-6">
                          {proposal.totalBudget && (
                            <div className="flex items-center">
                              <BanknotesIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              {formatCurrency(proposal.totalBudget, proposal.currency)}
                            </div>
                          )}
                          {proposal.call && (
                            <div className="flex items-center">
                              <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              Due: {formatDate(proposal.call.closeDate)}
                            </div>
                          )}
                          {proposal.collaborators.length > 0 && (
                            <div className="flex items-center">
                              <UsersIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              {proposal.collaborators.length} collaborator{proposal.collaborators.length !== 1 ? 's' : ''}
                            </div>
                          )}
                          {proposal._count.reviews > 0 && (
                            <div className="flex items-center">
                              <EyeIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              {proposal._count.reviews} review{proposal._count.reviews !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        {proposal.call && (
                          <p className="mt-1 text-sm text-gray-500">
                            Call: {proposal.call.title}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/proposals/${proposal.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </Link>
                        {proposal.status === 'DRAFT' && (
                          <Link
                            href={`/proposals/${proposal.id}/edit`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        )}
                        <Link
                          href={`/budget?proposalId=${proposal.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <BanknotesIcon className="h-4 w-4 mr-1" />
                          Budget
                        </Link>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Last updated: {formatDate(proposal.updatedAt)}
                      {proposal.submittedAt && (
                        <span className="ml-4">
                          Submitted: {formatDate(proposal.submittedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
