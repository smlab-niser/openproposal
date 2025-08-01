const { PrismaClient } = require('@prisma/client')

// Load environment variables from .env.local first
require('dotenv').config({ path: '.env.local', override: true })

const prisma = new PrismaClient()

async function checkUsers() {
  console.log('Checking existing users and review assignments...')

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roles: true
      }
    })
    
    console.log('\n=== USERS ===')
    users.forEach(user => {
      console.log(`ID: ${user.id}`)
      console.log(`Email: ${user.email}`)
      console.log(`Name: ${user.name}`)
      console.log(`Roles: ${user.roles}`)
      console.log('---')
    })

    // Get all review assignments
    const reviewAssignments = await prisma.reviewAssignment.findMany({
      include: {
        reviewer: {
          select: {
            email: true,
            name: true
          }
        },
        proposal: {
          select: {
            title: true
          }
        },
        review: {
          select: {
            id: true,
            isComplete: true,
            overallScore: true
          }
        }
      }
    })
    
    console.log('\n=== REVIEW ASSIGNMENTS ===')
    reviewAssignments.forEach(assignment => {
      console.log(`Assignment ID: ${assignment.id}`)
      console.log(`Reviewer: ${assignment.reviewer.email} (${assignment.reviewer.name})`)
      console.log(`Proposal: ${assignment.proposal.title}`)
      console.log(`Status: ${assignment.status}`)
      console.log(`Review Complete: ${assignment.review?.isComplete || false}`)
      console.log(`Score: ${assignment.review?.overallScore || 'N/A'}`)
      console.log('---')
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

checkUsers()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
