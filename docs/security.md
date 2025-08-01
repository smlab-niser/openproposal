# 🔒 OpenProposal Security Guide

## Overview
This document outlines the comprehensive security measures implemented in the OpenProposal platform and provides guidelines for maintaining a secure research proposal management system.

## 🛡️ Security Architecture

### Authentication & Authorization
- **JWT-based authentication** with secure token generation and validation
- **Role-based access control (RBAC)** with 8 distinct user roles
- **Password hashing** using bcryptjs with 12 salt rounds
- **Session management** with secure token expiration and refresh
- **Multi-factor authentication** ready integration points

### Data Protection
- **Input sanitization** for all user inputs to prevent XSS attacks
- **SQL injection prevention** through Prisma ORM parameterized queries
- **CSRF protection** via NextAuth.js built-in mechanisms
- **Data encryption** for sensitive information at rest
- **File upload validation** with type and size restrictions

### Network Security
- **HTTPS enforcement** in production environments
- **Security headers** implementation (CSP, HSTS, X-Frame-Options)
- **Rate limiting** on all API endpoints to prevent abuse
- **CORS configuration** with restricted origins
- **API key management** for external service integrations

## 🔧 Security Configuration

### Environment Variables
```bash
# Authentication (REQUIRED)
JWT_SECRET=your-secure-jwt-secret-minimum-32-characters
NEXTAUTH_SECRET=your-nextauth-secret-minimum-32-characters
BCRYPT_SALT_ROUNDS=12

# Database Security
DATABASE_URL=your-secure-database-connection-string

# Email Security (if using Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=openproposal@niser.ac.in
SMTP_PASS=your-app-specific-password

# Optional Performance
PRISMA_ACCELERATE_URL=your-accelerate-url-if-using

# Production Settings
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
```

### Security Middleware Implementation
The platform includes comprehensive security middleware (`/src/lib/security.ts`) that provides:

#### Rate Limiting
- **Global rate limit**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 attempts per 15 minutes
- **API endpoints**: 50 requests per 10 minutes
- **File uploads**: 10 uploads per hour

#### Input Validation
- **XSS protection** through HTML entity encoding
- **SQL injection prevention** via input sanitization
- **File type validation** for uploads
- **Request size limits** to prevent DoS attacks

#### Password Security
- **Minimum 8 characters** with complexity requirements
- **Common password detection** and rejection
- **Password strength scoring** with real-time feedback
- **Secure password reset** with time-limited tokens

## 🚨 Security Best Practices

### For Developers
1. **Never commit secrets** to version control
2. **Use environment variables** for all configuration
3. **Validate all inputs** on both client and server
4. **Implement proper error handling** without exposing sensitive information
5. **Regular dependency updates** and vulnerability scanning
6. **Code reviews** with security focus
7. **Audit logging** for all sensitive operations

### For Administrators
1. **Regular security audits** using the provided script
2. **Monitor access logs** for unusual patterns
3. **Keep the platform updated** with latest security patches
4. **Backup encryption** for data protection
5. **User access reviews** and role auditing
6. **Incident response plan** preparation

### For Users
1. **Strong passwords** following platform requirements
2. **Regular password updates** (every 90 days recommended)
3. **Secure email access** for notification security
4. **Log out** from shared devices
5. **Report suspicious activity** immediately

## 🔍 Security Monitoring

### Automated Checks
Run the security audit script regularly:
```bash
node scripts/security-audit.js
```

### Manual Security Reviews
- Review user access patterns monthly
- Audit proposal access logs quarterly
- Check for unauthorized data access
- Monitor email notification deliverability
- Validate backup integrity

### Security Metrics
- Failed login attempts per day
- Unusual access patterns
- API rate limit violations
- File upload rejections
- Password reset frequency

## 🆘 Incident Response

### Security Incident Types
1. **Data breach** - Unauthorized access to proposals or user data
2. **Account compromise** - Unauthorized access to user accounts
3. **System intrusion** - Unauthorized access to platform infrastructure
4. **DoS attacks** - Platform availability issues
5. **Data corruption** - Integrity issues with stored data

### Response Procedures
1. **Immediate containment** - Isolate affected systems
2. **Assessment** - Determine scope and impact
3. **Notification** - Inform affected users and authorities if required
4. **Recovery** - Restore systems and data from secure backups
5. **Review** - Analyze incident and improve security measures

## 🔒 Compliance & Standards

### Data Protection
- **GDPR compliance** for European users
- **Privacy by design** implementation
- **Data minimization** principles
- **Right to erasure** capabilities
- **Data portability** features

### Academic Standards
- **Research integrity** protection
- **Intellectual property** safeguards
- **Conflict of interest** management
- **Audit trail** maintenance
- **Reproducibility** support

## 📋 Security Checklist

### Pre-Deployment
- [ ] All environment variables properly configured
- [ ] Security audit script passes without errors
- [ ] SSL/TLS certificates installed and valid
- [ ] Database access properly restricted
- [ ] File permissions correctly set
- [ ] Backup systems tested and verified
- [ ] Rate limiting configured and tested
- [ ] Security headers properly implemented

### Post-Deployment
- [ ] Monitor logs for security events
- [ ] Regular security audit execution
- [ ] User access pattern review
- [ ] Dependency vulnerability scanning
- [ ] Backup verification
- [ ] Performance monitoring
- [ ] Email notification testing
- [ ] Security training for administrators

## 🛠️ Security Tools & Scripts

### Available Scripts
- `scripts/security-audit.js` - Comprehensive security validation
- Security middleware in `/src/lib/security.ts`
- Email security validation in `/src/lib/email.ts`
- Authentication hardening in `/src/lib/auth.ts`

### Recommended Tools
- **npm audit** for dependency vulnerabilities
- **ESLint security plugin** for code analysis
- **Helmet.js** for additional security headers
- **Rate limiting** with express-rate-limit
- **Input validation** with Zod schemas

## 📞 Security Contacts

For security-related issues:
- Platform security: Contact system administrator
- Data protection: Contact institutional compliance officer
- Emergency response: Follow institutional incident response procedures

## 📚 Additional Resources

- [OWASP Top 10 Security Risks](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Security Guidelines](https://www.prisma.io/docs/guides/other/security)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Review Schedule**: Quarterly security review recommended
