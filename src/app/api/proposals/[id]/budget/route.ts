import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params

    // Get proposal with budget items
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        budgetItems: {
          orderBy: [
            { year: 'asc' },
            { category: 'asc' }
          ]
        },
        call: {
          select: {
            totalBudget: true,
            currency: true
          }
        }
      }
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Check if user has access to this proposal
    if (proposal.principalInvestigatorId !== decoded.id) {
      // Check if user is a collaborator
      const collaboration = await prisma.proposalCollaborator.findFirst({
        where: {
          proposalId: id,
          userId: decoded.id
        }
      })

      if (!collaboration) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Calculate project duration in years
    const durationYears = Math.ceil((proposal.duration || 12) / 12)

    // Format budget data
    const budgetData = {
      proposalId: proposal.id,
      currency: proposal.currency,
      totalBudget: proposal.totalBudget || proposal.call?.totalBudget || 250000,
      years: durationYears,
      items: proposal.budgetItems.map(item => ({
        id: item.id,
        category: item.category,
        subcategory: item.subcategory || '',
        description: item.description,
        year: item.year,
        amount: item.amount,
        justification: item.justification || ''
      })),
      validation: {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[]
      }
    }

    // Add validation logic
    const totalSpent = proposal.budgetItems.reduce((sum, item) => sum + item.amount, 0)
    const budgetLimit = budgetData.totalBudget

    if (totalSpent > budgetLimit) {
      budgetData.validation.errors.push(`Total budget exceeds limit by ${(totalSpent - budgetLimit).toLocaleString()}`)
      budgetData.validation.isValid = false
    } else if (totalSpent > budgetLimit * 0.95) {
      budgetData.validation.warnings.push(`Budget is ${((totalSpent / budgetLimit) * 100).toFixed(1)}% of the limit`)
    }

    return NextResponse.json(budgetData)

  } catch (error) {
    console.error('Error fetching budget data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params
    const { category, subcategory, description, year, amount, justification } = await request.json()

    // Verify proposal access
    const proposal = await prisma.proposal.findUnique({
      where: { id }
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    if (proposal.principalInvestigatorId !== decoded.id) {
      // Check if user is a collaborator
      const collaboration = await prisma.proposalCollaborator.findFirst({
        where: {
          proposalId: id,
          userId: decoded.id
        }
      })

      if (!collaboration) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Create budget item
    const budgetItem = await prisma.budgetItem.create({
      data: {
        proposalId: id,
        category,
        subcategory,
        description,
        year,
        amount,
        justification,
        currency: proposal.currency
      }
    })

    return NextResponse.json(budgetItem, { status: 201 })

  } catch (error) {
    console.error('Error creating budget item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params
    const { items } = await request.json()

    // Verify proposal access
    const proposal = await prisma.proposal.findUnique({
      where: { id }
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    if (proposal.principalInvestigatorId !== decoded.id) {
      // Check if user is a collaborator
      const collaboration = await prisma.proposalCollaborator.findFirst({
        where: {
          proposalId: id,
          userId: decoded.id
        }
      })

      if (!collaboration) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Update budget items (this is a simplified approach - in production you might want more granular updates)
    await prisma.budgetItem.deleteMany({
      where: { proposalId: id }
    })

    if (items && items.length > 0) {
      await prisma.budgetItem.createMany({
        data: items.map((item: any) => ({
          proposalId: id,
          category: item.category,
          subcategory: item.subcategory,
          description: item.description,
          year: item.year,
          amount: item.amount,
          justification: item.justification,
          currency: proposal.currency
        }))
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating budget items:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
