const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding sample data...')

  // Create a reviewer user
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@example.com' },
    update: {},
    create: {
      email: 'reviewer@example.com',
      password: hashedPassword,
      name: 'Dr. Jane Reviewer',
      firstName: 'Jane',
      lastName: 'Reviewer',
      roles: ['REVIEWER']
    }
  })

  // Create a PI user
  const pi = await prisma.user.upsert({
    where: { email: 'pi@example.com' },
    update: {},
    create: {
      email: 'pi@example.com',
      password: hashedPassword,
      name: 'Dr. John PI',
      firstName: 'John',
      lastName: 'PI',
      roles: ['PI']
    }
  })

  // Create an institution
  const institution = await prisma.institution.upsert({
    where: { name: 'University of Example' },
    update: {},
    create: {
      name: 'University of Example',
      country: 'US',
      type: 'UNIVERSITY'
    }
  })

  // Create a funding program
  const fundingProgram = await prisma.fundingProgram.upsert({
    where: { name: 'Example Research Grant' },
    update: {},
    create: {
      name: 'Example Research Grant',
      description: 'A sample funding program for testing',
      objectives: ['Advance scientific knowledge', 'Foster innovation'],
      eligibilityRules: ['Must be affiliated with an accredited institution'],
      maxAmount: 100000,
      currency: 'INR',
      maxDuration: 36,
      programOfficerId: pi.id
    }
  })

  // Create a call for proposals
  const call = await prisma.callForProposal.upsert({
    where: { title: 'Sample Call for Proposals' },
    update: {},
    create: {
      title: 'Sample Call for Proposals',
      description: 'A sample call for testing the review system',
      status: 'OPEN',
      openDate: new Date('2025-01-01'),
      closeDate: new Date('2025-12-31'),
      totalBudget: 1000000,
      currency: 'INR',
      expectedAwards: 10,
      isPublic: true,
      fundingProgramId: fundingProgram.id,
      creatorId: pi.id
    }
  })

  // Create a proposal
  const proposal = await prisma.proposal.create({
    data: {
      title: 'Innovative Research Project',
      abstract: 'This is a sample abstract for testing purposes.',
      description: 'A detailed description of the research project that will advance our understanding of the field.',
      methodology: 'We will use cutting-edge techniques to analyze the data.',
      expectedOutcomes: 'Expected outcomes include groundbreaking discoveries.',
      totalBudget: 75000,
      currency: 'INR',
      principalInvestigatorId: pi.id,
      callId: call.id,
      status: 'UNDER_REVIEW'
    }
  })

  // Create review criteria
  const criterion1 = await prisma.reviewCriteria.create({
    data: {
      name: 'Scientific Merit',
      description: 'Quality of the scientific approach and methodology',
      maxScore: 10,
      weight: 0.4,
      fundingProgramId: fundingProgram.id
    }
  })

  const criterion2 = await prisma.reviewCriteria.create({
    data: {
      name: 'Innovation',
      description: 'Novelty and potential impact of the research',
      maxScore: 10,
      weight: 0.3,
      fundingProgramId: fundingProgram.id
    }
  })

  const criterion3 = await prisma.reviewCriteria.create({
    data: {
      name: 'Feasibility',
      description: 'Likelihood of successful completion',
      maxScore: 10,
      weight: 0.3,
      fundingProgramId: fundingProgram.id
    }
  })

  // Create a review assignment
  const reviewAssignment = await prisma.reviewAssignment.create({
    data: {
      proposalId: proposal.id,
      reviewerId: reviewer.id,
      status: 'COMPLETED',
      assignedAt: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  })

  // Create a review
  const review = await prisma.review.create({
    data: {
      assignmentId: reviewAssignment.id,
      overallScore: 8.5,
      comments: 'This is an excellent proposal with strong scientific merit. The methodology is sound and the expected outcomes are realistic. I recommend funding this project.',
      submittedAt: new Date()
    }
  })

  // Create review scores
  await prisma.reviewScore.createMany({
    data: [
      {
        reviewId: review.id,
        criteriaId: criterion1.id,
        score: 9
      },
      {
        reviewId: review.id,
        criteriaId: criterion2.id,
        score: 8
      },
      {
        reviewId: review.id,
        criteriaId: criterion3.id,
        score: 8
      }
    ]
  })

  console.log('Sample data seeded successfully!')
  console.log(`Review Assignment ID: ${reviewAssignment.id}`)
  console.log(`Review ID: ${review.id}`)
  console.log(`Proposal ID: ${proposal.id}`)
  console.log(`Reviewer ID: ${reviewer.id}`)
  console.log(`PI ID: ${pi.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
