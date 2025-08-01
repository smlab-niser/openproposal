'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  InformationCircleIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/lib/utils'

interface FundingProgram {
  id: string
  name: string
  agency: {
    name: string
  }
}

interface CallTemplate {
  id: string
  name: string
  description: string
  template: {
    title: string
    description: string
    currency: string
    reviewVisibility: string
    isPublic: boolean
    status: string
    suggestedBudget?: {
      min: number
      max: number
    }
    suggestedDuration?: number
    objectives?: string[]
    eligibilityRules?: string[]
  }
}

export default function CreateCallPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [fundingPrograms, setFundingPrograms] = useState<FundingProgram[]>([])
  const [templates, setTemplates] = useState<CallTemplate[]>([])
  const [showTemplates, setShowTemplates] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fundingProgramId: '',
    openDate: '',
    closeDate: '',
    intentDeadline: '',
    fullProposalDeadline: '',
    reviewDeadline: '',
    totalBudget: '',
    currency: 'INR',
    reviewVisibility: 'PRIVATE',
    isPublic: true,
    status: 'DRAFT'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [uploadLoading, setUploadLoading] = useState(false)

  useEffect(() => {
    fetchFundingPrograms()
    fetchTemplates()
  }, [])

  const fetchFundingPrograms = async () => {
    setLoading(true)
    try {
      const response = await fetch(getApiUrl('/api/funding-programs'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      })
      
      if (response.ok) {
        const programs = await response.json()
        setFundingPrograms(programs)
      } else {
        console.error('Failed to fetch funding programs')
      }
    } catch (error) {
      console.error('Error fetching funding programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch(getApiUrl('/api/call-templates'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      })
      
      if (response.ok) {
        const templatesData = await response.json()
        setTemplates(templatesData)
      } else {
        console.error('Failed to fetch templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.fundingProgramId) {
      newErrors.fundingProgramId = 'Funding program is required'
    }

    // Validate date logic
    if (formData.openDate && formData.closeDate) {
      if (new Date(formData.openDate) >= new Date(formData.closeDate)) {
        newErrors.closeDate = 'Close date must be after open date'
      }
    }

    if (formData.intentDeadline && formData.openDate) {
      if (new Date(formData.intentDeadline) <= new Date(formData.openDate)) {
        newErrors.intentDeadline = 'Intent deadline must be after open date'
      }
    }

    if (formData.fullProposalDeadline && formData.intentDeadline) {
      if (new Date(formData.fullProposalDeadline) <= new Date(formData.intentDeadline)) {
        newErrors.fullProposalDeadline = 'Full proposal deadline must be after intent deadline'
      }
    }

    if (formData.reviewDeadline && formData.fullProposalDeadline) {
      if (new Date(formData.reviewDeadline) <= new Date(formData.fullProposalDeadline)) {
        newErrors.reviewDeadline = 'Review deadline must be after full proposal deadline'
      }
    }

    if (formData.totalBudget && isNaN(Number(formData.totalBudget))) {
      newErrors.totalBudget = 'Total budget must be a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSubmitLoading(true)
    try {
      const response = await fetch(getApiUrl('/api/calls'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/admin/calls')
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || 'Failed to create funding call' })
      }
    } catch (error) {
      console.error('Error creating funding call:', error)
      setErrors({ submit: 'Network error occurred' })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, file: 'File size must be less than 10MB' }))
      return
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, file: 'Only PDF, DOC, DOCX, images, and text files are allowed' }))
      return
    }

    setUploadLoading(true)
    try {
      // For now, just add to local state. In real implementation, 
      // we'd upload after the call is created
      const fileInfo = {
        id: `temp_${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file: file // Store the actual file for later upload
      }

      setUploadedFiles(prev => [...prev, fileInfo])
      setErrors(prev => ({ ...prev, file: '' }))
      
      // Clear the input
      e.target.value = ''
    } catch (error) {
      console.error('Error preparing file:', error)
      setErrors(prev => ({ ...prev, file: 'Error preparing file for upload' }))
    } finally {
      setUploadLoading(false)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const applyTemplate = (template: CallTemplate) => {
    const currentYear = new Date().getFullYear()
    setFormData(prev => ({
      ...prev,
      title: template.template.title.replace('[Year]', currentYear.toString()),
      description: template.template.description,
      currency: template.template.currency,
      reviewVisibility: template.template.reviewVisibility,
      isPublic: template.template.isPublic,
      status: template.template.status,
      totalBudget: template.template.suggestedBudget?.max?.toString() || ''
    }))
    setShowTemplates(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/admin/calls"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Calls Management
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Funding Call</h1>
              <p className="mt-2 text-gray-600">
                Create a new call for proposals for researchers to submit funding applications
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RocketLaunchIcon className="mr-2 h-4 w-4" />
                Use Template
              </button>
            </div>
          </div>
        </div>

        {/* Templates Panel */}
        {showTemplates && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">Choose a Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white border border-blue-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
                  onClick={() => applyTemplate(template)}
                >
                  <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  {template.template.suggestedBudget && (
                    <p className="text-xs text-blue-600">
                      Budget: ₹{(template.template.suggestedBudget.min / 100000).toFixed(1)}L - ₹{(template.template.suggestedBudget.max / 100000).toFixed(1)}L
                    </p>
                  )}
                  {template.template.suggestedDuration && (
                    <p className="text-xs text-blue-600">
                      Duration: {template.template.suggestedDuration} months
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow-sm rounded-lg">
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                      placeholder="Enter call title..."
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                      placeholder="Describe the funding opportunity..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="fundingProgramId" className="block text-sm font-medium text-gray-700">
                      Funding Program *
                    </label>
                    {fundingPrograms.length === 0 ? (
                      <div className="mt-1">
                        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                          <div className="flex">
                            <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
                            <div className="ml-3">
                              <p className="text-sm text-yellow-700">
                                No funding programs available. You need to create a funding program first.
                              </p>
                              <div className="mt-2">
                                <Link
                                  href="/admin/funding-programs/new"
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                >
                                  Create Funding Program
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <select
                        name="fundingProgramId"
                        id="fundingProgramId"
                        value={formData.fundingProgramId}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                      >
                        <option value="">Select a funding program...</option>
                        {fundingPrograms.map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.agency.name} - {program.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.fundingProgramId && (
                      <p className="mt-1 text-sm text-red-600">{errors.fundingProgramId}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Budget Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="totalBudget" className="block text-sm font-medium text-gray-700">
                      Total Budget
                    </label>
                    <input
                      type="number"
                      name="totalBudget"
                      id="totalBudget"
                      value={formData.totalBudget}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                      placeholder="Enter total budget amount..."
                    />
                    {errors.totalBudget && (
                      <p className="mt-1 text-sm text-red-600">{errors.totalBudget}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                      Currency
                    </label>
                    <select
                      name="currency"
                      id="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                    >
                      <option value="INR">INR (Indian Rupee)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="openDate" className="block text-sm font-medium text-gray-700">
                      Open Date
                    </label>
                    <input
                      type="date"
                      name="openDate"
                      id="openDate"
                      value={formData.openDate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="closeDate" className="block text-sm font-medium text-gray-700">
                      Close Date
                    </label>
                    <input
                      type="date"
                      name="closeDate"
                      id="closeDate"
                      value={formData.closeDate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                    />
                    {errors.closeDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.closeDate}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="intentDeadline" className="block text-sm font-medium text-gray-700">
                      Intent Deadline
                    </label>
                    <input
                      type="date"
                      name="intentDeadline"
                      id="intentDeadline"
                      value={formData.intentDeadline}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                    />
                    {errors.intentDeadline && (
                      <p className="mt-1 text-sm text-red-600">{errors.intentDeadline}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="fullProposalDeadline" className="block text-sm font-medium text-gray-700">
                      Full Proposal Deadline
                    </label>
                    <input
                      type="date"
                      name="fullProposalDeadline"
                      id="fullProposalDeadline"
                      value={formData.fullProposalDeadline}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                    />
                    {errors.fullProposalDeadline && (
                      <p className="mt-1 text-sm text-red-600">{errors.fullProposalDeadline}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="reviewDeadline" className="block text-sm font-medium text-gray-700">
                      Review Deadline
                    </label>
                    <input
                      type="date"
                      name="reviewDeadline"
                      id="reviewDeadline"
                      value={formData.reviewDeadline}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                    />
                    {errors.reviewDeadline && (
                      <p className="mt-1 text-sm text-red-600">{errors.reviewDeadline}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      name="status"
                      id="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="OPEN">Open</option>
                      <option value="CLOSED">Closed</option>
                      <option value="UPCOMING">Upcoming</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="reviewVisibility" className="block text-sm font-medium text-gray-700">
                      Review Visibility
                    </label>
                    <select
                      name="reviewVisibility"
                      id="reviewVisibility"
                      value={formData.reviewVisibility}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                    >
                      <option value="PRIVATE">Private</option>
                      <option value="BLIND">Blind Review</option>
                      <option value="OPEN_PRE_REVIEW">Open Pre-Review</option>
                      <option value="OPEN_POST_REVIEW">Open Post-Review</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center">
                    <input
                      id="isPublic"
                      name="isPublic"
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                      Make this call publicly visible
                    </label>
                  </div>
                  <div className="mt-2 flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <p className="text-sm text-gray-600">
                      Public calls will be visible to all users on the platform. Private calls are only visible to administrators.
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Supporting Documents</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Documents
                    </label>
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={handleFileUpload}
                              disabled={uploadLoading}
                              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, images, or text files up to 10MB
                        </p>
                      </div>
                    </div>
                    {errors.file && (
                      <p className="mt-1 text-sm text-red-600">{errors.file}</p>
                    )}
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents</h4>
                      <div className="space-y-2">
                        {uploadedFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center">
                              <DocumentArrowUpIcon className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(file.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <Link
                href="/admin/calls"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitLoading ? 'Creating...' : 'Create Funding Call'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
