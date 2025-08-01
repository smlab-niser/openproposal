import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import emailService from '@/lib/email'
import { z } from 'zod'

const createReviewSchema = z.object({
  proposalId: z.string(),
  assignmentId: z.string(),
  overallScore: z.number().min(1).max(10),
  summary: z.string().min(1),
  strengths: z.string().min(1),
  weaknesses: z.string().min(1),
  commentsToAuthors: z.string().optional(),
  commentsToCommittee: z.string().optional(),
  budgetComments: z.string().optional(),
  recommendation: z.enum(['ACCEPT', 'MINOR_REVISION', 'MAJOR_REVISION', 'REJECT']),
  scores: z.array(z.object({
    criteriaId: z.string(),
    score: z.number().min(1).max(10),
    comments: z.string().optional()
  }))
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse roles from JSON string
    const userRoles = user.roles ? JSON.parse(user.roles) : []
    if (!userRoles.some((role: string) => ['REVIEWER', 'AREA_CHAIR', 'PROGRAM_OFFICER'].includes(role))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get review assignments for this user
    const reviewAssignments = await prisma.reviewAssignment.findMany({
      where: {
        reviewerId: decoded.id
      },
      include: {
        proposal: {
          select: {
            id: true,
            title: true,
            abstract: true,
            status: true,
            totalBudget: true,
            currency: true,
            submittedAt: true,
            principalInvestigator: {
              select: {
                firstName: true,
                lastName: true,
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
            call: {
              select: {
                title: true,
                closeDate: true
              }
            }
          }
        },
        review: {
          select: {
            id: true,
            overallScore: true,
            summary: true,
            strengths: true,
            weaknesses: true,
            commentsToAuthors: true,
            commentsToCommittee: true,
            recommendation: true,
            isComplete: true,
            submittedAt: true,
            scores: {
              include: {
                criteria: true
              }
            }
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    })

    // Transform the data to match the expected interface
    const reviews = reviewAssignments.map(assignment => ({
      id: assignment.id, // Use assignment ID, not review ID
      overallScore: assignment.review?.overallScore || null,
      summary: assignment.review?.summary || null,
      strengths: assignment.review?.strengths || null,
      weaknesses: assignment.review?.weaknesses || null,
      commentsToAuthors: assignment.review?.commentsToAuthors || null,
      commentsToCommittee: assignment.review?.commentsToCommittee || null,
      recommendation: assignment.review?.recommendation || null,
      isComplete: assignment.review?.isComplete || false,
      submittedAt: assignment.review?.submittedAt || null,
      proposal: assignment.proposal,
      assignment: {
        assignedAt: assignment.assignedAt,
        dueDate: assignment.dueDate
      },
      scores: assignment.review?.scores || []
    }))

    return NextResponse.json(reviews)

  } catch (error) {
    console.error('Error fetching reviews:', error)
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse roles from JSON string
    const userRoles = user.roles ? JSON.parse(user.roles) : []
    if (!userRoles.some((role: string) => ['REVIEWER', 'AREA_CHAIR'].includes(role))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createReviewSchema.parse(body)

    // Check if review assignment exists and belongs to this user
    const assignment = await prisma.reviewAssignment.findFirst({
      where: {
        id: validatedData.assignmentId,
        reviewerId: decoded.id,
        proposalId: validatedData.proposalId
      },
      include: {
        proposal: {
          include: {
            call: {
              select: {
                closeDate: true,
                fullProposalDeadline: true
              }
            }
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Review assignment not found' },
        { status: 404 }
      )
    }

    const now = new Date()
    
    // Check if proposal submission deadline has passed - reviews can only be submitted after this
    const proposalDeadline = assignment.proposal.call?.fullProposalDeadline || assignment.proposal.call?.closeDate
    if (proposalDeadline && now < new Date(proposalDeadline)) {
      return NextResponse.json(
        { error: 'Cannot submit review before proposal submission deadline' },
        { status: 400 }
      )
    }

    // Check review deadline
    if (assignment.dueDate && now > new Date(assignment.dueDate)) {
      return NextResponse.json(
        { error: 'Review submission deadline has passed' },
        { status: 400 }
      )
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        proposalId: validatedData.proposalId,
        reviewerId: decoded.id
      }
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already submitted' },
        { status: 400 }
      )
    }

    // Create the review with scores
    const review = await prisma.review.create({
      data: {
        proposalId: validatedData.proposalId,
        reviewerId: decoded.id,
        assignmentId: validatedData.assignmentId,
        overallScore: validatedData.overallScore,
        summary: validatedData.summary,
        strengths: validatedData.strengths,
        weaknesses: validatedData.weaknesses,
        commentsToAuthors: validatedData.commentsToAuthors,
        commentsToCommittee: validatedData.commentsToCommittee,
        budgetComments: validatedData.budgetComments,
        recommendation: validatedData.recommendation,
        isComplete: true,
        submittedAt: new Date(),
        scores: {
          create: validatedData.scores.map(score => ({
            criteriaId: score.criteriaId,
            score: score.score,
            comments: score.comments
          }))
        }
      },
      include: {
        proposal: {
          select: {
            id: true,
            title: true,
            status: true,
            principalInvestigator: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        reviewer: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        scores: {
          include: {
            criteria: true
          }
        }
      }
    })

    // Send email notification to proposal PI about review submission
    try {
      await emailService.sendReviewSubmitted({
        id: review.id,
        score: review.overallScore ?? undefined,
        comments: review.summary ?? undefined,
        proposal: {
          id: review.proposal.id,
          title: review.proposal.title,
          status: review.proposal.status,
          principalInvestigator: {
            name: `${review.proposal.principalInvestigator.firstName} ${review.proposal.principalInvestigator.lastName}`,
            email: review.proposal.principalInvestigator.email,
            firstName: review.proposal.principalInvestigator.firstName || undefined,
            lastName: review.proposal.principalInvestigator.lastName || undefined
          }
        },
        reviewer: {
          name: `${review.reviewer.firstName} ${review.reviewer.lastName}`,
          email: review.reviewer.email,
          firstName: review.reviewer.firstName || undefined,
          lastName: review.reviewer.lastName || undefined
        }
      })
    } catch (emailError) {
      console.error('Failed to send review submission email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(review, { status: 201 })

  } catch (error) {
    console.error('Error creating review:', error)

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
