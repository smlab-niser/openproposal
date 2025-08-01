import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get public funding calls that have results made public
    const publicCalls = await prisma.callForProposal.findMany({
      where: {
        isPublic: true,
        resultsPublic: true
      },
      include: {
        fundingProgram: {
          include: {
            agency: {
              select: {
                name: true,
                website: true
              }
            }
          }
        },
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
                name: true
              }
            },
            institution: {
              select: {
                name: true,
                country: true
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
                }
              }
            }
          }
        },
        _count: {
          select: {
            proposals: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(publicCalls)

  } catch (error) {
    console.error('Error fetching public calls:', error)
    return NextResponse.json(
      { error: 'Failed to fetch public calls' },
      { status: 500 }
    )
  }
}
