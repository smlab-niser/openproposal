import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

export enum UserRole {
  PRINCIPAL_INVESTIGATOR = 'PRINCIPAL_INVESTIGATOR',
  CO_PRINCIPAL_INVESTIGATOR = 'CO_PRINCIPAL_INVESTIGATOR',
  PROGRAM_OFFICER = 'PROGRAM_OFFICER',
  CALL_COORDINATOR = 'CALL_COORDINATOR',
  REVIEWER = 'REVIEWER',
  AREA_CHAIR = 'AREA_CHAIR',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  INSTITUTIONAL_ADMIN = 'INSTITUTIONAL_ADMIN'
}

export interface AuthUser {
  id: string
  email: string
  name: string
  roles: UserRole[]
}

export interface JWTPayload extends AuthUser {
  iat?: number
  exp?: number
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
  return bcrypt.hash(password, saltRounds)
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const generateToken = (user: AuthUser): string => {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT secret is required. Please set NEXTAUTH_SECRET or JWT_SECRET environment variable.')
  }
  return jwt.sign(user, secret, { expiresIn: '24h' })
}

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
    if (!secret) {
      console.error('JWT secret is required. Please set NEXTAUTH_SECRET or JWT_SECRET environment variable.')
      return null
    }
    return jwt.verify(token, secret) as JWTPayload
  } catch {
    return null
  }
}

export const hasRole = (userRoles: UserRole[], requiredRole: UserRole): boolean => {
  return userRoles.includes(requiredRole) || userRoles.includes(UserRole.SYSTEM_ADMIN)
}

export const hasAnyRole = (userRoles: UserRole[], requiredRoles: UserRole[]): boolean => {
  return requiredRoles.some(role => hasRole(userRoles, role))
}
