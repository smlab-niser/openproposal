'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, CalendarIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import { formatDate, formatCurrency, getApiUrl } from '@/lib/utils'

interface PublicResultsCall {
  id: string
  title: string
  description: string
  status: string
  fundingProgram: {
    name: string
    agency: {
      name: string
    }
  }
  proposals: Array<{
    id: string
    title: string
    status: string
    principalInvestigator: {
      firstName: string
      lastName: string
    }
    reviews: Array<{
      id: string
      overallScore: number | null
      reviewer: {
        firstName: string
        lastName: string
        name: string
      }
    }>
  }>
}

function ResultsAnnouncedSection() {
  const [resultsCalls, setResultsCalls] = useState<PublicResultsCall[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResultsCalls = async () => {
      try {
        const response = await fetch(getApiUrl('/api/public/calls'))
        if (response.ok) {
          const calls = await response.json()
          setResultsCalls(calls)
        }
      } catch (error) {
        console.error('Error fetching results calls:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResultsCalls()
  }, [])

  if (loading) {
    return (
      <div className="bg-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading results...</p>
          </div>
        </div>
      </div>
    )
  }

  if (resultsCalls.length === 0) {
    return null // Don't show section if no results available
  }

  return (
    <div className="bg-blue-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Results Announced
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Transparent outcomes from completed funding calls
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
          {resultsCalls.slice(0, 4).map((call) => {
            const acceptedProposals = call.proposals.filter(p => p.status === 'ACCEPTED')
            const rejectedProposals = call.proposals.filter(p => p.status === 'REJECTED')
            
            return (
              <div key={call.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Results Public
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {call.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {call.description}
                  </p>

                  <div className="space-y-4">
                    {/* Accepted Proposals */}
                    {acceptedProposals.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Accepted ({acceptedProposals.length})
                        </h4>
                        <div className="space-y-1">
                          {acceptedProposals.slice(0, 3).map((proposal) => (
                            <div key={proposal.id} className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <Link 
                                    href={`/public/proposals/${proposal.id}`} 
                                    className="font-medium hover:text-green-700 block truncate"
                                  >
                                    {proposal.title}
                                  </Link>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-gray-500">
                                      {proposal.principalInvestigator.firstName} {proposal.principalInvestigator.lastName}
                                    </span>
                                    {proposal.reviews.length > 0 && (
                                      <span className="text-xs text-blue-600">
                                        {proposal.reviews.length} review{proposal.reviews.length !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Link 
                                  href={`/public/proposals/${proposal.id}`}
                                  className="ml-2 text-xs text-green-600 hover:text-green-800 font-medium"
                                >
                                  View →
                                </Link>
                              </div>
                            </div>
                          ))}
                          {acceptedProposals.length > 3 && (
                            <p className="text-xs text-gray-500">
                              +{acceptedProposals.length - 3} more accepted
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rejected Proposals (optional, for transparency) */}
                    {rejectedProposals.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          Not Funded ({rejectedProposals.length})
                        </h4>
                        <div className="space-y-1">
                          {rejectedProposals.slice(0, 2).map((proposal) => (
                            <div key={proposal.id} className="text-sm text-gray-600 bg-red-50 p-2 rounded">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <Link 
                                    href={`/public/proposals/${proposal.id}`} 
                                    className="font-medium hover:text-red-700 block truncate"
                                  >
                                    {proposal.title}
                                  </Link>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-gray-500">
                                      {proposal.principalInvestigator.firstName} {proposal.principalInvestigator.lastName}
                                    </span>
                                    {proposal.reviews.length > 0 && (
                                      <span className="text-xs text-blue-600">
                                        {proposal.reviews.length} review{proposal.reviews.length !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Link 
                                  href={`/public/proposals/${proposal.id}`}
                                  className="ml-2 text-xs text-red-600 hover:text-red-800 font-medium"
                                >
                                  View →
                                </Link>
                              </div>
                            </div>
                          ))}
                          {rejectedProposals.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{rejectedProposals.length - 2} more not funded
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        {call.fundingProgram.agency.name} • {call.fundingProgram.name}
                      </div>
                      <Link 
                        href={`/calls/${call.id}`} 
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {resultsCalls.length > 4 && (
          <div className="mt-8 text-center">
            <Link 
              href="/calls" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 shadow-sm"
            >
              View All Results
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

interface CallForProposal {
  id: string
  title: string
  description: string
  submissionDeadline?: string
  fullProposalDeadline?: string
  totalBudget?: number
  currency: string
  fundingProgram: {
    name: string
    agency: {
      name: string
    }
  }
}

function OpenCallsSection() {
  const [openCalls, setOpenCalls] = useState<CallForProposal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOpenCalls = async () => {
      try {
        const response = await fetch(getApiUrl('/api/public/open-calls'))
        if (response.ok) {
          const calls = await response.json()
          setOpenCalls(calls)
        }
      } catch (error) {
        console.error('Error fetching open calls:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOpenCalls()
  }, [])

  if (loading) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading open calls...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Current Open Calls</h2>
          <p className="mt-4 text-xl text-gray-600">
            Discover funding opportunities available right now
          </p>
        </div>

        {openCalls.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {openCalls.slice(0, 6).map((call) => (
              <div key={call.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {call.title}
                  </h3>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {call.description}
                </p>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>
                      Deadline: {call.fullProposalDeadline ? 
                        formatDate(call.fullProposalDeadline) : 
                        'TBA'
                      }
                    </span>
                  </div>
                  
                  {call.totalBudget && (
                    <div className="flex items-center">
                      <BanknotesIcon className="h-4 w-4 mr-2" />
                      <span>
                        Budget: {formatCurrency(call.totalBudget, call.currency)}
                      </span>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    {call.fundingProgram.agency.name} • {call.fundingProgram.name}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link 
                    href="/register" 
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Register to Apply →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-4 text-gray-600">No open calls available at the moment.</p>
            <p className="text-sm text-gray-500">Check back soon for new funding opportunities!</p>
          </div>
        )}

        {openCalls.length > 6 && (
          <div className="mt-8 text-center">
            <Link 
              href="/register" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Register to See All Calls
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">OpenProposal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Research Funding
              <span className="text-indigo-600"> Made Open</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
              A comprehensive <span className="text-indigo-600"> Open </span> platform for managing research proposals</p>
              {/* platform for submitting, reviewing, and managing research proposals. */}
            
            <div className="mt-10 flex justify-center">
              <Link
                href="/login"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md text-lg font-medium flex items-center"
              >
                Start Your Proposal
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Open Calls Section */}
      <OpenCallsSection />

      {/* Results Announced Section */}
      <ResultsAnnouncedSection />

      {/* Footer */}
      {/* <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-xl font-bold">OpenProposal</h3>
            <p className="mt-2 text-gray-400">
              Streamlining research funding for the global research community
            </p>
          </div>
        </div>
      </footer> */}
    </div>
  )
}
