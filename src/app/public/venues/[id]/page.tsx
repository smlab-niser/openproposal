'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { use } from 'react'
import { 
  ArrowLeftIcon,
  BuildingOfficeIcon,
  UserIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  GlobeAltIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/lib/utils'

interface PublicCallDetail {
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
    description: string
    agency: {
      name: string
      website?: string
    }
    reviewCriteria: Array<{
      id: string
      name: string
      description: string
      weight: number
      maxScore: number
    }>
  }
  proposals: Array<{
    id: string
    title: string
    abstract: string
    status: string
    totalBudget: number
    currency: string
    submittedAt: string
    principalInvestigator: {
      name: string
      firstName?: string
      lastName?: string
      orcid?: string
    }
    institution: {
      name: string
      country: string
      website?: string
    }
    reviews: Array<{
      id: string
      overallScore: number
      summary: string
      strengths: string
      weaknesses: string
      recommendation: string
      reviewer: {
        name: string
        firstName?: string
        lastName?: string
      }
      scores: Array<{
        score: number
        criteria: {
          name: string
          maxScore: number
        }
      }>
    }>
    collaborators: Array<{
      role: string
      user: {
        name: string
        firstName?: string
        lastName?: string
      }
    }>
  }>
}

export default function PublicVenueDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [call, setCall] = useState<PublicCallDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

  useEffect(() => {
    const fetchCall = async () => {
      try {
        const response = await fetch(getApiUrl(`/api/public/calls/${id}`))
        if (response.ok) {
          const data = await response.json()
          setCall(data)
        } else if (response.status === 404) {
          setError('Public venue not found')
        } else {
          setError('Failed to fetch venue details')
        }
      } catch {
        setError('Error loading venue details')
      } finally {
        setLoading(false)
      }
    }

    fetchCall()
  }, [id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'WITHDRAWN': return 'bg-gray-100 text-gray-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'REJECTED': return <XCircleIcon className="h-5 w-5 text-red-600" />
      default: return <ClockIcon className="h-5 w-5 text-yellow-600" />
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.includes('ACCEPT')) return 'text-green-600'
    if (recommendation.includes('REJECT')) return 'text-red-600'
    return 'text-yellow-600'
  }

  const filteredProposals = call?.proposals.filter(proposal => 
    selectedStatus === 'ALL' || proposal.status === selectedStatus
  ) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading venue details...</p>
        </div>
      </div>
    )
  }

  if (error || !call) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">{error || 'Venue not found'}</p>
          <Link
            href="/public/venues"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Public Venues
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
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <Link
                    href="/public/venues"
                    className="mr-4 text-gray-400 hover:text-gray-600"
                  >
                    <ArrowLeftIcon className="h-6 w-6" />
                  </Link>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{call.title}</h1>
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Call Overview */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Call Overview</h2>
            <p className="text-gray-700 mb-4">{call.description}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {call.totalBudget && (
                <div className="flex items-center text-sm text-gray-600">
                  <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                  <span>Total Budget: {call.totalBudget.toLocaleString()} {call.currency}</span>
                </div>
              )}
              
              <div className="flex items-center text-sm text-gray-600">
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                <span>{call.proposals.length} Submissions</span>
              </div>

              {call.openDate && (
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>Opened: {new Date(call.openDate).toLocaleDateString()}</span>
                </div>
              )}

              {call.closeDate && (
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>Closed: {new Date(call.closeDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">
                  {call.proposals.filter(p => p.status === 'ACCEPTED').length}
                </p>
                <p className="text-gray-600">Accepted</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">
                  {call.proposals.filter(p => p.status === 'REJECTED').length}
                </p>
                <p className="text-gray-600">Rejected</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <StarIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">
                  {call.proposals.reduce((acc, p) => acc + p.reviews.reduce((r, review) => r + review.overallScore, 0), 0) / 
                   call.proposals.reduce((acc, p) => acc + p.reviews.length, 0) || 0}
                </p>
                <p className="text-gray-600">Avg Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Filter by status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="ALL">All Proposals</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>
          </div>
        </div>

        {/* Proposals */}
        <div className="space-y-6">
          {filteredProposals.map((proposal) => (
            <div key={proposal.id} className="bg-white shadow rounded-lg">
              <div className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(proposal.status)}
                      <h3 className="text-lg font-medium text-gray-900">
                        {proposal.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                        {proposal.status}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <UserIcon className="h-4 w-4 mr-1" />
                      <span className="font-medium">{proposal.principalInvestigator.name}</span>
                      <span className="mx-2">•</span>
                      <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                      <span>{proposal.institution.name}, {proposal.institution.country}</span>
                      <span className="mx-2">•</span>
                      <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                      <span>{proposal.totalBudget.toLocaleString()} {proposal.currency}</span>
                    </div>

                    <p className="mt-3 text-gray-700">{proposal.abstract}</p>

                    {/* Collaborators */}
                    {proposal.collaborators.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm font-medium text-gray-700">Collaborators: </span>
                        <span className="text-sm text-gray-600">
                          {proposal.collaborators.map(c => c.user.name).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Reviews */}
                    {proposal.reviews.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Reviews</h4>
                        <div className="space-y-4">
                          {proposal.reviews.map((review) => (
                            <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm font-medium text-gray-900">
                                    Reviewer: {review.reviewer.name}
                                  </span>
                                  <div className="flex items-center">
                                    <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                                    <span className="text-sm font-medium">{review.overallScore}/10</span>
                                  </div>
                                </div>
                                <span className={`text-sm font-medium ${getRecommendationColor(review.recommendation)}`}>
                                  {review.recommendation}
                                </span>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Summary: </span>
                                  <span className="text-sm text-gray-600">{review.summary}</span>
                                </div>
                                
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Strengths: </span>
                                  <span className="text-sm text-gray-600">{review.strengths}</span>
                                </div>

                                <div>
                                  <span className="text-sm font-medium text-gray-700">Weaknesses: </span>
                                  <span className="text-sm text-gray-600">{review.weaknesses}</span>
                                </div>

                                {/* Detailed Scores */}
                                {review.scores.length > 0 && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Detailed Scores: </span>
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {review.scores.map((score, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                          <span className="text-gray-600">{score.criteria.name}:</span>
                                          <span className="font-medium">{score.score}/{score.criteria.maxScore}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProposals.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No proposals match the selected filter.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
