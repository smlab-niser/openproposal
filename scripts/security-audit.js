#!/usr/bin/env node

/**
 * Security Environment Validator
 * Checks for common security misconfigurations and vulnerabilities
 */

const fs = require('fs')
const path = require('path')

class SecurityValidator {
  constructor() {
    this.errors = []
    this.warnings = []
    this.passes = []
  }

  log(type, message) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] ${type}: ${message}`)
  }

  error(message) {
    this.errors.push(message)
    this.log('ERROR', message)
  }

  warning(message) {
    this.warnings.push(message)
    this.log('WARNING', message)
  }

  pass(message) {
    this.passes.push(message)
    this.log('PASS', message)
  }

  checkEnvironmentVariables() {
    this.log('INFO', 'Checking environment variables...')
    
    const envPath = path.join(process.cwd(), '.env.local')
    if (!fs.existsSync(envPath)) {
      this.error('.env.local file not found')
      return
    }

    const envContent = fs.readFileSync(envPath, 'utf8')
    const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))
    
    // Check for required security variables
    const requiredVars = [
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'BCRYPT_SALT_ROUNDS'
    ]

    requiredVars.forEach(varName => {
      const found = envLines.find(line => line.startsWith(`${varName}=`))
      if (found) {
        const value = found.split('=')[1]?.trim()
        if (!value || value === 'your-secret-key-here' || value === 'your-jwt-secret-here') {
          this.error(`${varName} is not set to a secure value`)
        } else if (value.length < 32) {
          this.warning(`${varName} should be at least 32 characters long`)
        } else {
          this.pass(`${varName} is properly configured`)
        }
      } else {
        this.error(`${varName} is not defined`)
      }
    })

    // Check SMTP password
    const smtpPass = envLines.find(line => line.startsWith('SMTP_PASS='))
    if (smtpPass) {
      const value = smtpPass.split('=')[1]?.trim()
      if (!value) {
        this.warning('SMTP_PASS is empty - email notifications will not work')
      } else {
        this.pass('SMTP_PASS is configured')
      }
    }

    // Check for debug flags
    const nodeEnv = envLines.find(line => line.startsWith('NODE_ENV='))
    if (nodeEnv && nodeEnv.includes('production')) {
      this.pass('NODE_ENV is set to production')
    } else {
      this.warning('NODE_ENV is not set to production - ensure this is correct for your environment')
    }
  }

  checkFilePermissions() {
    this.log('INFO', 'Checking file permissions...')
    
    const sensitiveFiles = [
      '.env.local',
      '.env',
      'prisma/dev.db'
    ]

    sensitiveFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file)
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath)
          const mode = (stats.mode & parseInt('777', 8)).toString(8)
          
          if (mode === '600' || mode === '644') {
            this.pass(`${file} has appropriate permissions (${mode})`)
          } else {
            this.warning(`${file} has permissions ${mode} - consider restricting to 600`)
          }
        } catch (error) {
          this.warning(`Could not check permissions for ${file}: ${error.message}`)
        }
      }
    })
  }

  checkDangerousEndpoints() {
    this.log('INFO', 'Checking for dangerous endpoints...')
    
    const apiDir = path.join(process.cwd(), 'src/app/api')
    const dangerousPatterns = [
      'test-',
      'debug-',
      'admin-test',
      'fix-',
      'temp-'
    ]

    if (fs.existsSync(apiDir)) {
      const checkDirectory = (dir) => {
        const items = fs.readdirSync(dir)
        
        items.forEach(item => {
          const itemPath = path.join(dir, item)
          const stats = fs.statSync(itemPath)
          
          if (stats.isDirectory()) {
            dangerousPatterns.forEach(pattern => {
              if (item.includes(pattern)) {
                this.error(`Dangerous endpoint directory found: ${itemPath.replace(process.cwd(), '')}`)
              }
            })
            checkDirectory(itemPath)
          }
        })
      }
      
      checkDirectory(apiDir)
    }
  }

  checkPackageVulnerabilities() {
    this.log('INFO', 'Checking package.json for common issues...')
    
    const packagePath = path.join(process.cwd(), 'package.json')
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      
      // Check for outdated security-related packages
      const securityPackages = [
        'bcryptjs',
        'jsonwebtoken',
        'zod',
        '@prisma/client'
      ]
      
      securityPackages.forEach(pkg => {
        if (packageJson.dependencies && packageJson.dependencies[pkg]) {
          this.pass(`Security package ${pkg} is included`)
        } else {
          this.warning(`Security package ${pkg} not found in dependencies`)
        }
      })
      
      // Check for development dependencies in production
      if (packageJson.devDependencies) {
        this.pass('Development dependencies are properly separated')
      }
    }
  }

  checkGitIgnore() {
    this.log('INFO', 'Checking .gitignore configuration...')
    
    const gitignorePath = path.join(process.cwd(), '.gitignore')
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8')
      
      const requiredIgnores = [
        '.env.local',
        '.env',
        'node_modules',
        '*.log'
      ]
      
      requiredIgnores.forEach(pattern => {
        if (gitignoreContent.includes(pattern)) {
          this.pass(`${pattern} is properly ignored`)
        } else {
          this.error(`${pattern} should be added to .gitignore`)
        }
      })
    } else {
      this.error('.gitignore file not found')
    }
  }

  generateReport() {
    this.log('INFO', 'Generating security report...')
    
    console.log('\n' + '='.repeat(60))
    console.log('SECURITY AUDIT REPORT')
    console.log('='.repeat(60))
    
    console.log(`\n✅ PASSED: ${this.passes.length} checks`)
    this.passes.forEach(pass => console.log(`  ✅ ${pass}`))
    
    console.log(`\n⚠️  WARNINGS: ${this.warnings.length} issues`)
    this.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`))
    
    console.log(`\n❌ ERRORS: ${this.errors.length} critical issues`)
    this.errors.forEach(error => console.log(`  ❌ ${error}`))
    
    console.log('\n' + '='.repeat(60))
    
    if (this.errors.length === 0) {
      console.log('🎉 No critical security issues found!')
    } else {
      console.log('🚨 Please fix the critical issues before deploying to production!')
      process.exit(1)
    }
    
    if (this.warnings.length > 0) {
      console.log('💡 Consider addressing the warnings for improved security.')
    }
  }

  run() {
    console.log('🔒 Starting OpenProposal Security Audit...\n')
    
    this.checkEnvironmentVariables()
    this.checkFilePermissions()
    this.checkDangerousEndpoints()
    this.checkPackageVulnerabilities()
    this.checkGitIgnore()
    
    this.generateReport()
  }
}

// Run the security validator
const validator = new SecurityValidator()
validator.run()
