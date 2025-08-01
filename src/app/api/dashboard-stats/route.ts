import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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

    const startTime = Date.now()

    // Get dashboard statistics
    // When PRISMA_ACCELERATE_URL is set, caching can be added like:
    // prisma.proposal.count({ cacheStrategy: { swr: 300 } })
    
    const [
      totalProposals,
      submittedProposals,
      underReviewProposals,
      acceptedProposals,
      rejectedProposals,
      totalUsers,
      activeCalls,
      pendingReviews
    ] = await Promise.all([
      prisma.proposal.count(),
      prisma.proposal.count({ where: { status: 'SUBMITTED' } }),
      prisma.proposal.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.proposal.count({ where: { status: 'ACCEPTED' } }),
      prisma.proposal.count({ where: { status: 'REJECTED' } }),
      prisma.user.count(),
      prisma.callForProposal.count({
        where: { closeDate: { gte: new Date() } }
      }),
      prisma.reviewAssignment.count({
        where: { review: null }
      })
    ])

    const queryTime = Date.now() - startTime

    // Recent proposals
    const recentProposals = await prisma.proposal.findMany({
      take: 5,
      orderBy: { submittedAt: 'desc' },
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      select: {
        id: true,
        title: true,
        status: true,
        submittedAt: true,
        totalBudget: true,
        currency: true,
        principalInvestigator: {
          select: {
            firstName: true,
            lastName: true,
            institutions: {
              include: {
                institution: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    })

    // Proposal status distribution over time (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const statusTrends = await prisma.proposal.groupBy({
      by: ['status'],
      where: {
        submittedAt: { gte: thirtyDaysAgo }
      },
      _count: {
        status: true
      }
    })

    return NextResponse.json({
      success: true,
      queryTime: `${queryTime}ms`,
      timestamp: new Date().toISOString(),
      accelerateEnabled: !!process.env.PRISMA_ACCELERATE_URL,
      statistics: {
        proposals: {
          total: totalProposals,
          submitted: submittedProposals,
          underReview: underReviewProposals,
          accepted: acceptedProposals,
          rejected: rejectedProposals
        },
        users: {
          total: totalUsers
        },
        calls: {
          active: activeCalls
        },
        reviews: {
          pending: pendingReviews
        }
      },
      recentProposals,
      statusTrends,
      performance: {
        queryTime,
        accelerateEnabled: !!process.env.PRISMA_ACCELERATE_URL
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Example usage:
// GET /api/dashboard-stats - Gets dashboard statistics
// When Prisma Accelerate is enabled, add caching like:
// prisma.proposal.count({ cacheStrategy: { swr: 300 } })
