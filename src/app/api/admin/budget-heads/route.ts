import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user?.roles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const userRoles = JSON.parse(user.roles)
    if (!userRoles.includes('SYSTEM_ADMIN') && !userRoles.includes('INSTITUTIONAL_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const budgetHeads = await prisma.budgetHead.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json(budgetHeads)
  } catch (error) {
    console.error('Error fetching budget heads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user?.roles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const userRoles = JSON.parse(user.roles)
    if (!userRoles.includes('SYSTEM_ADMIN') && !userRoles.includes('INSTITUTIONAL_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, code, type, isRecurring, description, sortOrder } = await request.json()

    const budgetHead = await prisma.budgetHead.create({
      data: {
        name,
        code,
        type,
        isRecurring: isRecurring ?? true,
        description,
        sortOrder: sortOrder ?? 0
      }
    })

    return NextResponse.json(budgetHead, { status: 201 })
  } catch (error) {
    console.error('Error creating budget head:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
