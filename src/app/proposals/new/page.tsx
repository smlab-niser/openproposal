'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getApiUrl } from '@/lib/utils'
import { DocumentTextIcon, BanknotesIcon, UsersIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface FundingCall {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'CLOSED' | 'UPCOMING'
  closeDate: string
  totalBudget: number | null
  currency: string
  fundingProgram: {
    name: string
  }
}

interface ProposalFormData {
  title: string
  abstract: string
  keywords: string[]
  duration: number
  totalBudget: number | undefined
  currency: string
  projectDescription: string
  methodology: string
  expectedOutcomes: string
  ethicalConsiderations: string
  riskAssessment: string
  callId: string
}

export default function NewProposalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading proposal form...</p>
      </div>
    </div>}>
      <NewProposalContent />
    </Suspense>
  )
}

function NewProposalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
  const [error, setError] = useState('')
  const [availableCalls, setAvailableCalls] = useState<FundingCall[]>([])
  const [selectedCall, setSelectedCall] = useState<FundingCall | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Common input styles
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
  const textareaClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
  const selectClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
  
  const [formData, setFormData] = useState<ProposalFormData>({
    title: '',
    abstract: '',
    keywords: [],
    duration: 12,
    totalBudget: undefined,
    currency: 'INR',
    projectDescription: '',
    methodology: '',
    expectedOutcomes: '',
    ethicalConsiderations: '',
    riskAssessment: '',
    callId: ''
  })

  // Fetch available open calls
  useEffect(() => {
    const fetchCalls = async () => {
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
          const calls = Array.isArray(data) ? data : (data.calls || [])
          const openCalls = calls.filter((call: FundingCall) => call.status === 'OPEN')
          setAvailableCalls(openCalls)

          // Check if callId is provided in URL
          const callIdFromUrl = searchParams.get('callId')
          if (callIdFromUrl) {
            const matchingCall = openCalls.find((call: FundingCall) => call.id === callIdFromUrl)
            if (matchingCall) {
              setSelectedCall(matchingCall)
              setFormData(prev => ({ 
                ...prev, 
                callId: matchingCall.id,
                currency: matchingCall.currency || 'INR'
              }))
            }
          }
        } else {
          setError('Failed to fetch funding calls')
        }
      } catch (error) {
        console.error('Error fetching calls:', error)
        setError('Error loading funding calls')
      } finally {
        setLoading(false)
      }
    }

    fetchCalls()
  }, [router, searchParams])

  const sections = [
    {
      id: 'call',
      title: 'Select Funding Call',
      icon: BanknotesIcon,
      fields: ['callId']
    },
    {
      id: 'basic',
      title: 'Basic Information',
      icon: DocumentTextIcon,
      fields: ['title', 'abstract', 'keywords', 'duration']
    },
    {
      id: 'budget',
      title: 'Budget Overview',
      icon: BanknotesIcon,
      fields: ['totalBudget', 'currency']
    },
    {
      id: 'details',
      title: 'Project Details',
      icon: DocumentTextIcon,
      fields: ['projectDescription', 'methodology', 'expectedOutcomes']
    },
    {
      id: 'compliance',
      title: 'Compliance & Risk',
      icon: UsersIcon,
      fields: ['ethicalConsiderations', 'riskAssessment']
    }
  ]

  const handleInputChange = (field: keyof ProposalFormData, value: string | number | string[] | undefined) => {
    setError('') // Clear any previous errors
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // If callId is changed, update selected call
    if (field === 'callId') {
      const call = availableCalls.find(c => c.id === value)
      setSelectedCall(call || null)
      if (call) {
        setFormData(prev => ({
          ...prev,
          currency: call.currency || 'INR'
        }))
      }
    }
  }

  const handleKeywordChange = (value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k.length > 0)
    handleInputChange('keywords', keywords)
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    setIsSubmitting(true)
    
    try {
      // Check deadline before submitting (only for non-draft submissions)
      if (!isDraft && selectedCall) {
        const now = new Date()
        const closeDate = new Date(selectedCall.closeDate)
        
        if (now > closeDate) {
          setError('Cannot submit proposal: The submission deadline has passed')
          setIsSubmitting(false)
          return
        }
      }
      
      const token = localStorage.getItem('auth-token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(getApiUrl('/api/proposals'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          totalBudget: formData.totalBudget || 0,
          status: isDraft ? 'DRAFT' : 'SUBMITTED',
          callId: formData.callId
        }),
      })

      if (response.ok) {
        const proposal = await response.json()
        router.push(`/proposals/${proposal.id}`)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to create proposal (${response.status})`)
      }
    } catch (error) {
      console.error('Error creating proposal:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCurrentSectionFields = () => {
    return sections[currentSection]?.fields || []
  }

  const isCurrentSectionValid = () => {
    const requiredFields = getCurrentSectionFields()
    return requiredFields.every(field => {
      const value = formData[field as keyof ProposalFormData]
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== '' && value !== 0
    })
  }

  const canProceed = () => {
    if (currentSection === 0) {
      return formData.callId !== ''
    }
    return isCurrentSectionValid()
  }

  const nextSection = () => {
    if (currentSection < sections.length - 1 && canProceed()) {
      setCurrentSection(currentSection + 1)
    }
  }

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  const renderCallSelection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Funding Call</h3>
        {availableCalls.length === 0 ? (
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Open Funding Calls</h3>
            <p className="text-gray-600 mb-4">
              There are currently no open funding calls available for proposal submission.
            </p>
            <button
              onClick={() => router.push('/calls')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              View All Calls
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {availableCalls.map((call) => (
              <div
                key={call.id}
                onClick={() => handleInputChange('callId', call.id)}
                className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                  formData.callId === call.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{call.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{call.fundingProgram.name}</p>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-3">{call.description}</p>
                    <div className="flex items-center mt-3 space-x-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Open
                      </span>
                      <span className="text-sm text-gray-500">
                        Closes: {new Date(call.closeDate).toLocaleDateString()}
                      </span>
                      {call.totalBudget && (
                        <span className="text-sm text-gray-500">
                          Budget: {call.totalBudget.toLocaleString()} {call.currency}
                        </span>
                      )}
                    </div>
                  </div>
                  {formData.callId === call.id && (
                    <div className="ml-4">
                      <div className="h-4 w-4 rounded-full bg-blue-600"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderBasicInformation = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Proposal Title *
        </label>
        <input
          type="text"
          id="title"
          className={inputClass}
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter a descriptive title for your research proposal"
        />
      </div>

      <div>
        <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 mb-2">
          Abstract *
        </label>
        <textarea
          id="abstract"
          rows={6}
          className={textareaClass}
          value={formData.abstract}
          onChange={(e) => handleInputChange('abstract', e.target.value)}
          placeholder="Provide a concise summary of your research proposal (250-500 words)"
        />
      </div>

      <div>
        <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
          Keywords *
        </label>
        <input
          type="text"
          id="keywords"
          className={inputClass}
          value={formData.keywords.join(', ')}
          onChange={(e) => handleKeywordChange(e.target.value)}
          placeholder="Enter keywords separated by commas (e.g., artificial intelligence, climate change, machine learning)"
        />
      </div>

      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
          Project Duration (months) *
        </label>
        <input
          type="number"
          id="duration"
          min="1"
          max="60"
          className={inputClass}
          value={formData.duration}
          onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
        />
      </div>
    </div>
  )

  const renderBudgetOverview = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="totalBudget" className="block text-sm font-medium text-gray-700 mb-2">
          Total Budget Requested *
        </label>
        <input
          type="number"
          id="totalBudget"
          min="0"
          step="1000"
          className={inputClass}
          value={formData.totalBudget === undefined || formData.totalBudget === null ? '' : formData.totalBudget}
          onChange={(e) => handleInputChange('totalBudget', e.target.value === '' ? undefined : parseFloat(e.target.value))}
          placeholder="Enter total budget amount"
        />
      </div>

      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
          Currency *
        </label>
        <select
          id="currency"
          className={selectClass}
          value={formData.currency}
          onChange={(e) => handleInputChange('currency', e.target.value)}
        >
          <option value="INR">INR - Indian Rupee</option>
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="CAD">CAD - Canadian Dollar</option>
          <option value="AUD">AUD - Australian Dollar</option>
        </select>
      </div>

      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Budget Information</h4>
        <p className="text-sm text-blue-700">
          Enter the total amount you are requesting for the entire project duration. 
          After creating your proposal, you'll be able to access detailed budget management 
          where you can add individual budget categories like personnel, equipment, supplies, 
          travel, and more with year-wise breakdown and justifications.
        </p>
      </div>
    </div>
  )

  const renderProjectDetails = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
          Project Description *
        </label>
        <textarea
          id="projectDescription"
          rows={8}
          className={inputClass}
          value={formData.projectDescription}
          onChange={(e) => handleInputChange('projectDescription', e.target.value)}
          placeholder="Provide a detailed description of your research project, including objectives, background, and significance"
        />
      </div>

      <div>
        <label htmlFor="methodology" className="block text-sm font-medium text-gray-700 mb-2">
          Methodology *
        </label>
        <textarea
          id="methodology"
          rows={6}
          className={inputClass}
          value={formData.methodology}
          onChange={(e) => handleInputChange('methodology', e.target.value)}
          placeholder="Describe your research methodology, approach, and methods you will use"
        />
      </div>

      <div>
        <label htmlFor="expectedOutcomes" className="block text-sm font-medium text-gray-700 mb-2">
          Expected Outcomes *
        </label>
        <textarea
          id="expectedOutcomes"
          rows={6}
          className={inputClass}
          value={formData.expectedOutcomes}
          onChange={(e) => handleInputChange('expectedOutcomes', e.target.value)}
          placeholder="Describe the expected outcomes, deliverables, and impact of your research"
        />
      </div>
    </div>
  )

  const renderComplianceAndRisk = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="ethicalConsiderations" className="block text-sm font-medium text-gray-700 mb-2">
          Ethical Considerations *
        </label>
        <textarea
          id="ethicalConsiderations"
          rows={6}
          className={inputClass}
          value={formData.ethicalConsiderations}
          onChange={(e) => handleInputChange('ethicalConsiderations', e.target.value)}
          placeholder="Describe any ethical considerations, including data privacy, consent procedures, and compliance requirements"
        />
      </div>

      <div>
        <label htmlFor="riskAssessment" className="block text-sm font-medium text-gray-700 mb-2">
          Risk Assessment *
        </label>
        <textarea
          id="riskAssessment"
          rows={6}
          className={inputClass}
          value={formData.riskAssessment}
          onChange={(e) => handleInputChange('riskAssessment', e.target.value)}
          placeholder="Identify potential risks to the project and your mitigation strategies"
        />
      </div>

      <div className="bg-amber-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-amber-800 mb-2">Important</h4>
        <p className="text-sm text-amber-700">
          Please ensure all ethical and compliance requirements are thoroughly addressed. 
          Incomplete information may delay the review process.
        </p>
      </div>
    </div>
  )

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0:
        return renderCallSelection()
      case 1:
        return renderBasicInformation()
      case 2:
        return renderBudgetOverview()
      case 3:
        return renderProjectDetails()
      case 4:
        return renderComplianceAndRisk()
      default:
        return renderCallSelection()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading funding calls...</p>
        </div>
      </div>
    )
  }

  if (availableCalls.length === 0 && currentSection === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Open Funding Calls</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Currently, there are no open funding calls available for proposal submission. 
              Please check back later or contact your program coordinator for more information.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => router.push('/calls')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                View All Calls
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Proposal</h1>
          <p className="mt-2 text-gray-600">
            Complete all sections to submit your research proposal for review.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {sections.map((section, index) => {
              const Icon = section.icon
              const isActive = index === currentSection
              const isCompleted = index < currentSection
              
              return (
                <div key={section.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {section.title}
                    </p>
                  </div>
                  {index < sections.length - 1 && (
                    <div className={`ml-6 w-16 h-0.5 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {sections[currentSection].title}
            </h2>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="text-sm text-red-600">{error}</div>
              </div>
            )}
          </div>

          {renderCurrentSection()}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={prevSection}
              disabled={currentSection === 0}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                currentSection === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            <div className="flex space-x-3">
              {/* Only show Save as Draft after the first section (call selection) */}
              {currentSection > 0 && (
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Save as Draft
                </button>
              )}

              {currentSection < sections.length - 1 ? (
                <button
                  type="button"
                  onClick={nextSection}
                  disabled={!canProceed()}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    canProceed()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting || !canProceed()}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    canProceed()
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  } disabled:opacity-50`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
