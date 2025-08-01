import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import emailService from '@/lib/email'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                 request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: id },
      include: {
        principalInvestigator: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            institutions: {
              include: {
                institution: {
                  select: {
                    name: true,
                    country: true
                  }
                }
              }
            }
          }
        },
        institution: {
          select: {
            name: true,
            country: true,
            website: true
          }
        },
        call: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            openDate: true,
            closeDate: true,
            totalBudget: true,
            currency: true,
            fundingProgram: {
              select: {
                name: true,
                description: true
              }
            }
          }
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
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
            }
          }
        },
        budgetItems: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        documents: {
          orderBy: {
            uploadedAt: 'desc'
          }
        },
        reviews: {
          select: {
            id: true,
            reviewerId: true,
            overallScore: true,
            commentsToAuthors: true,
            strengths: true,
            weaknesses: true,
            recommendation: true,
            isComplete: true,
            submittedAt: true,
            createdAt: true,
            reviewer: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Check if user has access to this proposal
    const hasAccess = 
      proposal.principalInvestigatorId === decoded.id ||
      proposal.collaborators.some(collab => collab.userId === decoded.id) ||
      proposal.reviews.some(review => review.reviewerId === decoded.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(proposal)

  } catch (error) {
    console.error('Error fetching proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                 request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Parse request body
    const updateSchema = z.object({
      status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']).optional(),
      title: z.string().optional(),
      abstract: z.string().optional(),
      description: z.string().optional(),
      methodology: z.string().optional(),
      expectedOutcomes: z.string().optional(),
      totalBudget: z.number().optional(),
      currency: z.string().optional()
    })

    const body = await request.json()
    const updateData = updateSchema.parse(body)

    // Get current proposal to check permissions and old status
    const currentProposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        principalInvestigator: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!currentProposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Check user permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRoles = user.roles ? JSON.parse(user.roles) : []
    const isOwner = currentProposal.principalInvestigatorId === decoded.id
    const isAdmin = userRoles.some((role: string) => ['SYSTEM_ADMIN', 'PROGRAM_OFFICER'].includes(role))

    // Only owners can edit content, admins/program officers can change status
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // If changing status, only admins can do certain transitions
    if (updateData.status && currentProposal.status !== updateData.status) {
      if (!isAdmin && !['DRAFT', 'SUBMITTED'].includes(updateData.status)) {
        return NextResponse.json(
          { error: 'Only administrators can change proposal to this status' },
          { status: 403 }
        )
      }
    }

    // Update the proposal
    const updatedData: any = { ...updateData }
    if (updateData.status === 'SUBMITTED' && currentProposal.status === 'DRAFT') {
      updatedData.submittedAt = new Date()
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: updatedData,
      include: {
        principalInvestigator: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Send email notification for status changes
    if (updateData.status && currentProposal.status !== updateData.status) {
      try {
        await emailService.sendProposalStatusUpdate({
          id: updatedProposal.id,
          title: updatedProposal.title,
          status: updatedProposal.status,
          totalBudget: updatedProposal.totalBudget || undefined,
          currency: updatedProposal.currency,
          submittedAt: updatedProposal.submittedAt || undefined,
          principalInvestigator: {
            name: `${updatedProposal.principalInvestigator.firstName} ${updatedProposal.principalInvestigator.lastName}`,
            email: updatedProposal.principalInvestigator.email,
            firstName: updatedProposal.principalInvestigator.firstName || undefined,
            lastName: updatedProposal.principalInvestigator.lastName || undefined
          }
        })
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(updatedProposal)

  } catch (error) {
    console.error('Error updating proposal:', error)

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
