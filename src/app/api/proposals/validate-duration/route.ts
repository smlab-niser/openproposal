import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
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

    const { callId, duration } = await request.json()

    if (!callId || duration === undefined) {
      return NextResponse.json({ error: 'Call ID and duration are required' }, { status: 400 })
    }

    // Get the call's maximum duration
    const call = await prisma.callForProposal.findUnique({
      where: { id: callId },
      select: { maxDuration: true, title: true }
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    let isValid = true
    let message = 'Duration is valid'

    if (call.maxDuration && duration > call.maxDuration) {
      isValid = false
      message = `Duration of ${duration} months exceeds the maximum allowed duration of ${call.maxDuration} months for this call.`
    }

    if (duration <= 0) {
      isValid = false
      message = 'Duration must be greater than 0 months'
    }

    return NextResponse.json({
      isValid,
      message,
      maxDuration: call.maxDuration,
      requestedDuration: duration
    })
  } catch (error) {
    console.error('Error validating proposal duration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
