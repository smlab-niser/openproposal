import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PUT(
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
    const hasAdminRole = userRoles.includes('SYSTEM_ADMIN') || userRoles.includes('INSTITUTIONAL_ADMIN')
    
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      openDate, 
      closeDate, 
      intentDeadline, 
      fullProposalDeadline, 
      reviewDeadline 
    } = body

    // Update the funding call deadlines
    const updatedCall = await prisma.callForProposal.update({
      where: { id },
      data: {
        openDate: openDate ? new Date(openDate) : null,
        closeDate: closeDate ? new Date(closeDate) : null,
        intentDeadline: intentDeadline ? new Date(intentDeadline) : null,
        fullProposalDeadline: fullProposalDeadline ? new Date(fullProposalDeadline) : null,
        reviewDeadline: reviewDeadline ? new Date(reviewDeadline) : null,
        updatedAt: new Date()
      }
    })

    // Log the change for audit purposes
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_CALL_DEADLINES',
        entityType: 'CallForProposal',
        entityId: id,
        userId: user.id,
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      message: 'Deadlines updated successfully',
      call: updatedCall
    })

  } catch (error) {
    console.error('Error updating call deadlines:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
