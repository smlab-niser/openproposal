'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getApiUrl } from '@/lib/utils'
import { 
  ArrowLeftIcon,
  CalendarIcon,
  PencilIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface FundingCall {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'CLOSED' | 'DRAFT' | 'UPCOMING'
  openDate: string | null
  closeDate: string | null
  intentDeadline: string | null
  fullProposalDeadline: string | null
  reviewDeadline: string | null
  reviewVisibility: string
  totalBudget: number | null
  currency: string
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

interface EditDeadlineModalProps {
  call: FundingCall | null
  isOpen: boolean
  onClose: () => void
  onSave: (callId: string, deadlines: any) => void
}

function EditDeadlineModal({ call, isOpen, onClose, onSave }: EditDeadlineModalProps) {
  const [deadlines, setDeadlines] = useState({
    openDate: '',
    closeDate: '',
    intentDeadline: '',
    fullProposalDeadline: '',
    reviewDeadline: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (call) {
      setDeadlines({
        openDate: call.openDate ? new Date(call.openDate).toISOString().split('T')[0] : '',
        closeDate: call.closeDate ? new Date(call.closeDate).toISOString().split('T')[0] : '',
        intentDeadline: call.intentDeadline ? new Date(call.intentDeadline).toISOString().split('T')[0] : '',
        fullProposalDeadline: call.fullProposalDeadline ? new Date(call.fullProposalDeadline).toISOString().split('T')[0] : '',
        reviewDeadline: call.reviewDeadline ? new Date(call.reviewDeadline).toISOString().split('T')[0] : ''
      })
    }
  }, [call])

  const handleSave = async () => {
    if (!call) return
    setSaving(true)
    try {
      await onSave(call.id, deadlines)
      onClose()
    } catch (error) {
      console.error('Error saving deadlines:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !call) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Edit Deadlines: {call.title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Open Date
            </label>
            <input
              type="date"
              value={deadlines.openDate}
              onChange={(e) => setDeadlines(prev => ({ ...prev, openDate: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Close Date
            </label>
            <input
              type="date"
              value={deadlines.closeDate}
              onChange={(e) => setDeadlines(prev => ({ ...prev, closeDate: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Intent Deadline
            </label>
            <input
              type="date"
              value={deadlines.intentDeadline}
              onChange={(e) => setDeadlines(prev => ({ ...prev, intentDeadline: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Proposal Deadline
            </label>
            <input
              type="date"
              value={deadlines.fullProposalDeadline}
              onChange={(e) => setDeadlines(prev => ({ ...prev, fullProposalDeadline: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Deadline <span className="text-sm text-gray-500">(New)</span>
            </label>
            <input
              type="date"
              value={deadlines.reviewDeadline}
              onChange={(e) => setDeadlines(prev => ({ ...prev, reviewDeadline: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Deadline for reviewers to submit their reviews
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCallsPage() {
  const [calls, setCalls] = useState<FundingCall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedCall, setSelectedCall] = useState<FundingCall | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    fetchCalls()
  }, [])

  const fetchCalls = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth-token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(getApiUrl('/api/calls'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setCalls(data)
      } else {
        setError('Failed to fetch funding calls')
      }
    } catch (err) {
      setError('Error loading funding calls')
    } finally {
      setLoading(false)
    }
  }

  const handleEditDeadlines = (call: FundingCall) => {
    setSelectedCall(call)
    setEditModalOpen(true)
  }

  const handleSaveDeadlines = async (callId: string, deadlines: any) => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        router.push('/login')
        return
      }

      const payload = {
        openDate: deadlines.openDate || null,
        closeDate: deadlines.closeDate || null,
        intentDeadline: deadlines.intentDeadline || null,
        fullProposalDeadline: deadlines.fullProposalDeadline || null,
        reviewDeadline: deadlines.reviewDeadline || null
      }

      const response = await fetch(getApiUrl(`/api/admin/calls/${callId}/deadlines`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        // Refresh the calls list
        fetchCalls()
      } else {
        throw new Error('Failed to update deadlines')
      }
    } catch (error) {
      console.error('Error updating deadlines:', error)
      throw error
    }
  }

  const handleReviewControl = async (call: FundingCall) => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        router.push('/login')
        return
      }

      const action = call.reviewVisibility === 'PRIVATE' ? 'release' : 'hide'
      const confirmMessage = action === 'release' 
        ? 'Are you sure you want to release reviews to authors for this funding call?' 
        : 'Are you sure you want to hide reviews from authors for this funding call?'

      if (!confirm(confirmMessage)) {
        return
      }

      const response = await fetch(getApiUrl(`/api/admin/calls/${call.id}/reviews`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        // Refresh the calls list
        fetchCalls()
        alert(`Reviews ${action === 'release' ? 'released' : 'hidden'} successfully`)
      } else {
        throw new Error(`Failed to ${action} reviews`)
      }
    } catch (error) {
      console.error('Error controlling review visibility:', error)
      alert('Error updating review visibility')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-red-100 text-red-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      case 'UPCOMING': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredCalls = calls.filter(call => {
    const matchesSearch = call.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.fundingProgram.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/admin"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Funding Calls Management</h1>
              <p className="mt-2 text-gray-600">
                Manage funding call deadlines and settings
              </p>
            </div>
            <div>
              <Link
                href="/admin/calls/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <DocumentTextIcon className="mr-2 h-4 w-4" />
                Create New Call
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Calls
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or program..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="all">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
                <option value="DRAFT">Draft</option>
                <option value="UPCOMING">Upcoming</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calls List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Funding Calls ({filteredCalls.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredCalls.map((call) => (
              <div key={call.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {call.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                        {call.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {call.fundingProgram.agency.name} - {call.fundingProgram.name}
                    </p>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Proposals: </span>
                        <span className="text-gray-600">{call._count.proposals}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Open: </span>
                        <span className="text-gray-600">{formatDate(call.openDate)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Close: </span>
                        <span className="text-gray-600">{formatDate(call.closeDate)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Review Deadline: </span>
                        <span className={call.reviewDeadline ? "text-gray-600" : "text-red-500"}>
                          {formatDate(call.reviewDeadline)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/calls/${call.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Link>
                    <button
                      onClick={() => handleEditDeadlines(call)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit Deadlines
                    </button>
                    <button
                      onClick={() => handleReviewControl(call)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      Review Control
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredCalls.length === 0 && !loading && (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No funding calls found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'There are no funding calls in the system yet.'
              }
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <EditDeadlineModal
        call={selectedCall}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveDeadlines}
      />
    </div>
  )
}
