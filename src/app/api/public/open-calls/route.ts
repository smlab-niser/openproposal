import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const openCalls = await prisma.callForProposal.findMany({
      where: {
        status: 'OPEN',
        isPublic: true,
        fullProposalDeadline: {
          gte: new Date()
        }
      },
      include: {
        fundingProgram: {
          select: {
            name: true,
            agency: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        fullProposalDeadline: 'asc'
      },
      take: 20
    })

    return NextResponse.json(openCalls)
  } catch (error) {
    console.error('Error fetching open calls:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
