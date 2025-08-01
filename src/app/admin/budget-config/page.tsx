'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getApiUrl } from '@/lib/utils'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CogIcon
} from '@heroicons/react/24/outline'

interface BudgetConfiguration {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  heads?: BudgetHead[]
}

interface BudgetHead {
  id: string
  name: string
  type: string
  isRecurring: boolean
  maxPercentage?: number
}

interface SalaryStructure {
  id: string
  position: string
  baseSalary: number
  hraPercentage: number
}

export default function BudgetConfigAdmin() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [configs, setConfigs] = useState<BudgetConfiguration[]>([])
  const [budgetHeads, setBudgetHeads] = useState<BudgetHead[]>([])
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([])
  const [activeTab, setActiveTab] = useState<'configs' | 'heads' | 'salaries'>('configs')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const response = await fetch(getApiUrl('/api/auth/verify'), {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const userData = await response.json()
          if (!userData.roles.some((role: any) => 
            role.role === 'SYSTEM_ADMIN' || role.role === 'INSTITUTIONAL_ADMIN'
          )) {
            router.push('/dashboard')
            return
          }
          setUser(userData)
          await loadData()
        } else {
          router.push('/login')
        }
      } catch (error) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      
      // Load budget configurations
      const configsResponse = await fetch(getApiUrl('/api/admin/budget-configurations'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (configsResponse.ok) {
        const configsData = await configsResponse.json()
        setConfigs(configsData)
      }

      // Load budget heads
      const headsResponse = await fetch(getApiUrl('/api/admin/budget-heads'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (headsResponse.ok) {
        const headsData = await headsResponse.json()
        setBudgetHeads(headsData)
      }

      // Load salary structures
      const salariesResponse = await fetch(getApiUrl('/api/admin/salary-structures'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (salariesResponse.ok) {
        const salariesData = await salariesResponse.json()
        setSalaryStructures(salariesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/admin" className="mr-4">
                <ArrowLeftIcon className="h-6 w-6 text-gray-600 hover:text-gray-900" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Budget Configuration Management</h1>
                <p className="text-sm text-gray-600">Manage budget templates, heads, and salary structures</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('configs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'configs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CurrencyDollarIcon className="h-5 w-5 inline mr-2" />
              Budget Configurations
            </button>
            <button
              onClick={() => setActiveTab('heads')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'heads'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CogIcon className="h-5 w-5 inline mr-2" />
              Budget Heads
            </button>
            <button
              onClick={() => setActiveTab('salaries')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'salaries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserGroupIcon className="h-5 w-5 inline mr-2" />
              Salary Structures
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'configs' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Budget Configurations</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Configuration
                </button>
              </div>
              
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {configs.map((config) => (
                    <li key={config.id}>
                      <div className="px-4 py-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {config.name}
                            </h3>
                            {!config.isActive && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{config.description}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {config.heads?.length || 0} budget heads • Created {new Date(config.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {configs.length === 0 && (
                    <li className="px-4 py-12 text-center text-gray-500">
                      No budget configurations found. Create your first configuration to get started.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'heads' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Budget Heads</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Budget Head
                </button>
              </div>
              
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {budgetHeads.map((head) => (
                    <li key={head.id}>
                      <div className="px-4 py-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {head.name}
                            </h3>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              head.type === 'MANPOWER' ? 'bg-blue-100 text-blue-800' :
                              head.type === 'CONSUMABLES' ? 'bg-green-100 text-green-800' :
                              head.type === 'EQUIPMENT' ? 'bg-purple-100 text-purple-800' :
                              head.type === 'CONTINGENCY' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {head.type}
                            </span>
                            {head.isRecurring && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                Recurring
                              </span>
                            )}
                          </div>
                          {head.maxPercentage && (
                            <p className="mt-1 text-sm text-gray-500">
                              Max: {head.maxPercentage}% of total budget
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {budgetHeads.length === 0 && (
                    <li className="px-4 py-12 text-center text-gray-500">
                      No budget heads found. Create budget heads to categorize expenses.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'salaries' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Salary Structures</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Salary Structure
                </button>
              </div>
              
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {salaryStructures.map((salary) => (
                    <li key={salary.id}>
                      <div className="px-4 py-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {salary.position}
                          </h3>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Basic: ₹{salary.baseSalary.toLocaleString()}</span>
                            <span>HRA: {salary.hraPercentage}%</span>
                            <span>Total: ₹{(salary.baseSalary * (1 + salary.hraPercentage / 100)).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {salaryStructures.length === 0 && (
                    <li className="px-4 py-12 text-center text-gray-500">
                      No salary structures found. Create salary structures for different positions.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
