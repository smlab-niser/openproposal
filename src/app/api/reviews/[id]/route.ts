import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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

    const review = await prisma.reviewAssignment.findUnique({
      where: { id },
      include: {
        proposal: {
          include: {
            principalInvestigator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            call: {
              select: {
                id: true,
                title: true,
                closeDate: true,
                fullProposalDeadline: true
              }
            }
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        review: {
          include: {
            scores: {
              include: {
                criteria: true
              }
            }
          }
        }
      }
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Check if user has access to this review
    const hasAccess = 
      review.reviewerId === decoded.id || // Reviewer can see their own review
      review.proposal.principalInvestigatorId === decoded.id || // PI can see reviews of their proposal
      decoded.roles?.includes('PROGRAM_OFFICER' as any) || // Program officers can see all reviews
      decoded.roles?.includes('AREA_CHAIR' as any) // Area chairs can see all reviews

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(review)

  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
