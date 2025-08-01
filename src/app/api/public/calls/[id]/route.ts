import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const call = await prisma.callForProposal.findUnique({
      where: { 
        id,
        isPublic: true,
        resultsPublic: true
      },
      include: {
        fundingProgram: {
          include: {
            agency: true,
            reviewCriteria: true
          }
        },
        requiredDocuments: true,
        proposals: {
          where: {
            status: {
              in: ['ACCEPTED', 'REJECTED', 'WITHDRAWN']
            }
          },
          include: {
            principalInvestigator: {
              select: {
                firstName: true,
                lastName: true,
                name: true,
                orcid: true
              }
            },
            institution: {
              select: {
                name: true,
                country: true,
                website: true
              }
            },
            reviews: {
              where: {
                isComplete: true
              },
              include: {
                reviewer: {
                  select: {
                    firstName: true,
                    lastName: true,
                    name: true
                  }
                },
                scores: {
                  include: {
                    criteria: true
                  }
                }
              }
            },
            collaborators: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!call) {
      return NextResponse.json(
        { error: 'Public call not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(call)

  } catch (error) {
    console.error('Error fetching public call:', error)
    return NextResponse.json(
      { error: 'Failed to fetch public call' },
      { status: 500 }
    )
  }
}
