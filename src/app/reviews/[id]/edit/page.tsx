'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/lib/utils'

interface ReviewForm {
  overallScore: number
  summary: string
  strengths: string
  weaknesses: string
  commentsToAuthors: string
  commentsToCommittee: string
  budgetComments: string
  recommendation: 'ACCEPT' | 'MINOR_REVISION' | 'MAJOR_REVISION' | 'REJECT'
  scores: Array<{
    criteriaId: string
    score: number
    comments: string
  }>
}

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
  }
  review: {
    id: string
    overallScore: number | null
    summary: string | null
    strengths: string | null
    weaknesses: string | null
    commentsToAuthors: string | null
    commentsToCommittee: string | null
    budgetComments: string | null
    recommendation: string | null
    isComplete: boolean
    scores: Array<{
      id: string
      score: number
      comments: string | null
      criteria: {
        id: string
        name: string
        description: string
        maxScore: number
      }
    }>
  } | null
}

const RECOMMENDATION_OPTIONS = [
  { value: 'ACCEPT', label: 'Accept', color: 'text-green-700' },
  { value: 'MINOR_REVISION', label: 'Minor Revision Required', color: 'text-yellow-700' },
  { value: 'MAJOR_REVISION', label: 'Major Revision Required', color: 'text-orange-700' },
  { value: 'REJECT', label: 'Reject', color: 'text-red-700' }
]

export default function ReviewEditPage({ params }: { params: Promise<{ id: string }> }) {
  return <ReviewEditClient params={params} />
}

function ReviewEditClient({ params }: { params: Promise<{ id: string }> }) {
  const [reviewId, setReviewId] = useState<string>('')
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false)
  const router = useRouter()

  // Check if deadline has passed
  const checkDeadline = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date() > new Date(dueDate)
  }

  const [formData, setFormData] = useState<ReviewForm>({
    overallScore: 5,
    summary: '',
    strengths: '',
    weaknesses: '',
    commentsToAuthors: '',
    commentsToCommittee: '',
    budgetComments: '',
    recommendation: 'ACCEPT',
    scores: []
  })

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
        
        // Check if deadline has passed
        setIsDeadlinePassed(checkDeadline(data.dueDate))
        
        // Populate form with existing data
        setFormData({
          overallScore: data.review?.overallScore || 5,
          summary: data.review?.summary || '',
          strengths: data.review?.strengths || '',
          weaknesses: data.review?.weaknesses || '',
          commentsToAuthors: data.review?.commentsToAuthors || '',
          commentsToCommittee: data.review?.commentsToCommittee || '',
          budgetComments: data.review?.budgetComments || '',
          recommendation: data.review?.recommendation || 'ACCEPT',
          scores: data.review?.scores.map((score: any) => ({
            criteriaId: score.criteria.id,
            score: score.score || 5,
            comments: score.comments || ''
          })) || []
        })
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

  const handleInputChange = (field: keyof ReviewForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleScoreChange = (criteriaId: string, field: 'score' | 'comments', value: any) => {
    setFormData(prev => ({
      ...prev,
      scores: prev.scores.map(score => 
        score.criteriaId === criteriaId 
          ? { ...score, [field]: value }
          : score
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent submission if deadline has passed
    if (isDeadlinePassed) {
      setError('Cannot save review - submission deadline has passed')
      return
    }
    
    setSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        router.push('/login')
        return
      }

      // Validate required fields
      if (!formData.summary.trim()) {
        setError('Summary is required')
        setSaving(false)
        return
      }

      if (!formData.strengths.trim()) {
        setError('Strengths are required')
        setSaving(false)
        return
      }

      if (!formData.weaknesses.trim()) {
        setError('Weaknesses are required')
        setSaving(false)
        return
      }

      const payload = {
        proposalId: review!.proposal.id,
        assignmentId: reviewId,
        ...formData
      }

      const response = await fetch(getApiUrl('/api/reviews'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setSuccessMessage('Review saved successfully!')
        setTimeout(() => {
          router.push(`/reviews/${reviewId}`)
        }, 1500)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save review')
      }
    } catch (err) {
      setError('Error saving review')
    } finally {
      setSaving(false)
    }
  }

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

  if (error && !review) {
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

  const inputClass = "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
  const textareaClass = "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
  const selectClass = "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href={`/reviews/${reviewId}`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Review
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Review</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review for: {review.proposal.title}
            </p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Deadline Warning */}
        {isDeadlinePassed && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Review Submission Deadline Passed
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  The deadline for submitting reviews has passed. You can view this review but cannot make changes.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Review Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overall Score and Recommendation */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Overall Assessment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="overallScore" className="block text-sm font-medium text-gray-700 mb-1">
                      Overall Score (1-10)
                    </label>
                    <input
                      type="number"
                      id="overallScore"
                      min="1"
                      max="10"
                      value={formData.overallScore}
                      onChange={(e) => handleInputChange('overallScore', parseInt(e.target.value))}
                      className={inputClass}
                      disabled={isDeadlinePassed}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="recommendation" className="block text-sm font-medium text-gray-700 mb-1">
                      Recommendation
                    </label>
                    <select
                      id="recommendation"
                      value={formData.recommendation}
                      onChange={(e) => handleInputChange('recommendation', e.target.value)}
                      className={selectClass}
                      disabled={isDeadlinePassed}
                      required
                    >
                      {RECOMMENDATION_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Review Summary</h2>
                <div>
                  <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                    Summary <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="summary"
                    rows={4}
                    value={formData.summary}
                    onChange={(e) => handleInputChange('summary', e.target.value)}
                    className={textareaClass}
                    placeholder="Provide a brief summary of your review..."
                    disabled={isDeadlinePassed}
                    required
                  />
                </div>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Detailed Assessment</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="strengths" className="block text-sm font-medium text-gray-700 mb-1">
                      Strengths <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="strengths"
                      rows={4}
                      value={formData.strengths}
                      onChange={(e) => handleInputChange('strengths', e.target.value)}
                      className={textareaClass}
                      placeholder="What are the key strengths of this proposal?"
                      disabled={isDeadlinePassed}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="weaknesses" className="block text-sm font-medium text-gray-700 mb-1">
                      Weaknesses <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="weaknesses"
                      rows={4}
                      value={formData.weaknesses}
                      onChange={(e) => handleInputChange('weaknesses', e.target.value)}
                      className={textareaClass}
                      placeholder="What are the key weaknesses or areas for improvement?"
                      disabled={isDeadlinePassed}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Comments</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="commentsToAuthors" className="block text-sm font-medium text-gray-700 mb-1">
                      Comments to Authors
                    </label>
                    <textarea
                      id="commentsToAuthors"
                      rows={4}
                      value={formData.commentsToAuthors}
                      onChange={(e) => handleInputChange('commentsToAuthors', e.target.value)}
                      className={textareaClass}
                      placeholder="Comments that will be shared with the proposal authors..."
                      disabled={isDeadlinePassed}
                    />
                  </div>
                  <div>
                    <label htmlFor="commentsToCommittee" className="block text-sm font-medium text-gray-700 mb-1">
                      Comments to Committee (Confidential)
                    </label>
                    <textarea
                      id="commentsToCommittee"
                      rows={4}
                      value={formData.commentsToCommittee}
                      onChange={(e) => handleInputChange('commentsToCommittee', e.target.value)}
                      className={textareaClass}
                      placeholder="Confidential comments for the review committee only..."
                      disabled={isDeadlinePassed}
                    />
                  </div>
                  <div>
                    <label htmlFor="budgetComments" className="block text-sm font-medium text-gray-700 mb-1">
                      Budget Comments
                    </label>
                    <textarea
                      id="budgetComments"
                      rows={3}
                      value={formData.budgetComments}
                      onChange={(e) => handleInputChange('budgetComments', e.target.value)}
                      className={textareaClass}
                      placeholder="Comments on the proposed budget..."
                      disabled={isDeadlinePassed}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Proposal Info */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Proposal Info</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Title</h3>
                    <p className="text-sm text-gray-900">{review.proposal.title}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Budget</h3>
                    <p className="text-sm text-gray-900">
                      ₹{review.proposal.totalBudget.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                    <p className="text-sm text-gray-900">
                      {review.dueDate 
                        ? new Date(review.dueDate).toLocaleDateString()
                        : 'Not specified'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={saving || isDeadlinePassed}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Saving...' : isDeadlinePassed ? 'Deadline Passed' : 'Save Review'}
                  </button>
                  <Link
                    href={`/proposals/${review.proposal.id}`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    View Proposal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
