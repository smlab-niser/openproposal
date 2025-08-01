'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/utils'
import { 
  ChartBarIcon,
  TrophyIcon,
  BanknotesIcon,
  DocumentTextIcon,
  UsersIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  successRate: number
  totalProposals: number
  totalFunding: number
  avgProcessingTime: number
  topFundingPrograms: Array<{
    name: string
    proposals: number
    funded: number
    totalAmount: number
  }>
  monthlyStats: Array<{
    month: string
    submitted: number
    approved: number
    rejected: number
  }>
  institutionRankings: Array<{
    name: string
    successRate: number
    totalProposals: number
    totalFunding: number
  }>
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('12months')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch(getApiUrl(`/api/analytics?timeframe=${timeframe}`), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const analyticsData = await response.json()
          setData(analyticsData)
        } else if (response.status === 401) {
          router.push('/login')
        } else if (response.status === 403) {
          setData({
            successRate: 0,
            totalProposals: 0,
            totalFunding: 0,
            avgProcessingTime: 0,
            topFundingPrograms: [],
            monthlyStats: [],
            institutionRankings: []
          })
        } else {
          throw new Error('Failed to fetch analytics data')
        }
        setLoading(false)

      } catch (error) {
        console.error('Error fetching analytics:', error)
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [router, timeframe])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h2>
          <p className="text-gray-600">Unable to load analytics data at this time.</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reporting</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive insights into funding success rates, performance metrics, and institutional rankings.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="mb-6">
          <div className="flex space-x-4">
            {[
              { value: '6months', label: 'Last 6 Months' },
              { value: '12months', label: 'Last 12 Months' },
              { value: '2years', label: 'Last 2 Years' },
              { value: 'all', label: 'All Time' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeframe(option.value)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  timeframe === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrophyIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold text-gray-900">{data.successRate}%</p>
                  <ArrowTrendingUpIcon className="ml-2 h-4 w-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Total Proposals</p>
                <p className="text-2xl font-semibold text-gray-900">{data.totalProposals.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Total Funding</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(data.totalFunding)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Avg Processing Time</p>
                <p className="text-2xl font-semibold text-gray-900">{data.avgProcessingTime} days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h3>
            {data.monthlyStats.length > 0 ? (
              <div className="space-y-4">
                {data.monthlyStats.map((month) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-900 w-8">{month.month}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${month.submitted > 0 ? (month.approved / month.submitted) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex space-x-4 text-sm">
                      <span className="text-gray-600">{month.submitted} submitted</span>
                      <span className="text-green-600">{month.approved} approved</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No monthly data available</p>
              </div>
            )}
          </div>

          {/* Top Funding Programs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Funding Programs</h3>
            {data.topFundingPrograms.length > 0 ? (
              <div className="space-y-4">
                {data.topFundingPrograms.map((program, index) => (
                  <div key={program.name} className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <span className="text-sm font-medium text-gray-900">{program.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">{program.proposals} proposals</span>
                        <span className="text-xs text-green-600">{program.funded} funded</span>
                        <span className="text-xs text-blue-600">{formatCurrency(program.totalAmount)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {program.proposals > 0 ? ((program.funded / program.proposals) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No funding program data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Institution Rankings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Institution Performance Rankings</h3>
          {data.institutionRankings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Institution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Proposals
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Funding
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.institutionRankings.map((institution, index) => (
                    <tr key={`${institution.name}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {institution.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="font-semibold">{institution.successRate}%</span>
                          {institution.successRate > 70 ? (
                            <ArrowTrendingUpIcon className="ml-1 h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowTrendingDownIcon className="ml-1 h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {institution.totalProposals}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(institution.totalFunding)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No institution ranking data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
