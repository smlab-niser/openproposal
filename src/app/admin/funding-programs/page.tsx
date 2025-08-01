'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getApiUrl } from '@/lib/utils'
import { 
  ArrowLeftIcon,
  PlusIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface FundingProgram {
  id: string
  name: string
  description: string
  minAmount: number | null
  maxAmount: number | null
  currency: string
  maxDuration: number | null
  isActive: boolean
  agency: {
    name: string
  }
  programOfficer: {
    name: string
    email: string
  }
  _count: {
    calls: number
  }
}

export default function FundingProgramsPage() {
  const [loading, setLoading] = useState(true)
  const [programs, setPrograms] = useState<FundingProgram[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    setLoading(true)
    try {
      const response = await fetch(getApiUrl('/api/funding-programs'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPrograms(data)
      } else {
        console.error('Failed to fetch funding programs')
      }
    } catch (error) {
      console.error('Error fetching funding programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPrograms = programs.filter(program =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.agency.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return 'Not specified'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount)
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/admin"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Funding Programs</h1>
              <p className="mt-2 text-gray-600">
                Manage funding programs and their configurations
              </p>
            </div>
            <div>
              <Link
                href="/admin/funding-programs/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Create New Program
              </Link>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="max-w-md">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Programs
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by program name or agency..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
            />
          </div>
        </div>

        {/* Programs List */}
        {filteredPrograms.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No funding programs found</h3>
            <p className="mt-2 text-sm text-gray-500">
              {programs.length === 0 
                ? "Get started by creating your first funding program."
                : "Try adjusting your search criteria."
              }
            </p>
            {programs.length === 0 && (
              <div className="mt-6">
                <Link
                  href="/admin/funding-programs/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create First Program
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredPrograms.map((program) => (
              <div key={program.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {program.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {program.agency.name}
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {program.description}
                      </p>
                    </div>
                    <div className={`ml-4 px-2 py-1 text-xs font-medium rounded-full ${
                      program.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {program.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {/* Budget Range */}
                    <div className="flex items-center text-sm text-gray-600">
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      <span>
                        {program.minAmount || program.maxAmount ? (
                          `${formatCurrency(program.minAmount, program.currency)} - ${formatCurrency(program.maxAmount, program.currency)}`
                        ) : (
                          'No budget limits'
                        )}
                      </span>
                    </div>

                    {/* Duration */}
                    {program.maxDuration && (
                      <div className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span>Max {program.maxDuration} months</span>
                      </div>
                    )}

                    {/* Program Officer */}
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">Officer:</span>
                      <span className="ml-1">{program.programOfficer.name}</span>
                    </div>

                    {/* Calls Count */}
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">Active Calls:</span>
                      <span className="ml-1">{program._count.calls}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-end space-x-2">
                    <Link
                      href={`/admin/funding-programs/${program.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/admin/funding-programs/${program.id}/edit`}
                      className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
