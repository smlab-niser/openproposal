import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userPayload = verifyToken(token)
    if (!userPayload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check user permissions
    const user = await prisma.user.findUnique({
      where: { id: userPayload.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRoles = user.roles ? JSON.parse(user.roles) : []
    const hasPermission = userRoles.some((role: string) => 
      ['SYSTEM_ADMIN', 'INSTITUTIONAL_ADMIN'].includes(role)
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get role filter from query params
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role')

    let whereClause = {}
    if (roleFilter) {
      whereClause = {
        roles: {
          contains: roleFilter
        }
      }
    }

    // Fetch users
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        roles: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Filter by role more precisely if specified
    let filteredUsers = users
    if (roleFilter) {
      filteredUsers = users.filter(user => {
        const userRoles = user.roles ? JSON.parse(user.roles) : []
        return userRoles.includes(roleFilter)
      })
    }

    return NextResponse.json(filteredUsers)

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
