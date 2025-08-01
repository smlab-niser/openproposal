import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken, UserRole } from '@/lib/auth'
import emailService from '@/lib/email'
import SecurityMiddleware from '@/lib/security'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  orcid: z.string().max(50).optional(),
  bio: z.string().max(1000).optional(),
  institutionId: z.string().optional(),
  role: z.nativeEnum(UserRole).optional().default(UserRole.PRINCIPAL_INVESTIGATOR)
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for registration attempts
    if (!SecurityMiddleware.checkRateLimit(request, 5, 15 * 60 * 1000)) {
      SecurityMiddleware.logSecurityEvent('REGISTRATION_RATE_LIMIT_EXCEEDED', {}, request)
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Validate email format
    if (!SecurityMiddleware.isValidEmail(validatedData.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = SecurityMiddleware.isValidPassword(validatedData.password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet security requirements', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    // Sanitize text inputs
    const sanitizedData = {
      ...validatedData,
      name: SecurityMiddleware.sanitizeInput(validatedData.name),
      firstName: validatedData.firstName ? SecurityMiddleware.sanitizeInput(validatedData.firstName) : undefined,
      lastName: validatedData.lastName ? SecurityMiddleware.sanitizeInput(validatedData.lastName) : undefined,
      bio: validatedData.bio ? SecurityMiddleware.sanitizeInput(validatedData.bio) : undefined,
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedData.email }
    })

    if (existingUser) {
      SecurityMiddleware.logSecurityEvent('DUPLICATE_REGISTRATION_ATTEMPT', {
        email: sanitizedData.email
      }, request)
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Check ORCID uniqueness if provided
    if (sanitizedData.orcid) {
      const existingOrcid = await prisma.user.findUnique({
        where: { orcid: sanitizedData.orcid }
      })

      if (existingOrcid) {
        return NextResponse.json(
          { error: 'User already exists with this ORCID' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(sanitizedData.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: sanitizedData.email,
        password: hashedPassword,
        name: sanitizedData.name,
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        orcid: sanitizedData.orcid,
        bio: sanitizedData.bio,
        roles: JSON.stringify([sanitizedData.role])
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        createdAt: true
      }
    })

    // Create institution relationship if provided
    if (sanitizedData.institutionId) {
      await prisma.userInstitution.create({
        data: {
          userId: user.id,
          institutionId: sanitizedData.institutionId,
          isPrimary: true
        }
      })
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles ? JSON.parse(user.roles) : []
    })

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        name: user.name,
        email: user.email,
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the registration if email fails
    }

    SecurityMiddleware.logSecurityEvent('USER_REGISTERED', {
      userId: user.id,
      email: user.email,
      role: sanitizedData.role
    }, request)

    return NextResponse.json({
      user,
      token
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    SecurityMiddleware.logSecurityEvent('REGISTRATION_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, request)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
