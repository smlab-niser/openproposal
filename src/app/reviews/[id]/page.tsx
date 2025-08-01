'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/lib/utils'

interface Review {
  id: string
  assignedAt: string
  dueDate: string | null
  proposal: {
    id: string
    title: string
    abstract: string
    totalBudget: number
    currency: string
    principalInvestigator: {
      name: string
      email: string
    }
  }
  review: {
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
    scores: Array<{
      id: string
      score: number
      criteria: {
        name: string
        description: string
        maxScore: number
      }
    }>
  } | null
}

export default function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ReviewDetailClient params={params} />
}

function ReviewDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const [reviewId, setReviewId] = useState<string>('')
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  // Extract the id from params
  useEffect(() => {
    params.then(({ id }) => setReviewId(id))
  }, [params])

  const fetchReview = useCallback(async () => {
    if (!reviewId) return
    
    try {
      setLoading(true)
      setError('')
      
      const token = localStorage.getItem('auth-token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(getApiUrl(`/api/reviews/${reviewId}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setReview(data)
      } else if (response.status === 404) {
        setError('Review not found')
      } else if (response.status === 403) {
        setError('Access denied')
      } else {
        setError('Failed to fetch review')
      }
    } catch (err) {
      setError('Error loading review')
    } finally {
      setLoading(false)
    }
  }, [reviewId, router])

  useEffect(() => {
    if (reviewId) {
      fetchReview()
    }
  }, [fetchReview, reviewId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading review...</p>
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
              href="/reviews"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Reviews
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Review not found</h3>
          <p className="mt-1 text-sm text-gray-500">The review you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (isComplete: boolean) => {
    return isComplete 
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/reviews"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Reviews
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Review Details</h1>
              <p className="mt-1 text-sm text-gray-500">
                Review for: {review.proposal.title}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(review.review?.isComplete || false)}`}>
              {review.review?.isComplete ? 'COMPLETED' : 'IN_PROGRESS'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proposal Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Proposal Information</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Title</h3>
                  <p className="mt-1 text-sm text-gray-900">{review.proposal.title}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Principal Investigator</h3>
                  <p className="mt-1 text-sm text-gray-900">{review.proposal.principalInvestigator.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Budget</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    ₹{review.proposal.totalBudget.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Abstract</h3>
                  <p className="mt-1 text-sm text-gray-900">{review.proposal.abstract}</p>
                </div>
              </div>
            </div>

            {/* Review Comments and Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Review Summary</h2>
              {review.review?.commentsToAuthors || review.review?.commentsToCommittee || review.review?.strengths || review.review?.weaknesses ? (
                <div className="space-y-6">
                  {/* Comments to Authors */}
                  {review.review?.commentsToAuthors && (
                    <div>
                      <h3 className="text-md font-medium text-blue-800 mb-2">Comments to Authors</h3>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.review.commentsToAuthors}</p>
                      </div>
                    </div>
                  )}

                  {/* Comments to Committee */}
                  {review.review?.commentsToCommittee && (
                    <div>
                      <h3 className="text-md font-medium text-purple-800 mb-2">Comments to Committee (Confidential)</h3>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.review.commentsToCommittee}</p>
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {review.review?.strengths && (
                    <div>
                      <h3 className="text-md font-medium text-green-800 mb-2">Strengths</h3>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.review.strengths}</p>
                      </div>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {review.review?.weaknesses && (
                    <div>
                      <h3 className="text-md font-medium text-red-800 mb-2">Weaknesses</h3>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.review.weaknesses}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No review content yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {review.review?.isComplete ? 'This review was completed but has no detailed comments.' : 'This review is not yet complete.'}
                  </p>
                  {!review.review?.isComplete && (
                    <div className="mt-6">
                      <Link
                        href={`/reviews/${review.id}/edit`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Add Review Comments
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recommendation */}
            {review.review?.recommendation && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Recommendation</h2>
                <div className="prose max-w-none">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.review.recommendation}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Overall Score */}
            {review.review?.overallScore && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Overall Score</h2>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{review.review.overallScore}</div>
                  <div className="text-sm text-gray-500">out of 10</div>
                  <div className="flex justify-center mt-2">
                    {Array.from({ length: 10 }, (_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.review!.overallScore! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Scores */}
            {review.review?.scores && review.review.scores.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Detailed Scores</h2>
                <div className="space-y-4">
                  {review.review.scores.map((score) => (
                    <div key={score.id}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-sm font-medium text-gray-900">{score.criteria.name}</h3>
                        <span className="text-sm font-medium text-gray-900">
                          {score.score}/{score.criteria.maxScore}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{score.criteria.description}</p>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(score.score / score.criteria.maxScore) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <Link
                  href={`/proposals/${review.proposal.id}`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  View Proposal
                </Link>
                {/* Show edit button only if deadline hasn't passed */}
                {(!review.dueDate || new Date() <= new Date(review.dueDate)) ? (
                  <Link
                    href={`/reviews/${review.id}/edit`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {review.review?.isComplete ? 'Edit Review' : 'Complete Review'}
                  </Link>
                ) : (
                  <div className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed">
                    Deadline Passed
                  </div>
                )}
                {review.review?.submittedAt && (
                  <div className="text-center pt-2">
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(review.review.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
