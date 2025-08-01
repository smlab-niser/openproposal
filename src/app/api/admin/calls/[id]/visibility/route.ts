import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                 request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse roles from JSON string and check admin permissions
    const userRoles = user.roles ? JSON.parse(user.roles) : []
    const hasAdminRole = userRoles.includes('SYSTEM_ADMIN') || 
                        userRoles.includes('INSTITUTIONAL_ADMIN') || 
                        userRoles.includes('PROGRAM_OFFICER')

    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { resultsPublic } = body

    const updatedCall = await prisma.callForProposal.update({
      where: { id },
      data: { resultsPublic },
      include: {
        fundingProgram: {
          include: {
            agency: true
          }
        },
        _count: {
          select: {
            proposals: true
          }
        }
      }
    })

    return NextResponse.json(updatedCall)

  } catch (error) {
    console.error('Error updating call visibility:', error)
    return NextResponse.json(
      { error: 'Failed to update call visibility' },
      { status: 500 }
    )
  }
}
