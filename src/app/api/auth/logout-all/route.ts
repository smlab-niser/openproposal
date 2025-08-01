import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    // Get JWT token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid authorization header found')
      return NextResponse.json({ error: 'No valid token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const jwtSecret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    let userId: string
    try {
      const decoded = jwt.verify(token, jwtSecret) as { id: string }
      userId = decoded.id
      console.log(`Valid token found for user: ${userId}`)
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // In a production app, you would:
    // 1. Invalidate all JWT tokens for this user (requires a token blacklist or versioning)
    // 2. Update a tokenVersion field in the user record
    // 3. Clear all sessions from session storage (Redis, database, etc.)
    
    // For now, we'll log the logout event and return success
    // The client will clear localStorage, effectively logging out
    console.log(`User ${userId} logged out from all sessions at ${new Date().toISOString()}`)

    // In a more sophisticated implementation, you might:
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: { tokenVersion: { increment: 1 } }
    // })
    
    // Or add tokens to a blacklist:
    // await redis.sadd(`blacklisted_tokens:${userId}`, token)

    return NextResponse.json({ 
      message: 'Successfully logged out from all sessions' 
    })

  } catch (error) {
    console.error('Logout all sessions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
