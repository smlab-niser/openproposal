import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get proposal details - only if it's part of a public call with public results
    const proposal = await prisma.proposal.findFirst({
      where: {
        id,
        call: {
          isPublic: true,
          resultsPublic: true
        }
      },
      include: {
        principalInvestigator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            orcid: true,
            bio: true,
            researchInterests: true,
            expertise: true
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
            fundingProgram: {
              select: {
                name: true,
                description: true,
                agency: {
                  select: {
                    name: true,
                    website: true
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
                name: true,
                orcid: true
              }
            }
          }
        },
        budgetItems: {
          select: {
            id: true,
            category: true,
            description: true,
            amount: true,
            year: true,
            justification: true
          },
          orderBy: [
            { year: 'asc' },
            { category: 'asc' }
          ]
        },
        reviews: {
          where: {
            isComplete: true,
            // Only show public reviews (non-confidential)
            isConfidential: false
          },
          select: {
            id: true,
            overallScore: true,
            summary: true,
            strengths: true,
            weaknesses: true,
            commentsToAuthors: true,
            recommendation: true,
            submittedAt: true,
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
                name: true
              }
            },
            scores: {
              include: {
                criteria: {
                  select: {
                    name: true,
                    description: true,
                    maxScore: true
                  }
                }
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        }
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found or not publicly available' },
        { status: 404 }
      )
    }

    return NextResponse.json(proposal)

  } catch (error) {
    console.error('Error fetching public proposal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proposal details' },
      { status: 500 }
    )
  }
}
