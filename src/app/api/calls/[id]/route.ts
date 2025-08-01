import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const now = new Date()
    
    const call = await prisma.callForProposal.findUnique({
      where: { id },
      include: {
        fundingProgram: {
          include: {
            agency: true,
            programOfficer: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        requiredDocuments: true,
        proposals: {
          include: {
            principalInvestigator: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            // Only include reviews if review deadline is over or results are public
            reviews: {
              include: {
                reviewer: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    // Determine visibility based on deadlines
    const submissionDeadlineOver = call.fullProposalDeadline ? now > call.fullProposalDeadline : false
    const reviewDeadlineOver = call.reviewDeadline ? now > call.reviewDeadline : false
    const resultsPublic = call.resultsPublic

    // Filter proposals based on visibility rules
    let filteredProposals = call.proposals

    // Rule 1: Only show proposals if submission deadline is over
    if (!submissionDeadlineOver) {
      filteredProposals = []
    } else {
      // Filter proposal content based on deadlines
      filteredProposals = call.proposals.map(proposal => {
        // If results are not public yet, don't show reviews
        if (!resultsPublic) {
          return {
            ...proposal,
            reviews: []
          }
        }
        // Results are public - include reviews that are not confidential
        return {
          ...proposal,
          reviews: proposal.reviews.filter(review => !review.isConfidential && review.isComplete)
        }
      })
    }

    return NextResponse.json({
      ...call,
      proposals: filteredProposals,
      // Add deadline status for frontend
      deadlineStatus: {
        submissionDeadlineOver,
        reviewDeadlineOver,
        resultsPublic
      }
    })

  } catch (error) {
    console.error('Error fetching call:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
