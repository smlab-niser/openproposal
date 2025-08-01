'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  BanknotesIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { getApiUrl } from '@/lib/utils'

interface BudgetItem {
  id: string
  category: string
  description: string
  year: number
  amount: number
  justification: string
}

interface BudgetValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

interface BudgetData {
  proposalId: string
  currency: string
  totalBudget: number
  years: number
  items: BudgetItem[]
  validation: BudgetValidation
}

export default function BudgetManagementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading budget management...</p>
      </div>
    </div>}>
      <BudgetContent />
    </Suspense>
  )
}

function BudgetContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const proposalId = searchParams.get('proposalId')
  
  const [budget, setBudget] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [newItem, setNewItem] = useState<Partial<BudgetItem>>({
    category: 'PERSONNEL',
    description: '',
    year: 1,
    amount: undefined,
    justification: ''
  })

  const categories = [
    'PERSONNEL',
    'EQUIPMENT',
    'SUPPLIES',
    'TRAVEL',
    'SUBCONTRACTS',
    'INDIRECT_COSTS',
    'OTHER'
  ]

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) {
          router.push('/login')
          return
        }

        if (!proposalId) {
          setBudget(null)
          setLoading(false)
          return
        }

        // Fetch budget data from API
        const response = await fetch(getApiUrl(`/api/proposals/${proposalId}/budget`), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const budgetData = await response.json()
          setBudget(budgetData)
        } else if (response.status === 404) {
          // Proposal not found, redirect to proposals list
          router.push('/proposals')
          return
        } else if (response.status === 401) {
          // Unauthorized, redirect to login
          router.push('/login')
          return
        } else {
          console.error('Failed to fetch budget data')
          setBudget(null)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching budget:', error)
        setLoading(false)
      }
    }

    fetchBudget()
  }, [router, proposalId])

  const handleAddItem = async () => {
    if (!budget || !newItem.description || newItem.amount === undefined || newItem.amount === null) return

    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(getApiUrl(`/api/proposals/${budget.proposalId}/budget`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: newItem.category || 'OTHER',
          subcategory: '',
          description: newItem.description,
          year: newItem.year || 1,
          amount: newItem.amount,
          justification: newItem.justification || ''
        })
      })

      if (response.ok) {
        const addedItem = await response.json()
        
        // Add the new item to local state
        const item: BudgetItem = {
          id: addedItem.id,
          category: newItem.category || 'OTHER',
          description: newItem.description,
          year: newItem.year || 1,
          amount: newItem.amount,
          justification: newItem.justification || ''
        }

        setBudget({
          ...budget,
          items: [...budget.items, item]
        })

        setNewItem({
          category: 'PERSONNEL',
          description: '',
          year: 1,
          amount: undefined,
          justification: ''
        })
      } else {
        console.error('Failed to add budget item')
      }
    } catch (error) {
      console.error('Error adding budget item:', error)
    }
  }

  const handleUpdateItem = (id: string, updates: Partial<BudgetItem>) => {
    if (!budget) return

    setBudget({
      ...budget,
      items: budget.items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    })
  }

  const handleDeleteItem = (id: string) => {
    if (!budget) return

    setBudget({
      ...budget,
      items: budget.items.filter(item => item.id !== id)
    })
  }

  const handleSave = async () => {
    if (!budget) return

    setSaving(true)
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(getApiUrl(`/api/proposals/${budget.proposalId}/budget`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: budget.items
        })
      })

      if (response.ok) {
        // Successfully saved
      } else {
        console.error('Failed to save budget')
      }
      setSaving(false)
    } catch (error) {
      console.error('Error saving budget:', error)
      setSaving(false)
    }
  }

  const getTotalByCategory = (category: string) => {
    if (!budget) return 0
    return budget.items
      .filter(item => item.category === category)
      .reduce((sum, item) => sum + item.amount, 0)
  }

  const getTotalByYear = (year: number) => {
    if (!budget) return 0
    return budget.items
      .filter(item => item.year === year)
      .reduce((sum, item) => sum + item.amount, 0)
  }

  const getCurrentTotal = () => {
    if (!budget) return 0
    return budget.items.reduce((sum, item) => sum + item.amount, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading budget details...</p>
        </div>
      </div>
    )
  }

  if (!budget) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BanknotesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Budget Not Found</h2>
          <p className="text-gray-600">Unable to load budget information for this proposal.</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    const displayCurrency = budget.currency === 'USD' ? 'INR' : budget.currency
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Advanced Budget Management</h1>
              <p className="mt-2 text-gray-600">
                Detailed budget breakdown and multi-year planning for your research proposal.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Proposal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Budget'}
              </button>
            </div>
          </div>
        </div>

        {/* Budget Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BanknotesIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Current Total</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(getCurrentTotal())}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Budget Limit</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(budget.totalBudget)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Project Duration</p>
                <p className="text-2xl font-semibold text-gray-900">{budget.years} Years</p>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Messages */}
        {(budget.validation.errors.length > 0 || budget.validation.warnings.length > 0) && (
          <div className="mb-6 space-y-3">
            {budget.validation.errors.map((error, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            ))}
            {budget.validation.warnings.map((warning, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">{warning}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budget Items */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Budget Items</h3>
              </div>

              <div className="p-6">
                {/* Add New Item Form */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Add New Budget Item</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={newItem.category || ''}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                      <select
                        value={newItem.year || 1}
                        onChange={(e) => setNewItem({ ...newItem, year: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      >
                        {Array.from({ length: budget.years }, (_, i) => i + 1).map(year => (
                          <option key={year} value={year}>Year {year}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                      <input
                        type="number"
                        value={newItem.amount ?? ''}
                        onChange={(e) => setNewItem({ ...newItem, amount: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={newItem.description || ''}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of the budget item"
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Justification</label>
                    <textarea
                      value={newItem.justification || ''}
                      onChange={(e) => setNewItem({ ...newItem, justification: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Justification for this expense"
                    />
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleAddItem}
                      disabled={!newItem.description || !newItem.amount}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Budget Items List */}
                <div className="space-y-4">
                  {budget.items.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      {editingItem === item.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <select
                                value={item.category}
                                onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                              >
                                {categories.map(category => (
                                  <option key={category} value={category}>{category}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <select
                                value={item.year}
                                onChange={(e) => handleUpdateItem(item.id, { year: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                              >
                                {Array.from({ length: budget.years }, (_, i) => i + 1).map(year => (
                                  <option key={year} value={year}>Year {year}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <input
                                type="number"
                                value={item.amount || ''}
                                onChange={(e) => handleUpdateItem(item.id, { amount: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter amount"
                              />
                            </div>
                          </div>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <textarea
                            value={item.justification}
                            onChange={(e) => handleUpdateItem(item.id, { justification: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingItem(null)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {item.category}
                              </span>
                              <span className="text-sm text-gray-500">Year {item.year}</span>
                              <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingItem(item.id)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">{item.description}</h4>
                          <p className="text-sm text-gray-600">{item.justification}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Budget Analysis */}
          <div className="space-y-6">
            {/* Category Breakdown */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
              <div className="space-y-3">
                {categories.map(category => {
                  const total = getTotalByCategory(category)
                  const percentage = total > 0 ? (total / getCurrentTotal()) * 100 : 0
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{category}</span>
                        <span className="font-medium">{formatCurrency(total)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Yearly Breakdown */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Yearly Breakdown</h3>
              <div className="space-y-3">
                {Array.from({ length: budget.years }, (_, i) => i + 1).map(year => {
                  const total = getTotalByYear(year)
                  const percentage = total > 0 ? (total / getCurrentTotal()) * 100 : 0
                  return (
                    <div key={year}>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Year {year}</span>
                        <span className="font-medium">{formatCurrency(total)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
