'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  DocumentTextIcon,
  CalendarIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/lib/utils'

// Helper functions
const getDaysUntilDue = (dueDateString: string | null) => {
  if (!dueDateString) return null
  const dueDate = new Date(dueDateString)
  const now = new Date()
  const diffTime = dueDate.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const getStatusColor = (status: string) => {
  switch (status) {
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

const getRecommendationColor = (recommendation: string) => {
  switch (recommendation) {
    case 'ACCEPT':
      return 'bg-green-100 text-green-800'
    case 'MINOR_REVISION':
      return 'bg-blue-100 text-blue-800'
    case 'MAJOR_REVISION':
      return 'bg-yellow-100 text-yellow-800'
    case 'REJECT':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatCurrency = (amount: number, currency: string) => {
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

interface ReviewAssignment {
  id: string
  overallScore: number | null
  summary: string | null
  strengths: string | null
  weaknesses: string | null
  commentsToAuthors: string | null
  commentsToCommittee: string | null
  recommendation: string | null
  isComplete: boolean
  submittedAt: string | null
  proposal: {
    id: string
    title: string
    abstract: string
    status: string
    totalBudget: number | null
    currency: string
    submittedAt: string | null
    principalInvestigator: {
      firstName: string | null
      lastName: string | null
      institutions: Array<{
        institution: {
          name: string
        }
      }>
    }
    call: {
      title: string
      closeDate: string
    } | null
  }
  assignment: {
    assignedAt: string
    dueDate: string | null
  }
  scores: Array<{
    score: number
    comments: string | null
    criteria: {
      name: string
      description: string
      weight: number
    }
  }>
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewAssignment[]>([])
  const [groupedReviews, setGroupedReviews] = useState<{[callTitle: string]: ReviewAssignment[]}>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [groupByCall, setGroupByCall] = useState(true)
  const router = useRouter()

  // Group reviews by call
  useEffect(() => {
    const grouped = reviews.reduce((acc, review) => {
      const callTitle = review.proposal.call?.title || 'Unknown Call'
      if (!acc[callTitle]) {
        acc[callTitle] = []
      }
      acc[callTitle].push(review)
      return acc
    }, {} as {[callTitle: string]: ReviewAssignment[]})
    
    setGroupedReviews(grouped)
  }, [reviews])

  const fetchReviews = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(getApiUrl('/api/reviews'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReviews(data)
      } else if (response.status === 401) {
        setError('Authentication failed. Please log in again.')
        localStorage.removeItem('auth-token')
        router.push('/login')
        return
      } else if (response.status === 403) {
        setError('Access denied. Only reviewers can access this page.')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setError(`Failed to fetch reviews: ${errorData.error || 'Server error'}`)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  // Helper function to filter reviews
  function filterReview(review: ReviewAssignment, filter: string): boolean {
    const now = new Date()
    const dueDate = review.assignment.dueDate ? new Date(review.assignment.dueDate) : null
    const isOverdue = dueDate && dueDate < now && !review.isComplete
    
    switch (filter) {
      case 'pending':
        return !review.isComplete
      case 'completed':
        return review.isComplete
      case 'overdue':
        return isOverdue || false
      default:
        return true
    }
  }

  // ReviewItem component for rendering individual reviews
  function ReviewItem({ review }: { review: ReviewAssignment }) {
    const daysUntilDue = getDaysUntilDue(review.assignment.dueDate)
    const wasSubmittedLate = review.isComplete && review.assignment.dueDate && 
      review.submittedAt && 
      new Date(review.submittedAt) > new Date(review.assignment.dueDate)
    
    const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && !review.isComplete
    const isUrgent = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue > 0 && !review.isComplete

    return (
      <li className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-medium text-gray-900 truncate mr-3">
                {review.proposal.title}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(review.proposal.status)}`}>
                {review.proposal.status.replace('_', ' ')}
              </span>
              {review.isComplete && (
                <CheckCircleIcon className="ml-2 h-5 w-5 text-green-500" />
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              PI: {review.proposal.principalInvestigator.firstName} {review.proposal.principalInvestigator.lastName}
              {review.proposal.principalInvestigator.institutions.length > 0 && (
                <span className="text-gray-500"> • {review.proposal.principalInvestigator.institutions[0].institution.name}</span>
              )}
            </p>

            <div className="flex items-center text-sm text-gray-500 space-x-6">
              {review.assignment.dueDate && (
                <div className={`flex items-center ${isOverdue ? 'text-red-600 font-medium' : isUrgent ? 'text-yellow-600 font-medium' : wasSubmittedLate ? 'text-orange-600 font-medium' : ''}`}>
                  <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  Due: {formatDate(review.assignment.dueDate)}
                  {review.isComplete ? (
                    <span className="ml-1">
                      ({wasSubmittedLate ? 'Submitted late' : 'Submitted on time'})
                    </span>
                  ) : (
                    daysUntilDue !== null && (
                      <span className="ml-1">
                        ({daysUntilDue > 0 ? `${daysUntilDue} days left` : 
                          daysUntilDue === 0 ? 'Due today' : 
                          `${Math.abs(daysUntilDue)} days overdue`})
                      </span>
                    )
                  )}
                </div>
              )}
              
              {review.proposal.totalBudget && (
                <div className="flex items-center">
                  <BanknotesIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  {formatCurrency(review.proposal.totalBudget, review.proposal.currency)}
                </div>
              )}

              {review.overallScore && (
                <div className="flex items-center">
                  <ChartBarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  Score: {review.overallScore}/10
                </div>
              )}
            </div>

            {review.recommendation && (
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRecommendationColor(review.recommendation)}`}>
                  {review.recommendation.replace('_', ' ')}
                </span>
              </div>
            )}

            {review.submittedAt && (
              <div className="mt-1 text-xs text-gray-500">
                Submitted: {formatDate(review.submittedAt)}
              </div>
            )}
          </div>

          <div className="flex space-x-3 ml-4">
            <Link 
              href={`/reviews/${review.id}`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <EyeIcon className="-ml-0.5 mr-2 h-4 w-4" />
              {review.isComplete ? 'View' : 'Review'}
            </Link>
            
            {!review.isComplete && (
              <Link
                href={`/reviews/${review.id}/edit`}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="-ml-0.5 mr-2 h-4 w-4" />
                Edit
              </Link>
            )}
          </div>
        </div>
      </li>
    )
  }

  const filteredReviews = reviews.filter(review => {
    switch (filter) {
      case 'pending':
        return !review.isComplete
      case 'completed':
        return review.isComplete
      case 'overdue':
        const daysUntilDue = getDaysUntilDue(review.assignment.dueDate)
        return !review.isComplete && daysUntilDue !== null && daysUntilDue < 0
      default:
        return true
    }
  })

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => !r.isComplete).length,
    completed: reviews.filter(r => r.isComplete).length,
    overdue: reviews.filter(r => {
      const daysUntilDue = getDaysUntilDue(r.assignment.dueDate)
      return !r.isComplete && daysUntilDue !== null && daysUntilDue < 0
    }).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          
          {error.includes('Access denied') && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Need reviewer access?</strong><br />
                Log in with a reviewer account:
              </p>
              <div className="mt-2 text-xs text-blue-600 space-y-1">
                <div>📧 alice.reviewer@stanford.edu</div>
                <div>🔑 reviewer123</div>
              </div>
            </div>
          )}
          
          {error.includes('Authentication failed') && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-800">
                Your session has expired. Please log in again.
              </p>
            </div>
          )}
          
          <div className="mt-6 space-y-3">
            <button
              onClick={() => {
                setError('')
                fetchReviews()
              }}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Try Again
            </button>
            <Link
              href="/login"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Go to Login
            </Link>
          </div>
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
              Review Assignments
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your proposal review assignments and provide feedback
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Reviews</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.completed}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Overdue</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.overdue}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <nav className="flex space-x-8">
              {[
                { key: 'all', label: 'All Reviews', count: stats.total },
                { key: 'pending', label: 'Pending', count: stats.pending },
                { key: 'completed', label: 'Completed', count: stats.completed },
                { key: 'overdue', label: 'Overdue', count: stats.overdue }
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
            
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={groupByCall}
                  onChange={(e) => setGroupByCall(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Group by Call</span>
              </label>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? 'You have no review assignments yet.' 
                : `No reviews match the ${filter} filter.`}
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {groupByCall ? (
                // Grouped by call view
                Object.entries(groupedReviews).map(([callTitle, reviews]) => (
                <li key={callTitle} className="py-4">
                  <div className="px-4 sm:px-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                      {callTitle}
                    </h2>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {reviews.map((review) => {
                        const daysUntilDue = getDaysUntilDue(review.assignment.dueDate)
                        // Check if review was submitted after deadline
                        const wasSubmittedLate = review.isComplete && review.assignment.dueDate && 
                          review.submittedAt && 
                          new Date(review.submittedAt) > new Date(review.assignment.dueDate)
                        
                        const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && !review.isComplete
                        const isUrgent = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue > 0 && !review.isComplete
                        
                        return (
                          <div key={review.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center mb-2">
                                  <h3 className="text-md font-medium text-gray-900 truncate mr-3">
                                    {review.proposal.title}
                                  </h3>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(review.proposal.status)}`}>
                                    {review.proposal.status.replace('_', ' ')}
                                  </span>
                                  {review.isComplete && (
                                    <CheckCircleIcon className="ml-2 h-5 w-5 text-green-500" />
                                  )}
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-2">
                                  PI: {review.proposal.principalInvestigator.firstName} {review.proposal.principalInvestigator.lastName}
                                  {review.proposal.principalInvestigator.institutions.length > 0 && (
                                    <span className="text-gray-500"> • {review.proposal.principalInvestigator.institutions[0].institution.name}</span>
                                  )}
                                </p>

                                <div className="flex items-center text-sm text-gray-500 space-x-6">
                                  {review.assignment.dueDate && (
                                    <div className={`flex items-center ${isOverdue ? 'text-red-600 font-medium' : isUrgent ? 'text-yellow-600 font-medium' : wasSubmittedLate ? 'text-orange-600 font-medium' : ''}`}>
                                      <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                      Due: {formatDate(review.assignment.dueDate)}
                                      {review.isComplete ? (
                                        <span className="ml-1">
                                          ({wasSubmittedLate ? 'Submitted late' : 'Submitted on time'})
                                        </span>
                                      ) : (
                                        daysUntilDue !== null && (
                                          <span className="ml-1">
                                            ({daysUntilDue > 0 ? `${daysUntilDue} days left` : 
                                              daysUntilDue === 0 ? 'Due today' : 
                                              `${Math.abs(daysUntilDue)} days overdue`})
                                          </span>
                                        )
                                      )}
                                    </div>
                                  )}
                                  
                                  {review.proposal.totalBudget && (
                                    <div className="flex items-center">
                                      <BanknotesIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                      {formatCurrency(review.proposal.totalBudget, review.proposal.currency)}
                                    </div>
                                  )}

                                  {review.overallScore && (
                                    <div className="flex items-center">
                                      <ChartBarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                      Score: {review.overallScore}/10
                                    </div>
                                  )}

                                  {review.proposal.call && (
                                    <div className="text-gray-500">
                                      Call: {review.proposal.call.title}
                                    </div>
                                  )}
                                </div>

                                {review.recommendation && (
                                  <div className="mt-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRecommendationColor(review.recommendation)}`}>
                                      Recommendation: {review.recommendation.replace('_', ' ')}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-2">
                                <Link
                                  href={`/proposals/${review.proposal.id}`}
                                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  View Proposal
                                </Link>
                                
                                {!review.isComplete && !isOverdue ? (
                                  <Link
                                    href={`/reviews/${review.id}/edit`}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  >
                                    <PencilIcon className="h-4 w-4 mr-1" />
                                    Write Review
                                  </Link>
                                ) : review.isComplete ? (
                                  <Link
                                    href={`/reviews/${review.id}`}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  >
                                    <EyeIcon className="h-4 w-4 mr-1" />
                                    View Review
                                  </Link>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    Deadline Passed
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-2 text-xs text-gray-500">
                              Assigned: {formatDate(review.assignment.assignedAt)}
                              {review.submittedAt && (
                                <span className="ml-4">
                                  Submitted: {formatDate(review.submittedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </li>
              ))
              ) : (
                // Flat list view (ungrouped)
                filteredReviews.map((review) => {
                  const daysUntilDue = getDaysUntilDue(review.assignment.dueDate)
                  const wasSubmittedLate = review.isComplete && review.assignment.dueDate && 
                    review.submittedAt && 
                    new Date(review.submittedAt) > new Date(review.assignment.dueDate)
                  
                  const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && !review.isComplete
                  const isUrgent = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue > 0 && !review.isComplete
                  
                  return (
                    <li key={review.id} className="py-4">
                      <div className="px-4 sm:px-6">
                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center mb-2">
                                <h3 className="text-md font-medium text-gray-900 truncate mr-3">
                                  {review.proposal.title}
                                </h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(review.proposal.status)}`}>
                                  {review.proposal.status.replace('_', ' ')}
                                </span>
                                {review.isComplete && (
                                  <CheckCircleIcon className="ml-2 h-5 w-5 text-green-500" />
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">
                                PI: {review.proposal.principalInvestigator.firstName} {review.proposal.principalInvestigator.lastName}
                                {review.proposal.principalInvestigator.institutions.length > 0 && (
                                  <span className="text-gray-500"> • {review.proposal.principalInvestigator.institutions[0].institution.name}</span>
                                )}
                              </p>

                              <div className="flex items-center text-sm text-gray-500 space-x-6">
                                {review.assignment.dueDate && (
                                  <div className={`flex items-center ${isOverdue ? 'text-red-600 font-medium' : isUrgent ? 'text-yellow-600 font-medium' : wasSubmittedLate ? 'text-orange-600 font-medium' : ''}`}>
                                    <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                    Due: {formatDate(review.assignment.dueDate)}
                                    {review.isComplete ? (
                                      <span className="ml-1">
                                        ({wasSubmittedLate ? 'Submitted late' : 'Submitted on time'})
                                      </span>
                                    ) : (
                                      daysUntilDue !== null && (
                                        <span className="ml-1">
                                          ({daysUntilDue > 0 ? `${daysUntilDue} days left` : 
                                            daysUntilDue === 0 ? 'Due today' : 
                                            `${Math.abs(daysUntilDue)} days overdue`})
                                        </span>
                                      )
                                    )}
                                  </div>
                                )}
                                
                                {review.proposal.totalBudget && (
                                  <div className="flex items-center">
                                    <BanknotesIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                    {formatCurrency(review.proposal.totalBudget, review.proposal.currency)}
                                  </div>
                                )}

                                {review.overallScore && (
                                  <div className="flex items-center">
                                    <ChartBarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                    Score: {review.overallScore}/10
                                  </div>
                                )}

                                {review.proposal.call && (
                                  <div className="text-gray-500">
                                    Call: {review.proposal.call.title}
                                  </div>
                                )}
                              </div>

                              {review.recommendation && (
                                <div className="mt-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRecommendationColor(review.recommendation)}`}>
                                    Recommendation: {review.recommendation.replace('_', ' ')}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/proposals/${review.proposal.id}`}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View Proposal
                              </Link>
                              
                              {!review.isComplete && !isOverdue ? (
                                <Link
                                  href={`/reviews/${review.id}/edit`}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  <PencilIcon className="h-4 w-4 mr-1" />
                                  Write Review
                                </Link>
                              ) : review.isComplete ? (
                                <Link
                                  href={`/reviews/${review.id}`}
                                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  View Review
                                </Link>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  Deadline Passed
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-500">
                            Assigned: {formatDate(review.assignment.assignedAt)}
                            {review.submittedAt && (
                              <span className="ml-4">
                                Submitted: {formatDate(review.submittedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
