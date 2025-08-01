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
      ['SYSTEM_ADMIN', 'INSTITUTIONAL_ADMIN', 'PROGRAM_OFFICER'].includes(role)
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Fetch funding programs
    const fundingPrograms = await prisma.fundingProgram.findMany({
      include: {
        agency: {
          select: {
            id: true,
            name: true
          }
        },
        programOfficer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            calls: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(fundingPrograms)

  } catch (error) {
    console.error('Error fetching funding programs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Insufficient permissions to create funding programs' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { 
      name, 
      description, 
      agencyId, 
      programOfficerId,
      minAmount,
      maxAmount,
      currency,
      maxDuration,
      objectives,
      eligibilityRules
    } = body

    // Validate required fields
    if (!name || !agencyId || !programOfficerId) {
      return NextResponse.json(
        { error: 'Name, agency, and program officer are required' },
        { status: 400 }
      )
    }

    // Validate agency exists
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId }
    })

    if (!agency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      )
    }

    // Validate program officer exists
    const programOfficer = await prisma.user.findUnique({
      where: { id: programOfficerId }
    })

    if (!programOfficer) {
      return NextResponse.json(
        { error: 'Program officer not found' },
        { status: 404 }
      )
    }

    // Create the funding program
    const fundingProgram = await prisma.fundingProgram.create({
      data: {
        name,
        description: description || '',
        agencyId,
        programOfficerId,
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
        currency: currency || 'INR',
        maxDuration: maxDuration ? parseInt(maxDuration) : null,
        objectives: objectives || null,
        eligibilityRules: eligibilityRules || null
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(fundingProgram, { status: 201 })

  } catch (error) {
    console.error('Error creating funding program:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
