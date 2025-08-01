import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import emailService from '@/lib/email'
import { z } from 'zod'

// Schema for draft proposals - more flexible validation
const createDraftProposalSchema = z.object({
  title: z.string().optional().default(''),
  abstract: z.string().optional().default(''),
  keywords: z.array(z.string()).optional().default([]),
  duration: z.number().optional().default(12),
  totalBudget: z.number().min(0, 'Budget must be non-negative').optional().default(0),
  currency: z.string().optional().default('USD'),
  projectDescription: z.string().optional().default(''),
  methodology: z.string().optional().default(''),
  expectedOutcomes: z.string().optional().default(''),
  ethicalConsiderations: z.string().optional().default(''),
  riskAssessment: z.string().optional().default(''),
  status: z.enum(['DRAFT', 'SUBMITTED']).optional().default('DRAFT'),
  callId: z.string().optional()
})

// Schema for submitted proposals - strict validation
const createSubmittedProposalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  abstract: z.string().min(1, 'Abstract is required'),
  keywords: z.array(z.string()).min(1, 'At least one keyword is required'),
  duration: z.number().min(1, 'Duration must be at least 1 month'),
  totalBudget: z.number().min(0, 'Budget must be non-negative'),
  currency: z.string().min(1, 'Currency is required'),
  projectDescription: z.string().min(1, 'Project description is required'),
  methodology: z.string().min(1, 'Methodology is required'),
  expectedOutcomes: z.string().min(1, 'Expected outcomes are required'),
  ethicalConsiderations: z.string().min(1, 'Ethical considerations are required'),
  riskAssessment: z.string().min(1, 'Risk assessment is required'),
  status: z.enum(['DRAFT', 'SUBMITTED']).optional().default('SUBMITTED'),
  callId: z.string().optional()
})

export async function GET(request: NextRequest) {
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

    // Get proposals for the current user
    const proposals = await prisma.proposal.findMany({
      where: {
        OR: [
          { principalInvestigatorId: decoded.id },
          {
            collaborators: {
              some: {
                userId: decoded.id
              }
            }
          }
        ]
      },
      include: {
        call: {
          select: {
            title: true,
            closeDate: true
          }
        },
        collaborators: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            reviews: true,
            budgetItems: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(proposals)

  } catch (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    
    // Use different validation schemas based on proposal status
    const isDraft = body.status === 'DRAFT'
    const validatedData = isDraft 
      ? createDraftProposalSchema.parse(body)
      : createSubmittedProposalSchema.parse(body)

    // Verify user exists and has permission to create proposals
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { institutions: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user can create proposals (PI or Co-PI roles)
    const userRoles = user.roles ? JSON.parse(user.roles) : []
    if (!userRoles.some((role: string) => ['PRINCIPAL_INVESTIGATOR', 'CO_PRINCIPAL_INVESTIGATOR'].includes(role))) {
      return NextResponse.json(
        { error: 'Only Principal Investigators can create proposals' },
        { status: 403 }
      )
    }

    // Get user's primary institution
    const primaryInstitution = user.institutions[0]
    if (!primaryInstitution) {
      return NextResponse.json(
        { error: 'User must be affiliated with an institution' },
        { status: 400 }
      )
    }

    // Get an open call for proposals if callId not provided
    let callId = validatedData.callId
    if (!callId) {
      const openCall = await prisma.callForProposal.findFirst({
        where: { status: 'OPEN' },
        select: { id: true }
      })
      if (!openCall) {
        return NextResponse.json(
          { error: 'No open calls for proposals available' },
          { status: 400 }
        )
      }
      callId = openCall.id
    }

    // Create the proposal
    const proposal = await prisma.proposal.create({
      data: {
        title: validatedData.title,
        abstract: validatedData.abstract,
        description: validatedData.projectDescription,
        methodology: validatedData.methodology,
        expectedOutcomes: validatedData.expectedOutcomes,
        ethicsStatement: validatedData.ethicalConsiderations,
        status: validatedData.status as 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN',
        totalBudget: validatedData.totalBudget,
        currency: validatedData.currency,
        submittedAt: validatedData.status === 'SUBMITTED' ? new Date() : null,
        callId: callId,
        principalInvestigatorId: user.id,
        institutionId: primaryInstitution.institutionId
      },
      include: {
        principalInvestigator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            institutions: {
              include: {
                institution: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        call: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    })

    // Send email notification for submitted proposals
    if (validatedData.status === 'SUBMITTED') {
      try {
        await emailService.sendProposalSubmitted({
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          totalBudget: proposal.totalBudget || undefined,
          currency: proposal.currency,
          submittedAt: proposal.submittedAt || undefined,
          principalInvestigator: {
            name: `${proposal.principalInvestigator.firstName} ${proposal.principalInvestigator.lastName}`,
            email: proposal.principalInvestigator.email,
            firstName: proposal.principalInvestigator.firstName || undefined,
            lastName: proposal.principalInvestigator.lastName || undefined
          }
        })
      } catch (emailError) {
        console.error('Failed to send submission email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(proposal, { status: 201 })

  } catch (error) {
    console.error('Error creating proposal:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
