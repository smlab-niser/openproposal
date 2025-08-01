import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { emailService, generateCallCreatedEmail, getCallNotificationRecipients } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Check if request is from admin
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    let isAdmin = false
    
    if (token) {
      const userPayload = verifyToken(token)
      if (userPayload) {
        const user = await prisma.user.findUnique({
          where: { id: userPayload.id }
        })
        const userRoles = user?.roles ? JSON.parse(user.roles) : []
        isAdmin = userRoles.includes('SYSTEM_ADMIN') || userRoles.includes('INSTITUTIONAL_ADMIN') || userRoles.includes('PROGRAM_OFFICER')
      }
    }

    const where: Record<string, unknown> = isAdmin ? {} : { isPublic: true }

    if (status) {
      where.status = status
    }

    const selectFields: any = {
      id: true,
      title: true,
      description: true,
      status: true,
      openDate: true,
      closeDate: true,
      intentDeadline: true,
      fullProposalDeadline: true,
      reviewDeadline: true,
      expectedAwards: true,
      totalBudget: true,
      currency: true,
      allowResubmissions: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
      fundingProgram: {
        select: {
          name: true,
          description: true,
          maxAmount: true,
          currency: true,
          agency: {
            select: {
              name: true,
              website: true
            }
          }
        }
      },
      _count: {
        select: {
          proposals: true
        }
      }
    }
    
    // Add reviewVisibility only for admin users
    if (isAdmin) {
      selectFields.reviewVisibility = true
    }

    const calls = await prisma.callForProposal.findMany({
      where,
      select: selectFields,
      orderBy: {
        closeDate: 'asc'
      },
      skip: offset,
      take: limit
    })

    const total = await prisma.callForProposal.count({ where })

    // For admin requests, return calls directly. For public, wrap in pagination
    if (isAdmin) {
      return NextResponse.json(calls)
    }

    return NextResponse.json({
      calls,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching calls:', error)
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
      ['SYSTEM_ADMIN', 'INSTITUTIONAL_ADMIN', 'PROGRAM_OFFICER'].includes(role)
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const {
      title,
      description,
      fundingProgramId,
      openDate,
      closeDate,
      intentDeadline,
      fullProposalDeadline,
      reviewDeadline,
      totalBudget,
      currency,
      reviewVisibility,
      isPublic,
      status
    } = body

    // Validate required fields
    if (!title || !description || !fundingProgramId) {
      return NextResponse.json(
        { error: 'Title, description, and funding program are required' },
        { status: 400 }
      )
    }

    // Validate funding program exists
    const fundingProgram = await prisma.fundingProgram.findUnique({
      where: { id: fundingProgramId }
    })

    if (!fundingProgram) {
      return NextResponse.json(
        { error: 'Funding program not found' },
        { status: 404 }
      )
    }

    // Create the funding call
    const fundingCall = await prisma.callForProposal.create({
      data: {
        title,
        description,
        fundingProgramId,
        openDate: openDate ? new Date(openDate) : null,
        closeDate: closeDate ? new Date(closeDate) : null,
        intentDeadline: intentDeadline ? new Date(intentDeadline) : null,
        fullProposalDeadline: fullProposalDeadline ? new Date(fullProposalDeadline) : null,
        reviewDeadline: reviewDeadline ? new Date(reviewDeadline) : null,
        totalBudget: totalBudget ? parseFloat(totalBudget) : null,
        currency: currency || 'INR',
        reviewVisibility: reviewVisibility || 'PRIVATE',
        isPublic: isPublic ?? true,
        status: status || 'DRAFT',
        createdById: user.id
      },
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

    // Send email notifications in the background (don't wait for them)
    try {
      const recipients = await getCallNotificationRecipients(fundingCall.id)
      if (recipients.length > 0) {
        await emailService.sendCallCreatedNotification(
          recipients,
          fundingCall.title,
          fundingCall.description,
          fundingCall.fundingProgram.name,
          fundingCall.fundingProgram.agency.name
        )
      }
    } catch (emailError) {
      // Log email error but don't fail the API call
      console.error('Error sending call creation notifications:', emailError)
    }

    return NextResponse.json(fundingCall, { status: 201 })

  } catch (error) {
    console.error('Error creating funding call:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
