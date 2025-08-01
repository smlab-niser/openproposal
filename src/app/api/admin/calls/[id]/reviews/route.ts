import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const userPayload = verifyToken(token)
    if (!userPayload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user has admin privileges
    const user = await prisma.user.findUnique({
      where: { id: userPayload.id }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const userRoles = user.roles ? JSON.parse(user.roles) : []
    const hasAdminRole = userRoles.includes('SYSTEM_ADMIN') || userRoles.includes('INSTITUTIONAL_ADMIN') || userRoles.includes('PROGRAM_OFFICER')
    
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body // 'release' or 'hide'

    // Update the funding call to control review visibility
    const updatedCall = await prisma.callForProposal.update({
      where: { id },
      data: {
        reviewVisibility: action === 'release' ? 'PRIVATE_TO_AUTHORS' : 'PRIVATE',
        updatedAt: new Date()
      }
    })

    // Log the change for audit purposes
    await prisma.auditLog.create({
      data: {
        action: `${action.toUpperCase()}_REVIEWS`,
        entityType: 'CallForProposal',
        entityId: id,
        userId: user.id,
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      message: `Reviews ${action === 'release' ? 'released' : 'hidden'} successfully`,
      call: updatedCall
    })

  } catch (error) {
    console.error('Error updating review visibility:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
