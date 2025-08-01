'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Comments from '@/components/Comments'
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CalendarIcon,
  UsersIcon,
  PencilIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/lib/utils'

interface Proposal {
  id: string
  title: string
  abstract: string
  description: string
  methodology: string | null
  expectedOutcomes: string | null
  ethicsStatement: string | null
  status: string
  totalBudget: number | null
  currency: string
  submittedAt: string | null
  createdAt: string
  updatedAt: string
  principalInvestigator: {
    id: string
    name: string
    firstName: string | null
    lastName: string | null
    email: string
    institutions: Array<{
      institution: {
        name: string
        country: string
      }
    }>
  }
  institution: {
    name: string
    country: string
    website: string | null
  }
  call: {
    id: string
    title: string
    description: string
    status: string
    openDate: string
    closeDate: string
    totalBudget: number | null
    currency: string
    fundingProgram: {
      name: string
      description: string
    }
  } | null
  collaborators: Array<{
    role: string
    permissions: string[]
    user: {
      id: string
      name: string
      firstName: string | null
      lastName: string | null
      email: string
      institutions: Array<{
        institution: {
          name: string
        }
      }>
    }
  }>
  budgetItems: Array<{
    id: string
    category: string
    description: string
    amount: number
    year: number | null
  }>
  documents: Array<{
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    uploadedAt: string
  }>
  reviews: Array<{
    id: string
    status: string
    overallScore: number | null
    commentsToAuthors: string | null
    strengths: string | null
    weaknesses: string | null
    recommendation: string | null
    isComplete: boolean
    submittedAt: string | null
    reviewer: {
      id: string
      name: string
      firstName: string | null
      lastName: string | null
    }
  }>
  comments: Array<{
    id: string
    content: string
    createdAt: string
    author: {
      id: string
      name: string
      firstName: string | null
      lastName: string | null
    }
  }>
}

export default function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ProposalDetailClient params={params} />
}

function ProposalDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const [proposalId, setProposalId] = useState<string>('')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  // Extract the id from params
  useEffect(() => {
    params.then(({ id }) => setProposalId(id))
  }, [params])

  const fetchProposal = useCallback(async () => {
    if (!proposalId) return
    
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(getApiUrl(`/api/proposals/${proposalId}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProposal(data)
      } else if (response.status === 404) {
        setError('Proposal not found')
      } else if (response.status === 403) {
        setError('Access denied')
      } else {
        setError('Failed to fetch proposal')
      }
    } catch {
      setError('Error loading proposal')
    } finally {
      setLoading(false)
    }
  }, [proposalId, router])

  useEffect(() => {
    if (proposalId) {
      fetchProposal()
    }
  }, [fetchProposal, proposalId])

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

  const formatCurrency = (amount: number, currency: string) => {
    // Convert currency to INR for display
    const displayCurrency = currency === 'USD' ? 'INR' : currency
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: displayCurrency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Byte'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposal...</p>
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
              href="/proposals"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
              Back to Proposals
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!proposal) {
    return null
  }

  const totalBudget = proposal.budgetItems.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/proposals"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Proposals
            </Link>
          </div>
          
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl sm:truncate">
                  {proposal.title}
                </h1>
                <span className={`ml-3 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
                  {proposal.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <UsersIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  PI: {proposal.principalInvestigator.firstName} {proposal.principalInvestigator.lastName}
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <BuildingOfficeIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  {proposal.institution.name}
                </div>
                {proposal.totalBudget && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <BanknotesIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    {formatCurrency(proposal.totalBudget, proposal.currency)}
                  </div>
                )}
                {proposal.call && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    Due: {formatDate(proposal.call.closeDate)}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              {proposal.status === 'DRAFT' && (
                <Link
                  href={`/proposals/${proposal.id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PencilIcon className="-ml-1 mr-2 h-5 w-5" />
                  Edit
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: EyeIcon },
              { key: 'budget', label: 'Budget', icon: BanknotesIcon },
              { key: 'collaborators', label: 'Collaborators', icon: UsersIcon },
              { key: 'documents', label: 'Documents', icon: PaperClipIcon },
              { key: 'comments', label: 'Comments', icon: ChatBubbleLeftIcon },
              { key: 'reviews', label: 'Reviews', icon: ChatBubbleLeftIcon }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`${
                    activeTab === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Abstract */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Abstract</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{proposal.abstract}</p>
                </div>

                {/* Project Description */}
                {proposal.description && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Project Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{proposal.description}</p>
                  </div>
                )}

                {/* Methodology */}
                {proposal.methodology && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Methodology</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{proposal.methodology}</p>
                  </div>
                )}

                {/* Expected Outcomes */}
                {proposal.expectedOutcomes && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Expected Outcomes</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{proposal.expectedOutcomes}</p>
                  </div>
                )}

                {/* Ethics Statement */}
                {proposal.ethicsStatement && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Ethics Statement</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{proposal.ethicsStatement}</p>
                  </div>
                )}

                {/* Reviews Section - Visible to PI and Program Officers */}
                {proposal.reviews && proposal.reviews.filter(review => review.isComplete).length > 0 && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Reviews ({proposal.reviews.filter(review => review.isComplete).length} completed)
                    </h3>
                    <div className="space-y-6">
                      {proposal.reviews.filter(review => review.isComplete).map((review, index) => (
                        <div key={review.id} className="border-l-4 border-blue-200 pl-4 pb-4 border-b border-gray-200 last:border-b-0">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-md font-medium text-gray-900">Review #{index + 1}</h4>
                            <div className="flex items-center space-x-2">
                              {review.overallScore && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Score: {review.overallScore}/10
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {review.submittedAt ? formatDate(review.submittedAt) : 'Not submitted'}
                              </span>
                            </div>
                          </div>
                          
                          {review.commentsToAuthors && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Comments to Authors</h5>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded">{review.commentsToAuthors}</p>
                            </div>
                          )}

                          {review.strengths && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-green-700 mb-2">Strengths</h5>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-green-50 p-3 rounded">{review.strengths}</p>
                            </div>
                          )}

                          {review.weaknesses && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-red-700 mb-2">Areas for Improvement</h5>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-red-50 p-3 rounded">{review.weaknesses}</p>
                            </div>
                          )}

                          {review.recommendation && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Recommendation</h5>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-yellow-50 p-3 rounded">{review.recommendation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Call Information */}
                {proposal.call && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Funding Call</h3>
                    <div className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Call Title</dt>
                        <dd className="text-sm text-gray-900">{proposal.call.title}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Program</dt>
                        <dd className="text-sm text-gray-900">{proposal.call.fundingProgram.name}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="text-sm text-gray-900 capitalize">{proposal.call.status.toLowerCase()}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Close Date</dt>
                        <dd className="text-sm text-gray-900">{formatDate(proposal.call.closeDate)}</dd>
                      </div>
                      {proposal.call.totalBudget && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Total Available</dt>
                          <dd className="text-sm text-gray-900">
                            {formatCurrency(proposal.call.totalBudget, proposal.call.currency)}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
                  <div className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="text-sm text-gray-900">{formatDate(proposal.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="text-sm text-gray-900">{formatDate(proposal.updatedAt)}</dd>
                    </div>
                    {proposal.submittedAt && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                        <dd className="text-sm text-gray-900">{formatDate(proposal.submittedAt)}</dd>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Budget Breakdown</h3>
                  {totalBudget > 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      Total: {formatCurrency(totalBudget, proposal.currency)}
                    </p>
                  )}
                </div>
                <Link 
                  href={`/budget?proposalId=${proposal.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <BanknotesIcon className="h-4 w-4 mr-2" />
                  Manage Budget
                </Link>
              </div>
              {proposal.budgetItems.length === 0 ? (
                <div className="p-6 text-center">
                  <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No budget items</h3>
                  <p className="mt-1 text-sm text-gray-500">Budget breakdown will appear here once added.</p>
                  <div className="mt-4">
                    <Link 
                      href={`/budget?proposalId=${proposal.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <BanknotesIcon className="h-4 w-4 mr-2" />
                      Add Budget Details
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Year
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {proposal.budgetItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.category}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.year || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(item.amount, proposal.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'collaborators' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Collaborators</h3>
              </div>
              {proposal.collaborators.length === 0 ? (
                <div className="p-6 text-center">
                  <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No collaborators</h3>
                  <p className="mt-1 text-sm text-gray-500">Team members will appear here once added.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {proposal.collaborators.map((collab) => (
                    <li key={collab.user.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {collab.user.firstName?.[0]}{collab.user.lastName?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {collab.user.firstName} {collab.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{collab.user.email}</div>
                            {collab.user.institutions.length > 0 && (
                              <div className="text-sm text-gray-500">
                                {collab.user.institutions[0].institution.name}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {collab.role}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Documents</h3>
              </div>
              {proposal.documents.length === 0 ? (
                <div className="p-6 text-center">
                  <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                  <p className="mt-1 text-sm text-gray-500">Uploaded documents will appear here.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {proposal.documents.map((doc) => (
                    <li key={doc.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <PaperClipIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{doc.originalName}</div>
                            <div className="text-sm text-gray-500">
                              {formatFileSize(doc.size)} • {formatDate(doc.uploadedAt)}
                            </div>
                          </div>
                        </div>
                        <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                          Download
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <Comments proposalId={proposal.id} />
          )}

          {activeTab === 'reviews' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Reviews</h3>
              </div>
              {proposal.reviews.length === 0 ? (
                <div className="p-6 text-center">
                  <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews</h3>
                  <p className="mt-1 text-sm text-gray-500">Reviews will appear here once assigned.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {proposal.reviews.map((review) => (
                    <li key={review.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {review.reviewer.firstName} {review.reviewer.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Status: {review.status?.replace('_', ' ') || 'Unknown'}
                          </div>
                          {review.submittedAt && (
                            <div className="text-sm text-gray-500">
                              Submitted: {formatDate(review.submittedAt)}
                            </div>
                          )}
                        </div>
                        {review.overallScore && (
                          <div className="text-sm font-medium text-gray-900">
                            Score: {review.overallScore}/10
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
