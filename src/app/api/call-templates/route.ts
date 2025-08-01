import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Predefined call templates
const DEFAULT_TEMPLATES = [
  {
    id: 'early-career',
    name: 'Early Career Research Award',
    description: 'Template for early career researcher funding calls',
    template: {
      title: 'Early Career Research Award - [Year]',
      description: 'This funding opportunity supports innovative research projects led by early career researchers who have completed their PhD within the last 5 years. The program aims to foster independent research and help establish promising researchers in their field.',
      currency: 'INR',
      reviewVisibility: 'BLIND',
      isPublic: true,
      status: 'DRAFT',
      suggestedBudget: {
        min: 500000,
        max: 2000000
      },
      suggestedDuration: 36,
      objectives: [
        'Support early career researchers in establishing independent research programs',
        'Foster innovation and creativity in research',
        'Build research capacity in emerging areas',
        'Promote interdisciplinary collaboration'
      ],
      eligibilityRules: [
        'Must have completed PhD within the last 5 years',
        'Must be affiliated with an eligible research institution',
        'Must be the principal investigator',
        'No more than one active grant of this type at a time'
      ]
    }
  },
  {
    id: 'collaborative-research',
    name: 'Collaborative Research Initiative',
    description: 'Template for multi-institutional collaborative research calls',
    template: {
      title: 'Collaborative Research Initiative - [Year]',
      description: 'This program supports large-scale collaborative research projects involving multiple institutions and disciplines. The initiative aims to address complex societal challenges through coordinated research efforts.',
      currency: 'INR',
      reviewVisibility: 'OPEN_POST_REVIEW',
      isPublic: true,
      status: 'DRAFT',
      suggestedBudget: {
        min: 2000000,
        max: 10000000
      },
      suggestedDuration: 60,
      objectives: [
        'Foster collaboration between institutions and disciplines',
        'Address complex societal challenges',
        'Build research networks and partnerships',
        'Promote knowledge sharing and technology transfer'
      ],
      eligibilityRules: [
        'Must involve at least 3 different institutions',
        'Must have clear collaboration agreements',
        'Must demonstrate complementary expertise',
        'Must have committed co-funding from participating institutions'
      ]
    }
  },
  {
    id: 'technology-innovation',
    name: 'Technology Innovation Grant',
    description: 'Template for technology development and innovation calls',
    template: {
      title: 'Technology Innovation Grant - [Year]',
      description: 'This funding supports the development of innovative technologies with potential for commercialization and societal impact. The program encourages translation of research into practical applications.',
      currency: 'INR',
      reviewVisibility: 'PRIVATE',
      isPublic: true,
      status: 'DRAFT',
      suggestedBudget: {
        min: 1000000,
        max: 5000000
      },
      suggestedDuration: 48,
      objectives: [
        'Support technology development and innovation',
        'Promote research commercialization',
        'Foster industry-academia partnerships',
        'Create intellectual property and economic value'
      ],
      eligibilityRules: [
        'Must demonstrate clear commercial potential',
        'Must have industry partner or commercialization plan',
        'Must show proof of concept or preliminary results',
        'Must comply with intellectual property guidelines'
      ]
    }
  },
  {
    id: 'international-collaboration',
    name: 'International Collaboration Award',
    description: 'Template for international research collaboration calls',
    template: {
      title: 'International Collaboration Award - [Year]',
      description: 'This program promotes international research collaborations and knowledge exchange. It supports joint research projects between Indian institutions and international partners.',
      currency: 'INR',
      reviewVisibility: 'BLIND',
      isPublic: true,
      status: 'DRAFT',
      suggestedBudget: {
        min: 1500000,
        max: 4000000
      },
      suggestedDuration: 36,
      objectives: [
        'Promote international research collaborations',
        'Facilitate knowledge and technology exchange',
        'Build global research networks',
        'Enhance India\'s research visibility internationally'
      ],
      eligibilityRules: [
        'Must have confirmed international partner',
        'Must demonstrate mutual benefit and complementarity',
        'Must include researcher exchange component',
        'Must comply with international collaboration guidelines'
      ]
    }
  },
  {
    id: 'student-fellowship',
    name: 'Student Fellowship Program',
    description: 'Template for student research fellowship calls',
    template: {
      title: 'Student Research Fellowship - [Year]',
      description: 'This fellowship program supports outstanding students pursuing research projects in their area of study. The program aims to encourage research culture among students and prepare future researchers.',
      currency: 'INR',
      reviewVisibility: 'BLIND',
      isPublic: true,
      status: 'DRAFT',
      suggestedBudget: {
        min: 100000,
        max: 500000
      },
      suggestedDuration: 12,
      objectives: [
        'Support student research initiatives',
        'Encourage research culture in academic institutions',
        'Provide research experience and training',
        'Identify and nurture research talent'
      ],
      eligibilityRules: [
        'Must be enrolled in a degree program',
        'Must have faculty mentor/supervisor',
        'Must maintain good academic standing',
        'Must commit to presenting research results'
      ]
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userPayload = verifyToken(token)
    if (!userPayload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check user permissions
    const user = await prisma.user.findUnique({
      where: { id: userPayload.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRoles = user.roles ? JSON.parse(user.roles) : []
    const hasPermission = userRoles.some((role: string) => 
      ['SYSTEM_ADMIN', 'INSTITUTIONAL_ADMIN', 'PROGRAM_OFFICER'].includes(role)
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get template ID from query params
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (templateId) {
      // Return specific template
      const template = DEFAULT_TEMPLATES.find(t => t.id === templateId)
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      return NextResponse.json(template)
    }

    // Return all templates
    return NextResponse.json(DEFAULT_TEMPLATES)

  } catch (error) {
    console.error('Error fetching call templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
