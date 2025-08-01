'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  DocumentTextIcon, 
  UsersIcon, 
  ChartBarIcon,
  BanknotesIcon,
  ClockIcon,
  PlusIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/lib/utils'

interface User {
  id: string
  email: string
  name: string
  roles: string[]
}

interface RecentProposal {
  id: string
  title: string
  status: string
  updatedAt: string
  call?: {
    title: string
  }
}

interface DashboardStats {
  totalProposals: number
  activeReviews: number
  openCalls: number
  pendingActions: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentProposals, setRecentProposals] = useState<RecentProposal[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalProposals: 0,
    activeReviews: 0,
    openCalls: 0,
    pendingActions: 0
  })
  const router = useRouter()

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        // Parse user from token
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({
          id: payload.id,
          email: payload.email,
          name: payload.name,
          roles: payload.roles || []
        })

        // Fetch recent proposals
        const proposalsResponse = await fetch(getApiUrl('/api/proposals'), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (proposalsResponse.ok) {
          const proposals = await proposalsResponse.json()
          setRecentProposals(proposals.slice(0, 5))
          setStats(prev => ({ ...prev, totalProposals: proposals.length }))
        }

        // Fetch other stats
        const callsResponse = await fetch(getApiUrl('/api/calls'), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (callsResponse.ok) {
          const callsData = await callsResponse.json()
          const calls = Array.isArray(callsData) ? callsData : (callsData.calls || [])
          const openCalls = calls.filter((call: any) => call.status === 'OPEN').length
          setStats(prev => ({ ...prev, openCalls }))
        }

        const reviewsResponse = await fetch(getApiUrl('/api/reviews'), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (reviewsResponse.ok) {
          const reviews = await reviewsResponse.json()
          const activeReviews = Array.isArray(reviews) ? reviews.length : 0
          setStats(prev => ({ ...prev, activeReviews }))
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Welcome back, {user?.name || 'User'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Here's what's happening with your research proposals
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              href="/proposals/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              New Proposal
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Proposals
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalProposals}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Reviews
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.activeReviews}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BanknotesIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Open Calls
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.openCalls}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Actions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.pendingActions}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Proposals */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Proposals
              </h3>
              <Link
                href="/proposals"
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                View all proposals
              </Link>
            </div>
          </div>
          <ul className="divide-y divide-gray-200">
            {recentProposals.length === 0 ? (
              <li className="px-4 py-4 text-center text-gray-500">
                No proposals yet. 
                <Link href="/proposals/new" className="text-indigo-600 hover:text-indigo-500 ml-1">
                  Create your first proposal
                </Link>
              </li>
            ) : (
              recentProposals.map((proposal) => (
                <li key={proposal.id}>
                  <Link href={`/proposals/${proposal.id}`} className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {proposal.title}
                          </p>
                          {proposal.call && (
                            <p className="text-sm text-gray-500">
                              {proposal.call.title}
                            </p>
                          )}
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                            {proposal.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                            Updated {new Date(proposal.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Create Proposal</h3>
                  <p className="text-sm text-gray-500">Start a new research proposal</p>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href="/proposals/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BanknotesIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Browse Calls</h3>
                  <p className="text-sm text-gray-500">Find funding opportunities</p>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href="/calls"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                >
                  Explore calls
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">View Analytics</h3>
                  <p className="text-sm text-gray-500">Track your success metrics</p>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href="/analytics"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200"
                >
                  View metrics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
