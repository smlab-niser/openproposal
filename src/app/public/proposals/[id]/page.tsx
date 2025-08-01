'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CalendarIcon,
  UsersIcon,
  EyeIcon,
  BuildingOfficeIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/lib/utils'

interface PublicProposal {
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
  principalInvestigator: {
    id: string
    name: string
    firstName: string | null
    lastName: string | null
    orcid: string | null
    bio: string | null
    researchInterests: string | null
    expertise: string | null
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
    fundingProgram: {
      name: string
      description: string
      agency: {
        name: string
        website: string | null
      }
    }
  }
  collaborators: Array<{
    role: string
    user: {
      id: string
      name: string
      firstName: string | null
      lastName: string | null
      orcid: string | null
    }
  }>
  budgetItems: Array<{
    id: string
    category: string
    description: string
    amount: number
    year: number | null
    justification: string | null
  }>
  reviews: Array<{
    id: string
    overallScore: number | null
    summary: string | null
    strengths: string | null
    weaknesses: string | null
    commentsToAuthors: string | null
    recommendation: string | null
    submittedAt: string | null
    reviewer: {
      firstName: string | null
      lastName: string | null
      name: string
    }
    scores: Array<{
      score: number
      criteria: {
        name: string
        description: string
        maxScore: number
      }
    }>
  }>
}

export default function PublicProposalPage({ params }: { params: Promise<{ id: string }> }) {
  return <PublicProposalClient params={params} />
}

function PublicProposalClient({ params }: { params: Promise<{ id: string }> }) {
  const [proposalId, setProposalId] = useState<string>('')
  const [proposal, setProposal] = useState<PublicProposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  // Extract the id from params
  useEffect(() => {
    params.then(({ id }) => setProposalId(id))
  }, [params])

  useEffect(() => {
    if (!proposalId) return

    const fetchProposal = async () => {
      try {
        setLoading(true)
        const response = await fetch(getApiUrl(`/api/public/proposals/${proposalId}`))
        
        if (!response.ok) {
          throw new Error('Failed to fetch proposal')
        }

        const data = await response.json()
        setProposal(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProposal()
  }, [proposalId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <h1 className="text-lg font-medium text-gray-900">Proposal Not Found</h1>
              <p className="text-sm text-gray-600">
                {error || 'This proposal is not publicly available or does not exist.'}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getStatusIcon = () => {
    switch (proposal.status) {
      case 'ACCEPTED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'REJECTED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = () => {
    switch (proposal.status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const averageScore = proposal.reviews.length > 0 
    ? proposal.reviews.reduce((sum, review) => sum + (review.overallScore || 0), 0) / proposal.reviews.length
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/calls/${proposal.call.id}`}
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Results
            </Link>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
                {proposal.status}
              </span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {proposal.title}
          </h1>
          
          <div className="flex flex-wrap items-center text-sm text-gray-600 space-x-4">
            <div className="flex items-center">
              <UsersIcon className="h-4 w-4 mr-1" />
              {proposal.principalInvestigator.firstName} {proposal.principalInvestigator.lastName}
            </div>
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-4 w-4 mr-1" />
              {proposal.institution.name}
            </div>
            {proposal.totalBudget && (
              <div className="flex items-center">
                <BanknotesIcon className="h-4 w-4 mr-1" />
                {formatCurrency(proposal.totalBudget, proposal.currency)}
              </div>
            )}
            {averageScore && (
              <div className="flex items-center">
                <StarIcon className="h-4 w-4 mr-1 text-yellow-400" />
                {averageScore.toFixed(1)} avg score
              </div>
            )}
          </div>
        </div>

        {/* Funding Call Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-medium text-blue-900 mb-1">Funding Call</h3>
          <Link 
            href={`/calls/${proposal.call.id}`}
            className="text-blue-700 hover:text-blue-800 font-medium"
          >
            {proposal.call.title}
          </Link>
          <p className="text-sm text-blue-600 mt-1">
            {proposal.call.fundingProgram.agency.name} • {proposal.call.fundingProgram.name}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: DocumentTextIcon },
              { id: 'budget', name: 'Budget', icon: BanknotesIcon },
              { id: 'reviews', name: `Reviews (${proposal.reviews.length})`, icon: EyeIcon },
              { id: 'team', name: 'Research Team', icon: UsersIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Abstract</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{proposal.abstract}</p>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Project Description</h3>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                    {proposal.description}
                  </div>
                </div>

                {proposal.methodology && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Methodology</h3>
                    <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                      {proposal.methodology}
                    </div>
                  </div>
                )}

                {proposal.expectedOutcomes && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Expected Outcomes</h3>
                    <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                      {proposal.expectedOutcomes}
                    </div>
                  </div>
                )}

                {proposal.ethicsStatement && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Ethics Statement</h3>
                    <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                      {proposal.ethicsStatement}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'budget' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Breakdown</h3>
                {proposal.budgetItems.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(proposal.budgetItems.reduce((years, item) => {
                      const year = item.year || 1
                      if (!years[year]) years[year] = []
                      years[year].push(item)
                      return years
                    }, {} as Record<number, typeof proposal.budgetItems>)).map(([year, items]) => (
                        <div key={year} className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Year {year}</h4>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <div key={item.id} className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900">{item.category}</div>
                                  <div className="text-sm text-gray-600">{item.description}</div>
                                  {item.justification && (
                                    <div className="text-xs text-gray-500 mt-1">{item.justification}</div>
                                  )}
                                </div>
                                <div className="font-medium text-sm text-gray-900 ml-4">
                                  {formatCurrency(item.amount, proposal.currency)}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="border-t pt-2 mt-3">
                            <div className="flex justify-between font-medium">
                              <span>Year {year} Total:</span>
                              <span>{formatCurrency(
                                items.reduce((sum, item) => sum + item.amount, 0),
                                proposal.currency
                              )}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                    <div className="border-t-2 pt-4 mt-6">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Project Budget:</span>
                        <span>{formatCurrency(proposal.totalBudget || 0, proposal.currency)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No budget details available.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {proposal.reviews.length > 0 ? (
                  proposal.reviews.map((review, index) => (
                    <div key={review.id} className="bg-white shadow rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Review {index + 1}
                        </h3>
                        <div className="flex items-center space-x-4">
                          {review.overallScore && (
                            <div className="flex items-center">
                              <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                              <span className="font-medium">{review.overallScore}/10</span>
                            </div>
                          )}
                          <span className="text-sm text-gray-500">
                            {review.reviewer.firstName} {review.reviewer.lastName}
                          </span>
                        </div>
                      </div>

                      {review.summary && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">{review.summary}</p>
                        </div>
                      )}

                      {review.strengths && (
                        <div className="mb-4">
                          <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">{review.strengths}</p>
                        </div>
                      )}

                      {review.weaknesses && (
                        <div className="mb-4">
                          <h4 className="font-medium text-red-700 mb-2">Weaknesses</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">{review.weaknesses}</p>
                        </div>
                      )}

                      {review.commentsToAuthors && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Comments to Authors</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">{review.commentsToAuthors}</p>
                        </div>
                      )}

                      {review.recommendation && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Recommendation</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            review.recommendation === 'ACCEPT' 
                              ? 'bg-green-100 text-green-800'
                              : review.recommendation === 'REJECT'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {review.recommendation}
                          </span>
                        </div>
                      )}

                      {review.scores.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Detailed Scores</h4>
                          <div className="space-y-1">
                            {review.scores.map((score) => (
                              <div key={score.criteria.name} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">{score.criteria.name}</span>
                                <span className="font-medium">{score.score}/{score.criteria.maxScore}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {review.submittedAt && (
                        <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                          Submitted on {new Date(review.submittedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-white shadow rounded-lg p-6">
                    <p className="text-gray-500">No public reviews available for this proposal.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'team' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Research Team</h3>
                <div className="space-y-4">
                  {/* Principal Investigator */}
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {proposal.principalInvestigator.firstName} {proposal.principalInvestigator.lastName}
                        </h4>
                        <p className="text-sm text-indigo-600 font-medium">Principal Investigator</p>
                        <p className="text-sm text-gray-600">{proposal.institution.name}</p>
                        {proposal.principalInvestigator.orcid && (
                          <a
                            href={`https://orcid.org/${proposal.principalInvestigator.orcid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:underline"
                          >
                            ORCID: {proposal.principalInvestigator.orcid}
                          </a>
                        )}
                      </div>
                    </div>
                    {proposal.principalInvestigator.bio && (
                      <p className="text-sm text-gray-700 mt-2">{proposal.principalInvestigator.bio}</p>
                    )}
                    {proposal.principalInvestigator.expertise && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-gray-500">Expertise: </span>
                        <span className="text-xs text-gray-600">{proposal.principalInvestigator.expertise}</span>
                      </div>
                    )}
                  </div>

                  {/* Collaborators */}
                  {proposal.collaborators.map((collaborator) => (
                    <div key={collaborator.user.id} className="border-l-4 border-gray-300 pl-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {collaborator.user.firstName} {collaborator.user.lastName}
                          </h4>
                          <p className="text-sm text-gray-600 font-medium capitalize">{collaborator.role.replace('_', ' ')}</p>
                          {collaborator.user.orcid && (
                            <a
                              href={`https://orcid.org/${collaborator.user.orcid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:underline"
                            >
                              ORCID: {collaborator.user.orcid}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Proposal Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
                      {proposal.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Institution</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {proposal.institution.website ? (
                      <a href={proposal.institution.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {proposal.institution.name}
                      </a>
                    ) : proposal.institution.name}
                    <div className="text-xs text-gray-500">{proposal.institution.country}</div>
                  </dd>
                </div>
                {proposal.totalBudget && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Budget</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatCurrency(proposal.totalBudget, proposal.currency)}
                    </dd>
                  </div>
                )}
                {proposal.submittedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(proposal.submittedAt).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {averageScore && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Average Score</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                      {averageScore.toFixed(1)}/10 ({proposal.reviews.length} reviews)
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Funding Program</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Program</dt>
                  <dd className="mt-1 text-sm text-gray-900">{proposal.call.fundingProgram.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Agency</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {proposal.call.fundingProgram.agency.website ? (
                      <a href={proposal.call.fundingProgram.agency.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {proposal.call.fundingProgram.agency.name}
                      </a>
                    ) : proposal.call.fundingProgram.agency.name}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
