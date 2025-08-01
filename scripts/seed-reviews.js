const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Load environment variables from .env.local first
require('dotenv').config({ path: '.env.local', override: true })

const prisma = new PrismaClient()

async function seedReviewData() {
  console.log('Creating sample review data...')

  try {
    // First, check if we have existing proposals
    const existingProposals = await prisma.proposal.findMany({
      include: {
        principalInvestigator: true,
        call: true
      }
    })

    if (existingProposals.length === 0) {
      console.log('No proposals found. Please create a proposal first through the UI.')
      return
    }

    console.log(`Found ${existingProposals.length} existing proposals`)

    // Create a reviewer user
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const reviewer = await prisma.user.upsert({
      where: { email: 'reviewer@test.com' },
      update: {
        roles: ['REVIEWER'] // Make sure they have the reviewer role
      },
      create: {
        email: 'reviewer@test.com',
        password: hashedPassword,
        name: 'Dr. Jane Reviewer',
        firstName: 'Jane',
        lastName: 'Reviewer',
        roles: ['REVIEWER']
      }
    })

    console.log('Created/updated reviewer:', reviewer.email)

    // Get the first proposal
    const proposal = existingProposals[0]
    console.log('Using proposal:', proposal.title)

    // Create a review assignment for this proposal
    const reviewAssignment = await prisma.reviewAssignment.upsert({
      where: {
        proposalId_reviewerId: {
          proposalId: proposal.id,
          reviewerId: reviewer.id
        }
      },
      update: {
        status: 'COMPLETED'
      },
      create: {
        proposalId: proposal.id,
        reviewerId: reviewer.id,
        status: 'COMPLETED',
        assignedAt: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    })

    console.log('Created review assignment:', reviewAssignment.id)

    // Create a review with detailed scores
    const review = await prisma.review.upsert({
      where: { assignmentId: reviewAssignment.id },
      update: {
        overallScore: 8.5,
        commentsToAuthors: 'This is an excellent proposal with strong scientific merit. The methodology is well-designed and the expected outcomes are realistic. The budget is appropriate for the scope of work. I recommend funding this project with minor revisions to address the timeline concerns.',
        submittedAt: new Date(),
        isComplete: true
      },
      create: {
        assignmentId: reviewAssignment.id,
        proposalId: proposal.id,
        reviewerId: reviewer.id,
        overallScore: 8.5,
        commentsToAuthors: 'This is an excellent proposal with strong scientific merit. The methodology is well-designed and the expected outcomes are realistic. The budget is appropriate for the scope of work. I recommend funding this project with minor revisions to address the timeline concerns.',
        submittedAt: new Date(),
        isComplete: true
      }
    })

    console.log('Created review:', review.id)
    console.log('Review assignment ID to test with:', reviewAssignment.id)
    console.log('You can now test the review detail page at: /reviews/' + reviewAssignment.id)

  } catch (error) {
    console.error('Error seeding review data:', error)
  }
}

seedReviewData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
