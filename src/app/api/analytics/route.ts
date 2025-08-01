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

    // Verify user exists and has admin or program officer permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRoles = user.roles ? JSON.parse(user.roles) : []
    const hasAccess = userRoles.some((role: string) => 
      ['SYSTEM_ADMIN', 'PROGRAM_OFFICER', 'AREA_CHAIR'].includes(role)
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions to access analytics' },
        { status: 403 }
      )
    }

    // Get timeframe from query parameters
    const url = new URL(request.url)
    const timeframe = url.searchParams.get('timeframe') || '12months'

    // Calculate date range based on timeframe
    const now = new Date()
    let startDate: Date
    
    switch (timeframe) {
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        break
      case '2years':
        startDate = new Date(now.getFullYear() - 2, now.getMonth(), 1)
        break
      case 'all':
        startDate = new Date(2020, 0, 1) // Start from 2020
        break
      default: // 12months
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    }

    // Get total proposals and success rate
    const totalProposals = await prisma.proposal.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    })

    const acceptedProposals = await prisma.proposal.count({
      where: {
        status: 'ACCEPTED',
        createdAt: {
          gte: startDate
        }
      }
    })

    const successRate = totalProposals > 0 ? (acceptedProposals / totalProposals) * 100 : 0

    // Get total funding from accepted proposals
    const fundingData = await prisma.proposal.aggregate({
      where: {
        status: 'ACCEPTED',
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        totalBudget: true
      }
    })

    const totalFunding = fundingData._sum.totalBudget || 0

    // Calculate average processing time
    const processedProposals = await prisma.proposal.findMany({
      where: {
        status: { in: ['ACCEPTED', 'REJECTED'] },
        submittedAt: { not: null },
        createdAt: {
          gte: startDate
        }
      },
      select: {
        submittedAt: true,
        updatedAt: true
      }
    })

    let avgProcessingTime = 0
    if (processedProposals.length > 0) {
      const totalDays = processedProposals.reduce((sum, proposal) => {
        if (proposal.submittedAt && proposal.updatedAt) {
          const days = Math.ceil(
            (proposal.updatedAt.getTime() - proposal.submittedAt.getTime()) / (1000 * 60 * 60 * 24)
          )
          return sum + days
        }
        return sum
      }, 0)
      avgProcessingTime = Math.round(totalDays / processedProposals.length)
    }

    // Get top funding programs
    const fundingPrograms = await prisma.fundingProgram.findMany({
      include: {
        calls: {
          include: {
            proposals: {
              where: {
                createdAt: {
                  gte: startDate
                }
              }
            }
          }
        }
      }
    })

    const topFundingPrograms = fundingPrograms.map(program => {
      const allProposals = program.calls.flatMap(call => call.proposals)
      const fundedProposals = allProposals.filter(p => p.status === 'ACCEPTED')
      const totalAmount = fundedProposals.reduce((sum, p) => sum + (p.totalBudget || 0), 0)

      return {
        name: program.name,
        proposals: allProposals.length,
        funded: fundedProposals.length,
        totalAmount
      }
    }).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 4)

    // Get monthly statistics
    const monthlyStats = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const submitted = await prisma.proposal.count({
        where: {
          submittedAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })

      const approved = await prisma.proposal.count({
        where: {
          status: 'ACCEPTED',
          submittedAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })

      const rejected = await prisma.proposal.count({
        where: {
          status: 'REJECTED',
          submittedAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })

      monthlyStats.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        submitted,
        approved,
        rejected
      })
    }

    // Get institution rankings
    const institutions = await prisma.institution.findMany({
      include: {
        proposals: {
          where: {
            createdAt: {
              gte: startDate
            }
          }
        }
      }
    })

    const institutionRankings = institutions.map(institution => {
      const allProposals = institution.proposals
      const acceptedProposals = allProposals.filter((p: { status: string }) => p.status === 'ACCEPTED')
      const successRate = allProposals.length > 0 ? (acceptedProposals.length / allProposals.length) * 100 : 0
      const totalFunding = acceptedProposals.reduce((sum: number, p: { totalBudget: number | null }) => sum + (p.totalBudget || 0), 0)

      return {
        name: institution.name,
        successRate: Math.round(successRate * 10) / 10,
        totalProposals: allProposals.length,
        totalFunding
      }
    }).filter(inst => inst.totalProposals > 0)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10)

    const analyticsData = {
      successRate: Math.round(successRate * 10) / 10,
      totalProposals,
      totalFunding,
      avgProcessingTime,
      topFundingPrograms,
      monthlyStats,
      institutionRankings
    }

    return NextResponse.json(analyticsData)

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
