import { NextRequest, NextResponse } from 'next/server'

// Security headers configuration
const securityHeaders = {
  // Prevent XSS attacks
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  
  // HTTPS enforcement
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for Next.js
    "style-src 'self' 'unsafe-inline'", // Needed for Tailwind
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()'
  ].join(', ')
}

// Rate limiting storage (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export class SecurityMiddleware {
  static applySecurityHeaders(response: NextResponse): NextResponse {
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }

  static checkRateLimit(request: NextRequest, limit: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') || // Cloudflare
                    '127.0.0.1'
    
    const now = Date.now()
    const rateLimitKey = `${clientIP}:${Math.floor(now / windowMs)}`
    
    const current = rateLimitMap.get(rateLimitKey)
    
    if (!current) {
      rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + windowMs })
      return true
    }
    
    if (current.count >= limit) {
      return false
    }
    
    current.count++
    return true
  }

  static validateInput(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (typeof data === 'string') {
      // Check for basic XSS patterns
      const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
      ]
      
      if (xssPatterns.some(pattern => pattern.test(data))) {
        errors.push('Input contains potentially malicious content')
      }
      
      // Check for SQL injection patterns (even though we use Prisma)
      const sqlPatterns = [
        /union\s+select/i,
        /drop\s+table/i,
        /delete\s+from/i,
        /'.*or.*'/i,
        /1\s*=\s*1/i
      ]
      
      if (sqlPatterns.some(pattern => pattern.test(data))) {
        errors.push('Input contains potentially malicious SQL patterns')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove basic HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }

  static isValidPassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static logSecurityEvent(event: string, details: any, request: NextRequest): void {
    const timestamp = new Date().toISOString()
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') || // Cloudflare
                    '127.0.0.1'
    
    console.warn(`[SECURITY] ${timestamp} - ${event}`, {
      ip: clientIP,
      userAgent: request.headers.get('user-agent'),
      url: request.url,
      method: request.method,
      details
    })
    
    // In production, send to security monitoring service
  }
}

export default SecurityMiddleware
