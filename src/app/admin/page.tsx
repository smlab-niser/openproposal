'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getApiUrl } from '@/lib/utils'
import { 
  CogIcon,
  UserGroupIcon,
  FolderIcon,
  CalendarIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
          // Check if user has admin privileges
          if (!userData.roles.some((role: any) => 
            role.role === 'SYSTEM_ADMIN' || role.role === 'INSTITUTIONAL_ADMIN'
          )) {
            router.push('/dashboard')
            return
          }
          setUser(userData)
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

  const adminSections = [
    {
      name: 'Funding Calls Management',
      description: 'Manage funding calls, deadlines, and review processes',
      href: '/admin/calls',
      icon: CalendarIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Budget Configurations',
      description: 'Manage budget templates, salary structures, and budget heads',
      href: '/admin/budget-config',
      icon: CogIcon,
      color: 'bg-emerald-500'
    },
    {
      name: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      href: '/admin/users',
      icon: UserGroupIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Funding Programs',
      description: 'Manage funding programs and eligibility criteria',
      href: '/admin/programs',
      icon: FolderIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'Review Management',
      description: 'Manage review assignments and deadlines',
      href: '/admin/reviews',
      icon: AdjustmentsHorizontalIcon,
      color: 'bg-orange-500'
    },
    {
      name: 'Public Venues',
      description: 'Manage public visibility of funding calls and results',
      href: '/admin/public-venues',
      icon: GlobeAltIcon,
      color: 'bg-cyan-500'
    },
    {
      name: 'System Analytics',
      description: 'View system-wide analytics and reports',
      href: '/admin/analytics',
      icon: ChartBarIcon,
      color: 'bg-indigo-500'
    },
    {
      name: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      href: '/admin/settings',
      icon: CogIcon,
      color: 'bg-gray-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administration Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage system settings, users, and funding programs
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Active Calls</div>
                <div className="text-2xl font-bold text-gray-900">12</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Users</div>
                <div className="text-2xl font-bold text-gray-900">2,847</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Pending Reviews</div>
                <div className="text-2xl font-bold text-gray-900">156</div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => (
            <Link
              key={section.name}
              href={section.href}
              className="relative group bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div>
                <span className={`rounded-lg inline-flex p-3 ${section.color} text-white`}>
                  <section.icon className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                  {section.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {section.description}
                </p>
              </div>
              <span
                className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                aria-hidden="true"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="m11.293 17.293 1.414 1.414L19.414 12l-6.707-6.707-1.414 1.414L15.586 11H6v2h9.586l-4.293 4.293z" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        {/* Recent Activities */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Administrative Activities</h3>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Funding Call "AI Research 2025" deadline updated
                    </p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      New reviewer assigned to "Climate Change Studies"
                    </p>
                    <p className="text-sm text-gray-500">4 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Review criteria updated for "Medical Research Program"
                    </p>
                    <p className="text-sm text-gray-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
