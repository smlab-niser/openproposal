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

    const configurations = await prisma.budgetConfiguration.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(configurations)
  } catch (error) {
    console.error('Error fetching budget configurations:', error)
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

    const { name, description, heads } = await request.json()

    const configuration = await prisma.budgetConfiguration.create({
      data: {
        name,
        description,
        createdById: user.id,
        heads: heads ? {
          connect: heads.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        heads: true
      }
    })

    return NextResponse.json(configuration, { status: 201 })
  } catch (error) {
    console.error('Error creating budget configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
