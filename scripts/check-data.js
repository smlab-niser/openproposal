const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkData() {
  console.log('Checking existing data...')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      roles: true
    }
  })
  console.log('Users:', users)

  const proposals = await prisma.proposal.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      principalInvestigatorId: true
    }
  })
  console.log('Proposals:', proposals)

  const reviewAssignments = await prisma.reviewAssignment.findMany({
    select: {
      id: true,
      status: true,
      proposalId: true,
      reviewerId: true
    }
  })
  console.log('Review Assignments:', reviewAssignments)

  const reviews = await prisma.review.findMany({
    select: {
      id: true,
      assignmentId: true,
      overallScore: true,
      submittedAt: true
    }
  })
  console.log('Reviews:', reviews)
}

checkData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
