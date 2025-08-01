'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  PlusIcon,
  BuildingOfficeIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/lib/utils'

interface Agency {
  id: string
  name: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function CreateFundingProgramPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [programOfficers, setProgramOfficers] = useState<User[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agencyId: '',
    programOfficerId: '',
    minAmount: '',
    maxAmount: '',
    currency: 'INR',
    maxDuration: '',
    objectives: '',
    eligibilityRules: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      
      // Fetch agencies
      const agenciesResponse = await fetch(getApiUrl('/api/agencies'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      // Fetch program officers
      const usersResponse = await fetch(getApiUrl('/api/users?role=PROGRAM_OFFICER'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (agenciesResponse.ok) {
        const agenciesData = await agenciesResponse.json()
        setAgencies(agenciesData)
      }
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setProgramOfficers(usersData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Program name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.agencyId) {
      newErrors.agencyId = 'Agency is required'
    }

    if (!formData.programOfficerId) {
      newErrors.programOfficerId = 'Program officer is required'
    }

    if (formData.minAmount && formData.maxAmount) {
      if (parseFloat(formData.minAmount) >= parseFloat(formData.maxAmount)) {
        newErrors.maxAmount = 'Maximum amount must be greater than minimum amount'
      }
    }

    if (formData.maxDuration && (isNaN(Number(formData.maxDuration)) || Number(formData.maxDuration) <= 0)) {
      newErrors.maxDuration = 'Maximum duration must be a positive number'
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
      const submitData = {
        ...formData,
        minAmount: formData.minAmount ? parseFloat(formData.minAmount) : null,
        maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : null,
        maxDuration: formData.maxDuration ? parseInt(formData.maxDuration) : null,
        objectives: formData.objectives ? JSON.stringify(formData.objectives.split('\n').filter(o => o.trim())) : null,
        eligibilityRules: formData.eligibilityRules ? JSON.stringify(formData.eligibilityRules.split('\n').filter(r => r.trim())) : null
      }

      const response = await fetch(getApiUrl('/api/funding-programs'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        router.push('/admin/funding-programs')
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || 'Failed to create funding program' })
      }
    } catch (error) {
      console.error('Error creating funding program:', error)
      setErrors({ submit: 'Network error occurred' })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
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
              href="/admin/funding-programs"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Funding Programs
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Funding Program</h1>
            <p className="mt-2 text-gray-600">
              Set up a new funding program that can be used for creating calls for proposals
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow-sm rounded-lg">
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Program Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                      placeholder="e.g., Early Career Research Award"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
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
                      placeholder="Describe the purpose and scope of this funding program..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="agencyId" className="block text-sm font-medium text-gray-700">
                        Agency *
                      </label>
                      <select
                        name="agencyId"
                        id="agencyId"
                        value={formData.agencyId}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                      >
                        <option value="">Select an agency...</option>
                        {agencies.map((agency) => (
                          <option key={agency.id} value={agency.id}>
                            {agency.name}
                          </option>
                        ))}
                      </select>
                      {errors.agencyId && (
                        <p className="mt-1 text-sm text-red-600">{errors.agencyId}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="programOfficerId" className="block text-sm font-medium text-gray-700">
                        Program Officer *
                      </label>
                      <select
                        name="programOfficerId"
                        id="programOfficerId"
                        value={formData.programOfficerId}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                      >
                        <option value="">Select a program officer...</option>
                        {programOfficers.map((officer) => (
                          <option key={officer.id} value={officer.id}>
                            {officer.name} ({officer.email})
                          </option>
                        ))}
                      </select>
                      {errors.programOfficerId && (
                        <p className="mt-1 text-sm text-red-600">{errors.programOfficerId}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget Constraints */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Constraints</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="minAmount" className="block text-sm font-medium text-gray-700">
                      Minimum Amount
                    </label>
                    <input
                      type="number"
                      name="minAmount"
                      id="minAmount"
                      value={formData.minAmount}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="maxAmount" className="block text-sm font-medium text-gray-700">
                      Maximum Amount
                    </label>
                    <input
                      type="number"
                      name="maxAmount"
                      id="maxAmount"
                      value={formData.maxAmount}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                      placeholder="1000000"
                    />
                    {errors.maxAmount && (
                      <p className="mt-1 text-sm text-red-600">{errors.maxAmount}</p>
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

                <div className="mt-4">
                  <label htmlFor="maxDuration" className="block text-sm font-medium text-gray-700">
                    Maximum Duration (months)
                  </label>
                  <input
                    type="number"
                    name="maxDuration"
                    id="maxDuration"
                    value={formData.maxDuration}
                    onChange={handleChange}
                    className="mt-1 block w-full md:w-1/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                    placeholder="36"
                  />
                  {errors.maxDuration && (
                    <p className="mt-1 text-sm text-red-600">{errors.maxDuration}</p>
                  )}
                </div>
              </div>

              {/* Program Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Program Details</h3>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="objectives" className="block text-sm font-medium text-gray-700">
                      Objectives (one per line)
                    </label>
                    <textarea
                      name="objectives"
                      id="objectives"
                      rows={4}
                      value={formData.objectives}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                      placeholder="Support early career researchers&#10;Promote innovative research&#10;Foster collaboration"
                    />
                  </div>

                  <div>
                    <label htmlFor="eligibilityRules" className="block text-sm font-medium text-gray-700">
                      Eligibility Rules (one per line)
                    </label>
                    <textarea
                      name="eligibilityRules"
                      id="eligibilityRules"
                      rows={4}
                      value={formData.eligibilityRules}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                      placeholder="Must be affiliated with an eligible institution&#10;Maximum 5 years post-PhD&#10;Must be the principal investigator"
                    />
                  </div>
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
                href="/admin/funding-programs"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitLoading ? 'Creating...' : 'Create Funding Program'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
