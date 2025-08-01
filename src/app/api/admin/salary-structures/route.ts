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

    const salaryStructures = await prisma.salaryStructure.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' }
    })

    return NextResponse.json(salaryStructures)
  } catch (error) {
    console.error('Error fetching salary structures:', error)
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

    const { position, baseSalary, hraPercentage, description, budgetHeadId } = await request.json()

    const salaryStructure = await prisma.salaryStructure.create({
      data: {
        position,
        baseSalary,
        hraPercentage,
        budgetHeadId
      }
    })

    return NextResponse.json(salaryStructure, { status: 201 })
  } catch (error) {
    console.error('Error creating salary structure:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
