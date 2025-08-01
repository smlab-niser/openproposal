import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create institutions
  const institution1 = await prisma.institution.create({
    data: {
      name: 'Stanford University',
      type: 'University',
      country: 'United States',
      website: 'https://stanford.edu',
      address: '450 Serra Mall, Stanford, CA 94305'
    }
  })

  const institution2 = await prisma.institution.create({
    data: {
      name: 'Massachusetts Institute of Technology',
      type: 'University',
      country: 'United States',
      website: 'https://mit.edu',
      address: '77 Massachusetts Ave, Cambridge, MA 02139'
    }
  })

  // Create sample users
  const hashedPassword = await hashPassword('password123')
  const adminPassword = await hashPassword('admin123')
  const piPassword = await hashPassword('pi123')
  const reviewerPassword = await hashPassword('reviewer123')
  const officerPassword = await hashPassword('officer123')
  const chairPassword = await hashPassword('chair123')

  // System Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@university.edu' },
    update: {},
    create: {
      email: 'admin@university.edu',
      password: adminPassword,
      name: 'System Administrator',
      firstName: 'System',
      lastName: 'Administrator',
      bio: 'Platform administrator with full system access.',
      roles: JSON.stringify(['SYSTEM_ADMIN'])
    }
  })

  // Principal Investigator
  const johnPI = await prisma.user.upsert({
    where: { email: 'john.pi@university.edu' },
    update: {},
    create: {
      email: 'john.pi@university.edu',
      password: piPassword,
      name: 'Dr. John Principal',
      firstName: 'John',
      lastName: 'Principal',
      orcid: '0000-0000-0000-0003',
      bio: 'Experienced principal investigator in computer science research.',
      researchInterests: JSON.stringify(['Machine Learning', 'Data Science', 'AI']),
      expertise: JSON.stringify(['Research Management', 'Grant Writing']),
      roles: JSON.stringify(['PRINCIPAL_INVESTIGATOR'])
    }
  })

  // Area Chair
  const areaChair = await prisma.user.upsert({
    where: { email: 'chair@mit.edu' },
    update: {},
    create: {
      email: 'chair@mit.edu',
      password: chairPassword,
      name: 'Dr. Area Chair',
      firstName: 'Area',
      lastName: 'Chair',
      orcid: '0000-0000-0000-0004',
      bio: 'Senior researcher and area chair for multiple conferences.',
      researchInterests: JSON.stringify(['Computer Science', 'Research Leadership']),
      expertise: JSON.stringify(['Peer Review', 'Academic Leadership']),
      roles: JSON.stringify(['AREA_CHAIR', 'REVIEWER'])
    }
  })

  // Program Officer
  const programOfficerNSF = await prisma.user.upsert({
    where: { email: 'program.officer@nsf.gov' },
    update: {},
    create: {
      email: 'program.officer@nsf.gov',
      password: officerPassword,
      name: 'Dr. Program Officer',
      firstName: 'Program',
      lastName: 'Officer',
      bio: 'National Science Foundation program officer managing CS research programs.',
      roles: JSON.stringify(['PROGRAM_OFFICER'])
    }
  })

  const user1 = await prisma.user.upsert({
    where: { email: 'jane.smith@stanford.edu' },
    update: {},
    create: {
      email: 'jane.smith@stanford.edu',
      password: hashedPassword,
      name: 'Dr. Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      orcid: '0000-0000-0000-0001',
      bio: 'Computer Science researcher specializing in AI and machine learning.',
      researchInterests: JSON.stringify(['Artificial Intelligence', 'Machine Learning', 'Computer Vision']),
      expertise: JSON.stringify(['Deep Learning', 'Neural Networks', 'Computer Vision']),
      roles: JSON.stringify(['PRINCIPAL_INVESTIGATOR'])
    }
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'john.doe@mit.edu' },
    update: {},
    create: {
      email: 'john.doe@mit.edu',
      password: hashedPassword,
      name: 'Dr. John Doe',
      firstName: 'John',
      lastName: 'Doe',
      orcid: '0000-0000-0000-0002',
      bio: 'Quantum computing researcher with focus on algorithms.',
      researchInterests: JSON.stringify(['Quantum Computing', 'Algorithms', 'Cryptography']),
      expertise: JSON.stringify(['Quantum Algorithms', 'Complexity Theory']),
      roles: JSON.stringify(['PRINCIPAL_INVESTIGATOR'])
    }
  })

  const reviewer1 = await prisma.user.upsert({
    where: { email: 'alice.reviewer@stanford.edu' },
    update: {},
    create: {
      email: 'alice.reviewer@stanford.edu',
      password: reviewerPassword,
      name: 'Dr. Alice Reviewer',
      firstName: 'Alice',
      lastName: 'Reviewer',
      bio: 'Senior researcher and peer reviewer.',
      researchInterests: JSON.stringify(['Computer Science', 'AI Ethics']),
      expertise: JSON.stringify(['Peer Review', 'Research Ethics']),
      roles: JSON.stringify(['REVIEWER', 'AREA_CHAIR'])
    }
  })

  const programOfficer = await prisma.user.upsert({
    where: { email: 'program@nsf.gov' },
    update: {},
    create: {
      email: 'program@nsf.gov',
      password: hashedPassword,
      name: 'NSF Program Officer',
      firstName: 'Program',
      lastName: 'Officer',
      bio: 'National Science Foundation program officer.',
      roles: JSON.stringify(['PROGRAM_OFFICER'])
    }
  })

  // Create user-institution relationships
  await prisma.userInstitution.upsert({
    where: { userId_institutionId: { userId: johnPI.id, institutionId: institution1.id } },
    update: {},
    create: {
      userId: johnPI.id,
      institutionId: institution1.id,
      department: 'Computer Science',
      position: 'Associate Professor',
      isPrimary: true
    }
  })

  await prisma.userInstitution.upsert({
    where: { userId_institutionId: { userId: areaChair.id, institutionId: institution2.id } },
    update: {},
    create: {
      userId: areaChair.id,
      institutionId: institution2.id,
      department: 'Computer Science and Artificial Intelligence Laboratory',
      position: 'Professor',
      isPrimary: true
    }
  })

  await prisma.userInstitution.upsert({
    where: { userId_institutionId: { userId: reviewer1.id, institutionId: institution1.id } },
    update: {},
    create: {
      userId: reviewer1.id,
      institutionId: institution1.id,
      department: 'Computer Science',
      position: 'Senior Research Scientist',
      isPrimary: true
    }
  })

  await prisma.userInstitution.upsert({
    where: { userId_institutionId: { userId: user1.id, institutionId: institution1.id } },
    update: {},
    create: {
      userId: user1.id,
      institutionId: institution1.id,
      department: 'Computer Science',
      position: 'Professor',
      isPrimary: true
    }
  })

  await prisma.userInstitution.upsert({
    where: { userId_institutionId: { userId: user2.id, institutionId: institution2.id } },
    update: {},
    create: {
      userId: user2.id,
      institutionId: institution2.id,
      department: 'Electrical Engineering and Computer Science',
      position: 'Associate Professor',
      isPrimary: true
    }
  })

  // Create agency
  let agency = await prisma.agency.findFirst({
    where: { name: 'National Science Foundation' }
  })

  if (!agency) {
    agency = await prisma.agency.create({
      data: {
        name: 'National Science Foundation',
        country: 'United States',
        website: 'https://nsf.gov',
        description: 'An independent federal agency that supports fundamental research and education across all fields of science and engineering.'
      }
    })
  }

  // Create funding program
  console.log('🔍 Checking for existing funding program...')
  let fundingProgram = await prisma.fundingProgram.findFirst({
    where: { 
      name: 'NSF Computer Science Research Initiative',
      agencyId: agency.id
    }
  })

  if (!fundingProgram) {
    console.log('✨ Creating new funding program...')
    fundingProgram = await prisma.fundingProgram.create({
      data: {
        name: 'NSF Computer Science Research Initiative',
        description: 'Supporting fundamental research in computer science and related fields.',
        objectives: JSON.stringify([
          'Advance fundamental knowledge in computer science',
          'Foster innovation in computing technologies',
          'Support early-career researchers'
        ]),
        eligibilityRules: JSON.stringify([
          'Must be affiliated with a US institution',
          'Principal Investigator must have PhD in relevant field',
          'No more than one submission per year per PI'
        ]),
        minAmount: 50000,
        maxAmount: 500000,
        currency: 'INR',
        maxDuration: 36,
        programOfficerId: programOfficerNSF.id,
        agencyId: agency.id
      }
    })
  } else {
    console.log('♻️ Using existing funding program:', fundingProgram.id)
  }

  // Create review criteria
  await prisma.reviewCriteria.createMany({
    data: [
      {
        name: 'Scientific Merit',
        description: 'Quality and significance of the proposed research',
        weight: 0.4,
        maxScore: 10,
        programId: fundingProgram.id
      },
      {
        name: 'Innovation',
        description: 'Novelty and creativity of the approach',
        weight: 0.3,
        maxScore: 10,
        programId: fundingProgram.id
      },
      {
        name: 'Feasibility',
        description: 'Likelihood of successful completion',
        weight: 0.2,
        maxScore: 10,
        programId: fundingProgram.id
      },
      {
        name: 'Impact',
        description: 'Potential impact on the field and society',
        weight: 0.1,
        maxScore: 10,
        programId: fundingProgram.id
      }
    ]
  })

  // Create call for proposals
  console.log('🔍 Checking for existing call...')
  let call = await prisma.callForProposal.findFirst({
    where: {
      title: 'AI for Climate Change Research - 2025',
      fundingProgramId: fundingProgram.id
    }
  })

  if (!call) {
    console.log('✨ Creating new call for proposals...')
    call = await prisma.callForProposal.create({
      data: {
        title: 'AI for Climate Change Research - 2025',
        description: 'Funding opportunity for AI research addressing climate change challenges.',
        status: 'OPEN',
        openDate: new Date('2025-01-01'),
        closeDate: new Date('2025-12-31'),
        fullProposalDeadline: new Date('2025-11-30'),
        expectedAwards: 15,
        totalBudget: 5000000,
        currency: 'INR',
        reviewVisibility: 'PRIVATE_TO_AUTHORS',
        allowResubmissions: true,
        isPublic: true,
        fundingProgramId: fundingProgram.id,
        createdById: programOfficerNSF.id
      }
    })
  } else {
    console.log('♻️ Using existing call:', call.id)
  }

  // Create required documents for the call
  await prisma.requiredDocument.createMany({
    data: [
      {
        name: 'Project Description',
        description: 'Detailed description of the proposed research (max 15 pages)',
        isRequired: true,
        maxFileSize: 10,
        allowedTypes: JSON.stringify(['pdf', 'doc', 'docx']),
        callId: call.id
      },
      {
        name: 'Budget Justification',
        description: 'Detailed budget breakdown and justification',
        isRequired: true,
        maxFileSize: 5,
        allowedTypes: JSON.stringify(['pdf', 'xlsx', 'xls']),
        callId: call.id
      },
      {
        name: 'CV of Principal Investigator',
        description: 'Curriculum vitae of the PI (max 2 pages)',
        isRequired: true,
        maxFileSize: 2,
        allowedTypes: JSON.stringify(['pdf']),
        callId: call.id
      },
      {
        name: 'Letters of Support',
        description: 'Optional letters of support from collaborators',
        isRequired: false,
        maxFileSize: 5,
        allowedTypes: JSON.stringify(['pdf']),
        callId: call.id
      }
    ]
  })

  // Create sample proposals
  const proposal1 = await prisma.proposal.create({
    data: {
      title: 'Deep Learning for Climate Modeling',
      abstract: 'This project proposes to develop novel deep learning techniques for improving climate model predictions. We will focus on developing transformer-based architectures that can better capture long-term dependencies in climate data.',
      description: 'Climate change is one of the most pressing challenges of our time. Current climate models, while sophisticated, still struggle with accurate long-term predictions due to the complex, non-linear nature of climate systems. This project aims to leverage recent advances in deep learning, particularly transformer architectures, to improve climate model accuracy and reliability.',
      methodology: 'We will use a multi-faceted approach combining historical climate data analysis, novel neural network architectures, and validation against existing climate models.',
      expectedOutcomes: 'Improved climate prediction accuracy by 15-20%, open-source software tools, and 3-5 peer-reviewed publications.',
      timeline: 'Year 1: Data collection and preprocessing. Year 2: Model development and training. Year 3: Validation and publication.',
      ethicsStatement: 'This research poses no ethical concerns as it uses publicly available climate data.',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-15'),
      totalBudget: 350000,
      currency: 'INR',
      principalInvestigatorId: user1.id,
      institutionId: institution1.id,
      callId: call.id
    }
  })

  const proposal2 = await prisma.proposal.create({
    data: {
      title: 'Quantum Algorithms for Optimization Problems',
      abstract: 'Research into quantum algorithms that can solve complex optimization problems more efficiently than classical algorithms.',
      description: 'This project will develop new quantum algorithms for solving NP-hard optimization problems that are relevant to logistics, finance, and resource allocation.',
      status: 'DRAFT',
      totalBudget: 280000,
      currency: 'INR',
      principalInvestigatorId: user2.id,
      institutionId: institution2.id,
      callId: call.id
    }
  })

  // Create additional proposals for more diverse public view
  const proposal3 = await prisma.proposal.create({
    data: {
      title: 'Quantum Machine Learning for Drug Discovery',
      abstract: 'This proposal aims to develop quantum machine learning algorithms for accelerating drug discovery processes, focusing on protein folding prediction and molecular property optimization.',
      description: 'Detailed research plan for quantum-enhanced drug discovery...',
      status: 'UNDER_REVIEW',
      submittedAt: new Date('2025-04-10'),
      principalInvestigatorId: user1.id,
      institutionId: institution1.id,
      callId: call.id,
      version: 1,
      totalBudget: 350000,
      currency: 'INR'
    }
  })

  const proposal4 = await prisma.proposal.create({
    data: {
      title: 'Blockchain-based Transparent Research Funding',
      abstract: 'A novel approach to research funding transparency using blockchain technology and smart contracts to ensure fair distribution and tracking of research funds.',
      description: 'Comprehensive framework for blockchain-based funding...',
      status: 'REJECTED',
      submittedAt: new Date('2025-04-08'),
      principalInvestigatorId: user2.id,
      institutionId: institution2.id,
      callId: call.id,
      version: 1,
      totalBudget: 200000,
      currency: 'INR'
    }
  })

  const proposal5 = await prisma.proposal.create({
    data: {
      title: 'AI-Powered Sustainable Agriculture Solutions',
      abstract: 'Developing AI models for optimizing crop yields while minimizing environmental impact through precision agriculture and resource management.',
      description: 'Advanced AI techniques for sustainable farming...',
      status: 'ACCEPTED',
      submittedAt: new Date('2025-04-12'),
      principalInvestigatorId: user1.id,
      institutionId: institution1.id,
      callId: call.id,
      version: 1,
      totalBudget: 450000,
      currency: 'INR'
    }
  })

  // Add collaborators
  await prisma.proposalCollaborator.create({
    data: {
      proposalId: proposal1.id,
      userId: user2.id,
      role: 'Co-Principal Investigator',
      sections: JSON.stringify(['methodology', 'timeline']),
      canEdit: true,
      canView: true,
      acceptedAt: new Date()
    }
  })

  // Create comprehensive budget items with realistic categories
  await prisma.budgetItem.createMany({
    data: [
      // Proposal 1 - AI Climate Research (Year 1)
      {
        proposalId: proposal1.id,
        category: 'PERSONNEL',
        subcategory: 'Principal Investigator',
        description: 'PI salary (20% effort, 12 months)',
        justification: 'Project leadership, research direction, and coordination',
        year: 1,
        amount: 180000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'PERSONNEL',
        subcategory: 'Co-Investigator',
        description: 'Co-PI salary (15% effort, 12 months)',
        justification: 'Climate modeling expertise and data analysis',
        year: 1,
        amount: 135000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'PERSONNEL',
        subcategory: 'Postdoctoral Fellow',
        description: 'Postdoc researcher (100% effort, 12 months)',
        justification: 'ML algorithm development and climate data processing',
        year: 1,
        amount: 550000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'PERSONNEL',
        subcategory: 'Graduate Student',
        description: 'PhD student stipend (100% effort, 12 months)',
        justification: 'Research assistance and thesis development',
        year: 1,
        amount: 360000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'PERSONNEL',
        subcategory: 'Research Programmer',
        description: 'Software developer (50% effort, 12 months)',
        justification: 'Platform development and system integration',
        year: 1,
        amount: 400000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'EQUIPMENT',
        subcategory: 'Computing Hardware',
        description: 'GPU cluster for ML training (4x A100 GPUs)',
        justification: 'High-performance computing required for training large climate models',
        year: 1,
        amount: 1200000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'EQUIPMENT',
        subcategory: 'Workstations',
        description: 'High-end workstations for team (3 units)',
        justification: 'Development environment for research team',
        year: 1,
        amount: 450000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'EQUIPMENT',
        subcategory: 'Storage Systems',
        description: 'High-capacity storage array (100TB)',
        justification: 'Storage for large climate datasets and model outputs',
        year: 1,
        amount: 300000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'SUPPLIES',
        subcategory: 'Cloud Computing',
        description: 'AWS/Azure credits for additional compute',
        justification: 'Backup computing resources and scalability testing',
        year: 1,
        amount: 150000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'SUPPLIES',
        subcategory: 'Software Licenses',
        description: 'Professional software licenses and tools',
        justification: 'MATLAB, specialized climate modeling software',
        year: 1,
        amount: 75000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'TRAVEL',
        subcategory: 'Conference Travel',
        description: 'International conference attendance (2 conferences)',
        justification: 'Dissemination of research findings at top-tier venues',
        year: 1,
        amount: 180000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'TRAVEL',
        subcategory: 'Collaboration Travel',
        description: 'Travel to partner institutions',
        justification: 'Collaboration with international climate research centers',
        year: 1,
        amount: 120000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'OTHER',
        subcategory: 'Publication Costs',
        description: 'Open access publication fees',
        justification: 'Publishing in high-impact journals with open access',
        year: 1,
        amount: 60000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'OTHER',
        subcategory: 'Communication',
        description: 'High-speed internet and communication tools',
        justification: 'Collaboration tools and data transfer requirements',
        year: 1,
        amount: 30000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'INDIRECT_COSTS',
        subcategory: 'Administrative Overhead',
        description: 'Institutional overhead (30% of direct costs)',
        justification: 'Administrative support and facilities maintenance',
        year: 1,
        amount: 1215000,
        currency: 'INR'
      },

      // Year 2 items for Proposal 1
      {
        proposalId: proposal1.id,
        category: 'PERSONNEL',
        subcategory: 'Principal Investigator',
        description: 'PI salary (20% effort, 12 months)',
        justification: 'Continued project leadership and research direction',
        year: 2,
        amount: 185000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'PERSONNEL',
        subcategory: 'Graduate Student',
        description: 'PhD student stipend (100% effort, 12 months)',
        justification: 'Research assistance and dissertation completion',
        year: 2,
        amount: 370000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'SUPPLIES',
        subcategory: 'Cloud Computing',
        description: 'Extended cloud computing resources',
        justification: 'Large-scale model deployment and testing',
        year: 2,
        amount: 200000,
        currency: 'INR'
      },
      {
        proposalId: proposal1.id,
        category: 'TRAVEL',
        subcategory: 'Conference Travel',
        description: 'Conference presentations and workshops',
        justification: 'Results dissemination and community engagement',
        year: 2,
        amount: 150000,
        currency: 'INR'
      },

      // Sample budget for other proposals
      {
        proposalId: proposal2.id,
        category: 'PERSONNEL',
        subcategory: 'Principal Investigator',
        description: 'PI salary (25% effort, 12 months)',
        justification: 'Healthcare AI research leadership',
        year: 1,
        amount: 225000,
        currency: 'INR'
      },
      {
        proposalId: proposal2.id,
        category: 'EQUIPMENT',
        subcategory: 'Medical Imaging Setup',
        description: 'High-resolution imaging equipment',
        justification: 'Required for medical data collection and analysis',
        year: 1,
        amount: 800000,
        currency: 'INR'
      },
      {
        proposalId: proposal2.id,
        category: 'SUPPLIES',
        subcategory: 'Data Storage',
        description: 'Secure medical data storage solutions',
        justification: 'HIPAA-compliant storage for sensitive medical data',
        year: 1,
        amount: 100000,
        currency: 'INR'
      }
    ]
  })

  // Create review assignments
  const assignment1 = await prisma.reviewAssignment.create({
    data: {
      proposalId: proposal1.id,
      reviewerId: reviewer1.id,
      dueDate: new Date('2025-06-01'),
      status: 'IN_PROGRESS',
      acceptedAt: new Date('2025-03-20')
    }
  })

  // Create additional review assignments
  const reviewAssignment2 = await prisma.reviewAssignment.create({
    data: {
      proposalId: proposal3.id,
      reviewerId: reviewer1.id,
      assignedAt: new Date('2025-04-11'),
      dueDate: new Date('2025-05-11'),
      status: 'COMPLETED'
    }
  })

  const reviewAssignment3 = await prisma.reviewAssignment.create({
    data: {
      proposalId: proposal4.id,
      reviewerId: reviewer1.id,
      assignedAt: new Date('2025-04-09'),
      dueDate: new Date('2025-05-09'),
      status: 'COMPLETED'
    }
  })

  const reviewAssignment4 = await prisma.reviewAssignment.create({
    data: {
      proposalId: proposal5.id,
      reviewerId: reviewer1.id,
      assignedAt: new Date('2025-04-13'),
      dueDate: new Date('2025-05-13'),
      status: 'COMPLETED'
    }
  })

  // Create additional pending review assignments
  const pendingAssignment1 = await prisma.reviewAssignment.create({
    data: {
      proposalId: proposal1.id,
      reviewerId: areaChair.id,
      assignedAt: new Date('2025-04-15'),
      dueDate: new Date('2025-05-15'),
      status: 'PENDING'
    }
  })

  const pendingAssignment2 = await prisma.reviewAssignment.create({
    data: {
      proposalId: proposal2.id,
      reviewerId: areaChair.id,
      assignedAt: new Date('2025-04-16'),
      dueDate: new Date('2025-05-16'),
      status: 'PENDING'
    }
  })

  const pendingAssignment3 = await prisma.reviewAssignment.create({
    data: {
      proposalId: proposal3.id,
      reviewerId: programOfficerNSF.id,
      assignedAt: new Date('2025-04-17'),
      dueDate: new Date('2025-05-17'),
      status: 'IN_PROGRESS'
    }
  })

  // Create reviews for the additional proposals
  await prisma.review.create({
    data: {
      proposalId: proposal3.id,
      reviewerId: reviewer1.id,
      assignmentId: reviewAssignment2.id,
      overallScore: 8,
      summary: 'Innovative approach to drug discovery using quantum computing. The methodology is sound and the potential impact is significant.',
      strengths: 'Novel quantum algorithms, strong theoretical foundation, clear implementation plan.',
      weaknesses: 'Limited access to quantum hardware may pose implementation challenges.',
      commentsToAuthors: 'Consider partnerships with quantum computing companies for hardware access.',
      commentsToCommittee: 'Highly innovative research with potential for breakthrough discoveries.',
      recommendation: 'ACCEPT',
      budgetComments: 'Budget is appropriate for the scope of work.',
      isComplete: true,
      submittedAt: new Date('2025-04-20')
    }
  })

  await prisma.review.create({
    data: {
      proposalId: proposal4.id,
      reviewerId: reviewer1.id,
      assignmentId: reviewAssignment3.id,
      overallScore: 4,
      summary: 'While blockchain technology is interesting, the application to research funding lacks sufficient novelty and technical depth.',
      strengths: 'Addresses important transparency issues in research funding.',
      weaknesses: 'Limited technical innovation, unclear scalability, insufficient evaluation of existing solutions.',
      commentsToAuthors: 'Consider focusing on specific technical challenges rather than general blockchain application.',
      commentsToCommittee: 'Does not meet the bar for innovative research in this call.',
      recommendation: 'REJECT',
      budgetComments: 'Budget allocation does not align with the limited technical contribution.',
      isComplete: true,
      submittedAt: new Date('2025-04-18')
    }
  })

  await prisma.review.create({
    data: {
      proposalId: proposal5.id,
      reviewerId: reviewer1.id,
      assignmentId: reviewAssignment4.id,
      overallScore: 9,
      summary: 'Excellent proposal combining AI with sustainable agriculture. Strong potential for real-world impact and clear methodology.',
      strengths: 'Comprehensive approach, strong team expertise, clear sustainability impact, well-designed evaluation plan.',
      weaknesses: 'Could benefit from more international collaboration partnerships.',
      commentsToAuthors: 'Outstanding work. Consider expanding the geographical scope in future phases.',
      commentsToCommittee: 'Strongly recommend funding. High potential for both scientific and societal impact.',
      recommendation: 'ACCEPT',
      budgetComments: 'Budget is well-justified and appropriate for the ambitious scope.',
      isComplete: true,
      submittedAt: new Date('2025-04-22')
    }
  })

  // Create some incomplete/draft reviews
  await prisma.review.create({
    data: {
      proposalId: proposal1.id,
      reviewerId: areaChair.id,
      assignmentId: pendingAssignment1.id,
      overallScore: 6,
      summary: 'Promising research direction but needs more clarity in methodology.',
      strengths: 'Important research problem, experienced team.',
      weaknesses: 'Methodology section lacks detail, unclear evaluation metrics.',
      commentsToAuthors: '',
      commentsToCommittee: '',
      recommendation: 'MINOR_REVISION',
      budgetComments: '',
      isComplete: false, // Not submitted yet
      submittedAt: null
    }
  })

  await prisma.review.create({
    data: {
      proposalId: proposal2.id,
      reviewerId: areaChair.id,
      assignmentId: pendingAssignment2.id,
      overallScore: null, // Not scored yet
      summary: '',
      strengths: 'Interesting application of blockchain technology.',
      weaknesses: '',
      commentsToAuthors: '',
      commentsToCommittee: '',
      recommendation: null,
      budgetComments: '',
      isComplete: false, // Draft review
      submittedAt: null
    }
  })

  console.log('✅ Database seeded successfully!')

  // Additional calls with different deadline scenarios
  console.log('🕒 Creating calls with different deadline scenarios...')

  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // Scenario 1: Active for submission (all deadlines in future)
  const activeCall = await prisma.callForProposal.create({
    data: {
      title: 'AI Innovation Grant 2025 - Active Submissions',
      description: 'Supporting breakthrough research in artificial intelligence and machine learning. This call is currently accepting submissions.',
      status: 'OPEN',
      openDate: oneWeekAgo,
      closeDate: oneMonthFromNow,
      fullProposalDeadline: oneWeekFromNow,
      reviewDeadline: twoWeeksFromNow,
      expectedAwards: 5,
      totalBudget: 2500000,
      currency: 'INR',
      reviewVisibility: 'PRIVATE',
      allowResubmissions: true,
      isPublic: true,
      resultsPublic: false,
      fundingProgramId: fundingProgram.id,
      createdById: programOfficerNSF.id
    }
  })

  // Scenario 2: Submission deadline over, review deadline active
  const reviewingCall = await prisma.callForProposal.create({
    data: {
      title: 'Quantum Computing Research Fund - Under Review',
      description: 'Advancing quantum computing research capabilities. Submission deadline has passed, currently under peer review.',
      status: 'CLOSED',
      openDate: oneMonthAgo,
      closeDate: oneWeekAgo,
      fullProposalDeadline: oneWeekAgo,
      reviewDeadline: oneWeekFromNow,
      expectedAwards: 3,
      totalBudget: 1500000,
      currency: 'INR',
      reviewVisibility: 'PRIVATE',
      allowResubmissions: false,
      isPublic: true,
      resultsPublic: false,
      fundingProgramId: fundingProgram.id,
      createdById: programOfficerNSF.id
    }
  })

  // Scenario 3: Review deadline over, awaiting program officer decision
  const awaitingDecisionCall = await prisma.callForProposal.create({
    data: {
      title: 'Cybersecurity Innovation Grant - Awaiting Results',
      description: 'Enhancing cybersecurity research and development. Reviews completed, awaiting final decisions from program officers.',
      status: 'CLOSED',
      openDate: twoMonthsAgo,
      closeDate: oneMonthAgo,
      fullProposalDeadline: oneMonthAgo,
      reviewDeadline: oneWeekAgo,
      expectedAwards: 4,
      totalBudget: 2000000,
      currency: 'INR',
      reviewVisibility: 'PRIVATE',
      allowResubmissions: false,
      isPublic: true,
      resultsPublic: false,
      fundingProgramId: fundingProgram.id,
      createdById: programOfficerNSF.id
    }
  })

  // Scenario 4: All deadlines over, results announced
  const completedCall = await prisma.callForProposal.create({
    data: {
      title: 'Biotechnology Research Excellence Award - Results Announced',
      description: 'Supporting excellence in biotechnology research. All deadlines completed and final decisions announced.',
      status: 'ARCHIVED',
      openDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
      closeDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
      fullProposalDeadline: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      reviewDeadline: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
      expectedAwards: 2,
      totalBudget: 1000000,
      currency: 'INR',
      reviewVisibility: 'FULLY_PUBLIC',
      allowResubmissions: false,
      isPublic: true,
      resultsPublic: true, // Results are public
      fundingProgramId: fundingProgram.id,
      createdById: programOfficerNSF.id
    }
  })

  // Add document requirements to some calls
  await prisma.requiredDocument.createMany({
    data: [
      {
        name: 'Endorsement Letter from Institute',
        description: 'Official letter of endorsement from your home institution',
        isRequired: true,
        maxFileSize: 5242880, // 5MB
        allowedTypes: JSON.stringify(['application/pdf']),
        callId: activeCall.id
      },
      {
        name: 'Certificate by Principal Investigator',
        description: 'Signed certificate confirming PI eligibility and commitment',
        isRequired: true,
        maxFileSize: 5242880,
        allowedTypes: JSON.stringify(['application/pdf']),
        callId: activeCall.id
      },
      {
        name: 'Ethics Clearance Certificate',
        description: 'Required for research involving human subjects or sensitive data',
        isRequired: false,
        maxFileSize: 5242880,
        allowedTypes: JSON.stringify(['application/pdf']),
        callId: reviewingCall.id
      }
    ]
  })

  // Add sample proposals to demonstrate different scenarios
  const activeProposal1 = await prisma.proposal.create({
    data: {
      title: 'Neural Network Architecture for Real-time Image Processing',
      abstract: 'Developing efficient neural network architectures for real-time image processing applications.',
      description: 'This proposal aims to create novel neural network architectures optimized for real-time image processing.',
      status: 'SUBMITTED',
      submittedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      callId: activeCall.id,
      principalInvestigatorId: johnPI.id,
      institutionId: institution2.id
    }
  })

  const reviewingProposal1 = await prisma.proposal.create({
    data: {
      title: 'Quantum Error Correction Algorithms',
      abstract: 'Advanced algorithms for quantum error correction in NISQ devices.',
      description: 'Research into novel quantum error correction techniques for near-term quantum computers.',
      status: 'UNDER_REVIEW',
      submittedAt: new Date(reviewingCall.fullProposalDeadline!.getTime() - 24 * 60 * 60 * 1000),
      callId: reviewingCall.id,
      principalInvestigatorId: user1.id,
      institutionId: institution1.id
    }
  })

  const reviewingProposal2 = await prisma.proposal.create({
    data: {
      title: 'Quantum Supremacy Benchmarking',
      abstract: 'Comprehensive benchmarking framework for quantum supremacy claims.',
      description: 'Developing standardized benchmarks to evaluate quantum supremacy demonstrations.',
      status: 'UNDER_REVIEW',
      submittedAt: reviewingCall.fullProposalDeadline!,
      callId: reviewingCall.id,
      principalInvestigatorId: user2.id,
      institutionId: institution2.id
    }
  })

  const awaitingProposal1 = await prisma.proposal.create({
    data: {
      title: 'Advanced Intrusion Detection Systems',
      abstract: 'AI-powered intrusion detection for next-generation cybersecurity.',
      description: 'Developing machine learning-based intrusion detection systems with advanced threat analysis.',
      status: 'UNDER_REVIEW',
      submittedAt: awaitingDecisionCall.fullProposalDeadline!,
      callId: awaitingDecisionCall.id,
      principalInvestigatorId: johnPI.id,
      institutionId: institution2.id
    }
  })

  const completedProposal1 = await prisma.proposal.create({
    data: {
      title: 'CRISPR Gene Editing for Rare Diseases',
      abstract: 'Revolutionary gene therapy approaches for treating rare genetic disorders.',
      description: 'Applying CRISPR-Cas9 technology to develop treatments for rare genetic diseases.',
      status: 'ACCEPTED',
      submittedAt: completedCall.fullProposalDeadline!,
      callId: completedCall.id,
      principalInvestigatorId: user1.id,
      institutionId: institution1.id
    }
  })

  const completedProposal2 = await prisma.proposal.create({
    data: {
      title: 'Synthetic Biology Platform Development',
      abstract: 'Building automated platforms for synthetic biology research.',
      description: 'Creating high-throughput platforms for synthetic biology applications.',
      status: 'REJECTED',
      submittedAt: completedCall.fullProposalDeadline!,
      callId: completedCall.id,
      principalInvestigatorId: user2.id,
      institutionId: institution2.id
    }
  })

  const completedProposal3 = await prisma.proposal.create({
    data: {
      title: 'Bioinformatics Tools for Personalized Medicine',
      abstract: 'Advanced computational tools for precision healthcare.',
      description: 'Developing bioinformatics algorithms for personalized treatment recommendations.',
      status: 'ACCEPTED',
      submittedAt: completedCall.fullProposalDeadline!,
      callId: completedCall.id,
      principalInvestigatorId: johnPI.id,
      institutionId: institution2.id
    }
  })

  // Create review assignments first, then reviews for transparency
  const assignment1A = await prisma.reviewAssignment.create({
    data: {
      proposalId: completedProposal1.id,
      reviewerId: reviewer1.id,
      dueDate: new Date('2025-06-15T23:59:59.000Z'),
      status: 'COMPLETED'
    }
  })

  const assignment1B = await prisma.reviewAssignment.create({
    data: {
      proposalId: completedProposal1.id,
      reviewerId: areaChair.id,
      dueDate: new Date('2025-06-15T23:59:59.000Z'),
      status: 'COMPLETED'
    }
  })

  const assignment2A = await prisma.reviewAssignment.create({
    data: {
      proposalId: completedProposal2.id,
      reviewerId: reviewer1.id,
      dueDate: new Date('2025-06-15T23:59:59.000Z'),
      status: 'COMPLETED'
    }
  })

  const assignment2B = await prisma.reviewAssignment.create({
    data: {
      proposalId: completedProposal2.id,
      reviewerId: programOfficer.id,
      dueDate: new Date('2025-06-15T23:59:59.000Z'),
      status: 'COMPLETED'
    }
  })

  const assignment3A = await prisma.reviewAssignment.create({
    data: {
      proposalId: completedProposal3.id,
      reviewerId: areaChair.id,
      dueDate: new Date('2025-06-15T23:59:59.000Z'),
      status: 'COMPLETED'
    }
  })

  const assignment3B = await prisma.reviewAssignment.create({
    data: {
      proposalId: completedProposal3.id,
      reviewerId: reviewer1.id,
      dueDate: new Date('2025-06-15T23:59:59.000Z'),
      status: 'COMPLETED'
    }
  })

  // Create detailed reviews for transparency - completedProposal1 (ACCEPTED)
  const review1A = await prisma.review.create({
    data: {
      proposalId: completedProposal1.id,
      reviewerId: reviewer1.id,
      assignmentId: assignment1A.id,
      overallScore: 8.5,
      summary: 'Excellent proposal with strong scientific merit and clear innovation. Recommend funding with minor revisions.',
      strengths: 'Outstanding PI track record, novel CRISPR applications, strong preliminary data, clear clinical translation potential, well-designed methodology with appropriate controls.',
      weaknesses: 'Budget justification needs more detail for specialized equipment, timeline is ambitious, limited discussion of off-target effects.',
      commentsToAuthors: `**Detailed Review Comments**

**Strengths:**
• Excellent scientific merit with clear innovation in CRISPR applications
• Strong preliminary data demonstrating feasibility  
• Well-defined methodology with appropriate controls
• Outstanding PI track record in gene editing research
• Clear potential for translation to clinical applications

**Areas for Improvement:**
• Budget justification could be more detailed for specialized equipment
• Timeline is ambitious for the proposed scope
• Limited discussion of potential off-target effects

**Specific Recommendations:**
The proposed research addresses a critical unmet need in rare disease treatment. The PI's previous work on CRISPR delivery systems provides strong foundation. The experimental design is sound, though I recommend additional safety studies in the revision.`,
      recommendation: 'ACCEPT_WITH_REVISIONS',
      isConfidential: false,
      isComplete: true,
      submittedAt: new Date('2025-06-10T14:00:00.000Z')
    }
  })

  const review1B = await prisma.review.create({
    data: {
      proposalId: completedProposal1.id,
      reviewerId: areaChair.id,
      assignmentId: assignment1B.id,
      overallScore: 9.0,
      summary: 'Outstanding proposal representing cutting-edge research with exceptional impact potential. Strong recommendation for funding.',
      strengths: 'World-class research team, comprehensive experimental design, strong potential to benefit patients, excellent training opportunities, innovative CRISPR delivery approach.',
      weaknesses: 'Some equipment expenses need better justification, could benefit from more diverse cell line models.',
      commentsToAuthors: `**Outstanding Proposal - Highly Recommended for Funding**

**Scientific Excellence (9/10):**
This proposal represents cutting-edge research in gene therapy with exceptional potential impact. The innovative approach to CRISPR-Cas9 delivery for rare diseases addresses a critical gap in current treatment options.

**Methodology (8.5/10):**
Comprehensive experimental design with appropriate statistical power calculations. The proposed validation studies are thorough and well-planned.

**Team Qualifications (9.5/10):**
World-class research team with complementary expertise. PI has authored 15+ publications in top-tier journals on gene editing.

**Broader Impact (9/10):**
Strong potential to benefit patients with currently untreatable genetic disorders. Excellent training opportunities for graduate students and postdocs.

**Suggestions for Enhancement:**
- Consider adding more diverse cell line models
- Expand discussion of regulatory pathway for clinical translation
- Include more detailed timeline for patient recruitment phases

**Overall Assessment:**
This proposal should be prioritized for funding given its scientific excellence and potential for transformative impact.`,
      recommendation: 'STRONG_ACCEPT',
      isConfidential: false,
      isComplete: true,
      submittedAt: new Date('2025-06-12T16:30:00.000Z')
    }
  })

  // Reviews for completedProposal2 (REJECTED)
  const review2A = await prisma.review.create({
    data: {
      proposalId: completedProposal2.id,
      reviewerId: reviewer1.id,
      assignmentId: assignment2A.id,
      overallScore: 5.5,
      summary: 'Major concerns about novelty and feasibility. Insufficient preliminary data and lack of competitive advantage over existing solutions.',
      strengths: 'Relevant research area with potential applications, PI has some experience in synthetic biology, basic experimental approach is sound.',
      weaknesses: 'Lack of novelty compared to commercial solutions, insufficient preliminary data, inflated budget, methodology lacks technical detail, no clear competitive advantage.',
      commentsToAuthors: `**Major Concerns with Current Proposal**

**Critical Issues:**

**1. Innovation Gap:** The proposed platform does not offer significant advantages over existing commercial solutions. Similar platforms already exist and are commercially available.

**2. Technical Feasibility:** Major technical hurdles are mentioned but not adequately addressed with concrete solutions or preliminary data.

**3. Preliminary Data:** Insufficient pilot studies to support the ambitious claims made in the proposal.

**4. Budget Concerns:** The requested amount appears inflated for the proposed deliverables and timeline.

**Missing Elements:**
- Detailed comparison with existing platforms
- Preliminary data on key technical components  
- Clear intellectual property landscape analysis
- Realistic cost-benefit analysis

**Recommendations for Future Submissions:**
- Develop stronger preliminary data demonstrating key innovations
- Conduct thorough competitive landscape analysis
- Focus on truly novel technical contributions
- Provide more realistic budget and timeline`,
      recommendation: 'REJECT',
      isConfidential: false,
      isComplete: true,
      submittedAt: new Date('2025-06-11T10:15:00.000Z')
    }
  })

  const review2B = await prisma.review.create({
    data: {
      proposalId: completedProposal2.id,
      reviewerId: programOfficer.id,
      assignmentId: assignment2B.id,
      overallScore: 4.0,
      summary: 'Does not meet funding threshold. Limited innovation, weak preliminary data, and budget concerns prevent recommendation for funding.',
      strengths: 'Addresses relevant research area, some technical competence demonstrated.',
      weaknesses: 'Limited innovation, weak preliminary data, excessive budget, generic methodology, overstated impact claims.',
      commentsToAuthors: `**Detailed Assessment - Does Not Meet Funding Criteria**

**Major Deficiencies:**

**Innovation (3/10):** Proposed approach is largely incremental with limited novel contributions beyond existing commercial platforms.

**Preliminary Data (4/10):** Minimal pilot studies presented. Key technical claims lack supporting evidence.

**Budget Justification (4/10):** $380,000 seems excessive for proposed scope. Equipment and personnel costs not well aligned with deliverables.

**Technical Approach (5/10):** Methodology is generic and lacks specificity for addressing stated challenges.

**Impact Assessment (6/10):** Claims about transformative potential are overstated given limited evidence of user need and adoption barriers.

**Recommendations for Future Work:**
- Develop comprehensive preliminary data package
- Conduct detailed competitive analysis with clear differentiation
- Focus on specific novel technical contributions
- Provide realistic and well-justified budget
- Demonstrate clear user need and feasible adoption pathway

**Decision Rationale:** This proposal does not meet the scientific and technical standards required for funding at this level.`,
      recommendation: 'REJECT',
      isConfidential: false,
      isComplete: true,
      submittedAt: new Date('2025-06-13T11:45:00.000Z')
    }
  })

  // Reviews for completedProposal3 (ACCEPTED)
  const review3A = await prisma.review.create({
    data: {
      proposalId: completedProposal3.id,
      reviewerId: areaChair.id,
      assignmentId: assignment3A.id,
      overallScore: 8.0,
      summary: 'Strong proposal with high impact potential for personalized medicine. Well-designed research plan with good clinical partnerships.',
      strengths: 'Novel algorithmic approaches, strong multi-omics integration, excellent PI track record, clear clinical implementation pathway, good training opportunities.',
      weaknesses: 'Needs more regulatory discussion, additional validation cohorts would strengthen approach, timeline could be more detailed.',
      commentsToAuthors: `**Strong Proposal with High Clinical Impact Potential**

**Scientific Merit (8/10):**
- Novel algorithmic approaches to patient-treatment matching
- Strong integration of multi-omics data sources  
- Addresses critical gaps in current clinical decision support systems

**Technical Approach (7.5/10):**
- Sound computational methodology with appropriate statistical frameworks
- Good validation strategies using clinical datasets
- Thoughtful consideration of data privacy and security

**Team and Resources (8.5/10):**
- PI has excellent track record in computational biology
- Strong collaborative relationships with clinical partners
- Adequate computational infrastructure and expertise

**Broader Impact (8/10):**
- Clear pathway to clinical implementation
- Significant potential to improve patient outcomes
- Valuable training opportunities for computational biology students

**Suggestions for Enhancement:**
- More discussion of regulatory considerations for clinical deployment
- Additional validation cohorts would strengthen generalizability claims
- Consider open-source software development for broader community adoption

**Technical Comments:**
- Algorithm performance metrics are clinically relevant and well-chosen
- Software development plan is reasonable, though timeline may be optimistic`,
      recommendation: 'ACCEPT',
      isConfidential: false,
      isComplete: true,
      submittedAt: new Date('2025-06-14T09:20:00.000Z')
    }
  })

  const review3B = await prisma.review.create({
    data: {
      proposalId: completedProposal3.id,
      reviewerId: reviewer1.id,
      assignmentId: assignment3B.id,
      overallScore: 7.5,
      summary: 'Solid computational research with strong clinical relevance. Good methodology and partnerships, with minor concerns about generalizability.',
      strengths: 'Well-motivated clinical problem, sophisticated computational approaches, strong preliminary results, excellent clinical collaborations, clear data management plan.',
      weaknesses: 'Limited population diversity in preliminary data, implementation details need work, computational scalability concerns for smaller healthcare systems.',
      commentsToAuthors: `**Solid Computational Research with Clinical Relevance**

**Technical Evaluation:**
The proposed machine learning algorithms show promise, particularly the ensemble approach combining multiple data types. The validation strategy using retrospective clinical data is appropriate and well-designed.

**Strengths:**
• Well-motivated research addressing real clinical needs
• Sophisticated computational approaches with appropriate statistical methods  
• Strong preliminary results on smaller datasets
• Excellent collaboration with clinical partners
• Comprehensive data management and sharing plan

**Areas for Improvement:**

**1. Generalizability:** Most preliminary data comes from European populations - recommend including more diverse validation datasets to ensure broader applicability.

**2. Implementation:** More details needed on integration with existing electronic health record systems and clinical workflows.

**3. Scalability:** Computational requirements may be challenging for smaller healthcare systems - consider lightweight alternatives.

**Technical Suggestions:**
- Cross-validation approach could be more robust (consider nested CV)
- Feature selection methodology needs additional detail
- Include more baseline methods for comprehensive comparison
- Address potential bias and fairness issues in ML models more thoroughly

**Overall Assessment:** This represents solid computational research that could make meaningful contributions to precision medicine. The clinical partnerships are a particular strength that enhances translation potential.`,
      recommendation: 'ACCEPT_WITH_REVISIONS',
      isConfidential: false,
      isComplete: true,
      submittedAt: new Date('2025-06-15T15:10:00.000Z')
    }
  })

  console.log(`Created additional deadline scenario data:
  - 4 calls with different deadline states
  - 7 additional proposals demonstrating various stages
  - Document requirements for PDF uploads`)

  console.log(`Total database content:
  - 2 institutions
  - 8 users (1 admin, 2 PIs, 1 reviewer, 1 area chair, 2 program officers, 2 additional researchers)
  - 1 funding program with review criteria
  - 5 calls for proposals (1 original + 4 deadline scenarios)
  - 12 proposals total (5 original + 7 new across different stages)
  - 1 collaboration
  - Budget items
  - Multiple review assignments (some pending, some in-progress)
  - Reviews (3 completed, 2 draft/incomplete)
  - Document upload requirements for proposals`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
