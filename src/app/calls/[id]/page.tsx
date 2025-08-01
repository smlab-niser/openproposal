'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  CalendarIcon,
  BanknotesIcon,
  UserGroupIcon,
  ClockIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/lib/utils'

// ProposalCard component for detailed proposal display
function ProposalCard({ proposal, status }: { proposal: any, status: 'ACCEPTED' | 'REJECTED' }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const statusConfig = {
    ACCEPTED: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-400',
      badgeColor: 'bg-green-100 text-green-800',
      iconColor: 'bg-green-500'
    },
    REJECTED: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-400', 
      badgeColor: 'bg-red-100 text-red-800',
      iconColor: 'bg-red-500'
    }
  }

  const config = statusConfig[status]
  const avgScore = proposal.reviews && proposal.reviews.length > 0 
    ? (proposal.reviews.reduce((sum: number, r: any) => sum + r.overallScore, 0) / proposal.reviews.length).toFixed(1)
    : null

  return (
    <div className={`border-l-4 ${config.borderColor} ${config.bgColor} rounded-r-lg overflow-hidden`}>
      {/* Header - Always Visible */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-lg font-semibold text-gray-900">{proposal.title}</h4>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.badgeColor}`}>
                <div className={`w-2 h-2 ${config.iconColor} rounded-full mr-1`}></div>
                {status === 'ACCEPTED' ? 'Accepted' : 'Not Selected'}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                <span>{proposal.principalInvestigator.firstName} {proposal.principalInvestigator.lastName}</span>
              </div>
              {avgScore && (
                <div className="flex items-center gap-1">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  <span>Avg. Score: {avgScore}/10</span>
                </div>
              )}
              {proposal.reviews && (
                <span className="text-gray-500">
                  {proposal.reviews.length} review{proposal.reviews.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-700 mb-3">{proposal.abstract}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUpIcon className="h-4 w-4" />
                Hide Details & Reviews
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4" />
                View Details & Reviews
              </>
            )}
          </button>
          
          <Link
            href={`/public/proposals/${proposal.id}`}
            className="flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
          >
            <EyeIcon className="h-4 w-4" />
            View Full Proposal →
          </Link>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-white">
          {/* Full Proposal Details */}
          <div className="p-6">
            <h5 className="text-md font-semibold text-gray-900 mb-4">Proposal Details</h5>
            
            <div className="space-y-4">
              <div>
                <h6 className="text-sm font-medium text-gray-700 mb-2">Description</h6>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{proposal.description}</p>
              </div>

              {proposal.methodology && (
                <div>
                  <h6 className="text-sm font-medium text-gray-700 mb-2">Methodology</h6>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{proposal.methodology}</p>
                </div>
              )}

              {proposal.expectedOutcomes && (
                <div>
                  <h6 className="text-sm font-medium text-gray-700 mb-2">Expected Outcomes</h6>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{proposal.expectedOutcomes}</p>
                </div>
              )}

              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Submitted:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(proposal.submittedAt).toLocaleDateString('en-GB')}
                  </span>
                </div>
                {proposal.totalBudget && (
                  <div>
                    <span className="font-medium text-gray-700">Budget:</span>
                    <span className="ml-2 text-gray-600">
                      ₹{proposal.totalBudget.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          {proposal.reviews && proposal.reviews.length > 0 && (
            <div className="border-t border-gray-200 p-6">
              <h5 className="text-md font-semibold text-gray-900 mb-4">
                Peer Reviews ({proposal.reviews.length})
              </h5>
              
              <div className="space-y-6">
                {proposal.reviews.map((review: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-5 w-5 text-yellow-500" />
                          <span className="font-semibold text-gray-900">{review.overallScore}/10</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          by {review.reviewer.firstName} {review.reviewer.lastName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.submittedAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {review.summary && (
                        <div>
                          <h6 className="text-sm font-medium text-gray-700 mb-1">Summary</h6>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {review.summary}
                          </p>
                        </div>
                      )}

                      {review.strengths && (
                        <div>
                          <h6 className="text-sm font-medium text-gray-700 mb-1">Strengths</h6>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {review.strengths}
                          </p>
                        </div>
                      )}

                      {review.weaknesses && (
                        <div>
                          <h6 className="text-sm font-medium text-gray-700 mb-1">Weaknesses</h6>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {review.weaknesses}
                          </p>
                        </div>
                      )}

                      {review.commentsToAuthors && (
                        <div>
                          <h6 className="text-sm font-medium text-gray-700 mb-1">Detailed Comments</h6>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded border whitespace-pre-wrap">
                            {review.commentsToAuthors}
                          </p>
                        </div>
                      )}

                      {review.recommendation && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Recommendation:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            review.recommendation.includes('ACCEPT') 
                              ? 'bg-green-100 text-green-800' 
                              : review.recommendation === 'REJECT' 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {review.recommendation.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface CallDetail {
  id: string
  title: string
  description: string
  status: string
  openDate: string | null
  closeDate: string | null
  intentDeadline: string | null
  fullProposalDeadline: string | null
  reviewDeadline: string | null
  expectedAwards: number | null
  totalBudget: number | null
  currency: string
  reviewVisibility: string
  allowResubmissions: boolean
  isPublic: boolean
  resultsPublic: boolean
  deadlineStatus: {
    submissionDeadlineOver: boolean
    reviewDeadlineOver: boolean
    resultsPublic: boolean
  }
  fundingProgram: {
    id: string
    name: string
    description: string
    agency: {
      id: string
      name: string
      website: string | null
    }
  }
  requiredDocuments: Array<{
    id: string
    name: string
    description: string | null
    isRequired: boolean
  }>
  proposals: Array<{
    id: string
    title: string
    abstract: string
    description?: string
    methodology?: string
    expectedOutcomes?: string
    timeline?: string
    status: string
    principalInvestigator: {
      firstName: string
      lastName: string
      email: string
    }
    reviews?: Array<{
      id: string
      overallScore: number
      recommendation: string
      reviewer: {
        firstName: string
        lastName: string
      }
    }>
  }>
  createdBy: {
    firstName: string
    lastName: string
    email: string
  }
}

export default function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <CallDetailClient params={params} />
}

function CallDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const [callId, setCallId] = useState<string>('')
  const [call, setCall] = useState<CallDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  // Extract the id from params
  useEffect(() => {
    params.then(({ id }) => setCallId(id))
  }, [params])

  const fetchCall = useCallback(async () => {
    if (!callId) return
    
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(getApiUrl(`/api/calls/${callId}`))
      
      if (response.ok) {
        const data = await response.json()
        setCall(data)
      } else if (response.status === 404) {
        setError('Call not found')
      } else {
        setError('Failed to fetch call details')
      }
    } catch (err) {
      setError('Error loading call details')
    } finally {
      setLoading(false)
    }
  }, [callId])

  useEffect(() => {
    if (callId) {
      fetchCall()
    }
  }, [fetchCall, callId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading call details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <Link
              href="/calls"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Calls
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!call) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Call not found</h3>
          <p className="mt-1 text-sm text-gray-500">The call you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-red-100 text-red-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/calls"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Calls
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{call.title}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {call.fundingProgram.agency.name} - {call.fundingProgram.name}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(call.status)}`}>
              {call.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
              <div className="prose max-w-none">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{call.description}</p>
              </div>
            </div>

            {/* Funding Program Details */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Funding Program</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Program Name</h3>
                  <p className="mt-1 text-sm text-gray-900">{call.fundingProgram.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Agency</h3>
                  <div className="mt-1">
                    {call.fundingProgram.agency.website ? (
                      <a 
                        href={call.fundingProgram.agency.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {call.fundingProgram.agency.name}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-900">{call.fundingProgram.agency.name}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Program Description</h3>
                  <p className="mt-1 text-sm text-gray-900">{call.fundingProgram.description}</p>
                </div>
              </div>
            </div>

            {/* Required Documents */}
            {call.requiredDocuments && call.requiredDocuments.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h2>
                <div className="space-y-3">
                  {call.requiredDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-start">
                      <div className="flex-shrink-0">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {doc.name}
                          {doc.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        {doc.description && (
                          <p className="text-sm text-gray-500">{doc.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message when proposals are not yet visible */}
            {!call.deadlineStatus?.submissionDeadlineOver && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex">
                  <ClockIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Proposals Not Yet Visible
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Submitted proposals will be visible after the submission deadline ({formatDate(call.fullProposalDeadline)}).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Proposals Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Proposals</h2>
              
              {/* Deadline Status Message */}
              {call.deadlineStatus.resultsPublic ? (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <EyeIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Results Announced
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Final decisions have been made and results are now public. All proposals are grouped by their final status below.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : call.deadlineStatus.reviewDeadlineOver ? (
                <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-5 w-5 text-orange-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-orange-800">
                        Awaiting Final Decision
                      </h3>
                      <div className="mt-2 text-sm text-orange-700">
                        <p>Reviews have been completed. Program officers are making final funding decisions.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : call.deadlineStatus.submissionDeadlineOver ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <UserGroupIcon className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Under Review
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Submission deadline has passed. Proposals are currently being reviewed.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Accepting Submissions
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>This call is currently open for new proposal submissions.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grouped Proposals */}
              <div className="space-y-6">
                {/* Show grouped results if results are public */}
                {call.deadlineStatus.resultsPublic ? (
                  <>
                    {/* Accepted Proposals */}
                    {call.proposals.filter(p => p.status === 'ACCEPTED').length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-green-700 mb-4 flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          Accepted Proposals ({call.proposals.filter(p => p.status === 'ACCEPTED').length})
                        </h3>
                        <div className="space-y-4">
                          {call.proposals.filter(p => p.status === 'ACCEPTED').map((proposal) => (
                            <ProposalCard key={proposal.id} proposal={proposal} status="ACCEPTED" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rejected Proposals */}
                    {call.proposals.filter(p => p.status === 'REJECTED').length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-red-700 mb-4 flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                          Rejected Proposals ({call.proposals.filter(p => p.status === 'REJECTED').length})
                        </h3>
                        <div className="space-y-4">
                          {call.proposals.filter(p => p.status === 'REJECTED').map((proposal) => (
                            <ProposalCard key={proposal.id} proposal={proposal} status="REJECTED" />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Show pending/under review proposals for non-public results */
                  call.proposals.filter(p => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-yellow-700 mb-4 flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        Under Review ({call.proposals.filter(p => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').length})
                      </h3>
                      <div className="space-y-3">
                        {call.proposals.filter(p => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').map((proposal) => (
                          <div key={proposal.id} className="border-l-4 border-yellow-400 pl-4 bg-yellow-50 p-3 rounded-r-md">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">{proposal.title}</h4>
                                <p className="text-sm text-gray-600">
                                  {proposal.principalInvestigator.firstName} {proposal.principalInvestigator.lastName}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{proposal.abstract}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Link
                                  href={`/proposals/${proposal.id}`}
                                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                  View →
                                </Link>
                                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                                  Under Review
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {/* Show message if no proposals */}
                {(!call.proposals || call.proposals.length === 0) && (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {call.deadlineStatus.submissionDeadlineOver 
                        ? "No proposals were submitted for this call."
                        : "Be the first to submit a proposal for this call."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Dates */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Key Dates</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Open Date</p>
                    <p className="text-sm text-gray-500">{formatDate(call.openDate)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Close Date</p>
                    <p className="text-sm text-gray-500">{formatDate(call.closeDate)}</p>
                  </div>
                </div>
                {call.intentDeadline && (
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Intent Deadline</p>
                      <p className="text-sm text-gray-500">{formatDate(call.intentDeadline)}</p>
                    </div>
                  </div>
                )}
                {call.fullProposalDeadline && (
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Full Proposal Deadline</p>
                      <p className="text-sm text-gray-500">{formatDate(call.fullProposalDeadline)}</p>
                    </div>
                  </div>
                )}
                {call.reviewDeadline && (
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Review Deadline</p>
                      <p className="text-sm text-gray-500">{formatDate(call.reviewDeadline)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Budget Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Budget Information</h2>
              <div className="space-y-4">
                {call.totalBudget && (
                  <div className="flex items-center">
                    <BanknotesIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Total Budget</p>
                      <p className="text-sm text-gray-500">
                        ₹{call.totalBudget.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                )}
                {call.expectedAwards && (
                  <div className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Expected Awards</p>
                      <p className="text-sm text-gray-500">{call.expectedAwards}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {call.status === 'OPEN' && (
                  <Link
                    href={`/proposals/new?callId=${call.id}`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Submit Proposal
                  </Link>
                )}
                <Link
                  href="/calls"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to All Calls
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
