import nodemailer from 'nodemailer'
import { type ProposalStatus, type BudgetCategory } from '@prisma/client'

// Email configuration interface
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth?: {
    user: string
    pass: string
  }
}

// Email templates interface
interface EmailTemplate {
  subject: string
  html: string
  text: string
}

// User interface for email context
interface EmailUser {
  name?: string
  email: string
  firstName?: string
  lastName?: string
}

// Proposal interface for email context
interface EmailProposal {
  id: string
  title: string
  status: ProposalStatus
  totalBudget?: number
  currency?: string
  submittedAt?: Date
  principalInvestigator: EmailUser
}

// Review interface for email context
interface EmailReview {
  id: string
  score?: number
  comments?: string
  reviewer: EmailUser
  proposal: EmailProposal
}

// Email service class
class EmailService {
  private transporter: nodemailer.Transporter
  private fromEmail: string
  private fromName: string
  private isEnabled: boolean

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'openproposal@niser.ac.in'
    this.fromName = process.env.FROM_NAME || 'OpenProposal Platform - NISER'
    this.isEnabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true'

    // Configure transporter
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true'
    }

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      config.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }

    // Gmail-specific optimizations
    if (config.host === 'smtp.gmail.com') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail', // Use Gmail service for better compatibility
        auth: config.auth,
        // Additional Gmail-specific options
        pool: true, // Use pooled connections
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000, // Rate limiting: 1 second between batches
        rateLimit: 10 // Max 10 emails per rateDelta period
      })
    } else {
      this.transporter = nodemailer.createTransport(config)
    }
  }

  // Helper method to get formatted currency
  private formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Helper method to format date in IST with DD/MM/YYYY format
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    }).format(date)
  }

  // Base email sending method
  private async sendEmail(to: string | string[], template: EmailTemplate): Promise<boolean> {
    if (!this.isEnabled) {
      return false
    }

    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: template.subject,
        text: template.text,
        html: template.html
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', result.messageId)
      return true
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  // Template: Welcome email for new users
  public async sendWelcomeEmail(user: EmailUser): Promise<boolean> {
    const template: EmailTemplate = {
      subject: 'Welcome to OpenProposal Platform - NISER',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to OpenProposal</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Research Funding Platform - NISER</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.firstName || user.name}!</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Welcome to the OpenProposal Platform! Your account has been successfully created and you can now:
            </p>
            
            <ul style="color: #666; line-height: 1.8; font-size: 15px;">
              <li>Submit research proposals for funding opportunities</li>
              <li>Collaborate with team members on proposals</li>
              <li>Manage detailed budget breakdowns</li>
              <li>Track the status of your applications</li>
              <li>Participate in the peer review process</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/dashboard" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Access Your Dashboard
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              If you have any questions or need assistance, please don't hesitate to reach out to our support team.
            </p>
          </div>
          
          <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">OpenProposal Platform - National Institute of Science Education and Research (NISER)</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Welcome to OpenProposal Platform - NISER

Hello ${user.firstName || user.name}!

Welcome to the OpenProposal Platform! Your account has been successfully created and you can now:

- Submit research proposals for funding opportunities
- Collaborate with team members on proposals  
- Manage detailed budget breakdowns
- Track the status of your applications
- Participate in the peer review process

Access your dashboard: ${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/dashboard

If you have any questions or need assistance, please don't hesitate to reach out to our support team.

OpenProposal Platform - National Institute of Science Education and Research (NISER)
© ${new Date().getFullYear()} All rights reserved.`
    }

    return this.sendEmail(user.email, template)
  }

  // Template: Proposal submission confirmation
  public async sendProposalSubmitted(proposal: EmailProposal): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `Proposal Submitted Successfully: ${proposal.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #10b981; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Proposal Submitted</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your research proposal has been successfully submitted</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Dear ${proposal.principalInvestigator.firstName || proposal.principalInvestigator.name},</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Your research proposal has been successfully submitted for review. Here are the details:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="margin: 0 0 15px 0; color: #333;">Proposal Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Title:</strong> ${proposal.title}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Proposal ID:</strong> ${proposal.id}</p>
              ${proposal.totalBudget ? `<p style="margin: 5px 0; color: #666;"><strong>Budget:</strong> ${this.formatCurrency(proposal.totalBudget, proposal.currency)}</p>` : ''}
              <p style="margin: 5px 0; color: #666;"><strong>Submitted:</strong> ${proposal.submittedAt ? this.formatDate(proposal.submittedAt) : 'Just now'}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">Submitted</span></p>
            </div>
            
            <h3 style="color: #333; margin: 25px 0 15px 0;">What Happens Next?</h3>
            <ol style="color: #666; line-height: 1.8; font-size: 15px;">
              <li>Your proposal will be reviewed for completeness and eligibility</li>
              <li>It will be assigned to qualified reviewers for evaluation</li>
              <li>You'll receive updates via email as the review progresses</li>
              <li>The final decision will be communicated within the specified timeline</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/proposals/${proposal.id}" 
                 style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Proposal
              </a>
            </div>
          </div>
          
          <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">OpenProposal Platform - NISER</p>
          </div>
        </div>
      `,
      text: `Proposal Submitted Successfully: ${proposal.title}

Dear ${proposal.principalInvestigator.firstName || proposal.principalInvestigator.name},

Your research proposal has been successfully submitted for review. Here are the details:

Proposal Details:
- Title: ${proposal.title}
- Proposal ID: ${proposal.id}
${proposal.totalBudget ? `- Budget: ${this.formatCurrency(proposal.totalBudget, proposal.currency)}\n` : ''}- Submitted: ${proposal.submittedAt ? this.formatDate(proposal.submittedAt) : 'Just now'}
- Status: Submitted

What Happens Next?
1. Your proposal will be reviewed for completeness and eligibility
2. It will be assigned to qualified reviewers for evaluation
3. You'll receive updates via email as the review progresses
4. The final decision will be communicated within the specified timeline

View your proposal: ${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/proposals/${proposal.id}

OpenProposal Platform - NISER`
    }

    return this.sendEmail(proposal.principalInvestigator.email, template)
  }

  // Template: Proposal status change notification
  public async sendProposalStatusUpdate(proposal: EmailProposal): Promise<boolean> {
    const statusColors: Record<ProposalStatus, string> = {
      DRAFT: '#6b7280',
      SUBMITTED: '#3b82f6',
      UNDER_REVIEW: '#f59e0b',
      ACCEPTED: '#10b981',
      REJECTED: '#ef4444',
      WITHDRAWN: '#6b7280'
    }

    const statusMessages: Record<ProposalStatus, string> = {
      DRAFT: 'Your proposal is in draft status',
      SUBMITTED: 'Your proposal has been submitted',
      UNDER_REVIEW: 'Your proposal is now under review',
      ACCEPTED: 'Congratulations! Your proposal has been accepted',
      REJECTED: 'Your proposal has been rejected',
      WITHDRAWN: 'Your proposal has been withdrawn'
    }

    const template: EmailTemplate = {
      subject: `Proposal Status Update: ${proposal.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${statusColors[proposal.status]}; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Proposal Status Update</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${statusMessages[proposal.status]}</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Dear ${proposal.principalInvestigator.firstName || proposal.principalInvestigator.name},</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              The status of your research proposal has been updated:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColors[proposal.status]};">
              <h3 style="margin: 0 0 15px 0; color: #333;">Proposal Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Title:</strong> ${proposal.title}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Proposal ID:</strong> ${proposal.id}</p>
              <p style="margin: 5px 0; color: #666;"><strong>New Status:</strong> <span style="color: ${statusColors[proposal.status]}; font-weight: bold;">${proposal.status.replace('_', ' ').toUpperCase()}</span></p>
              <p style="margin: 5px 0; color: #666;"><strong>Updated:</strong> ${this.formatDate(new Date())}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/proposals/${proposal.id}" 
                 style="background: ${statusColors[proposal.status]}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Proposal Details
              </a>
            </div>
          </div>
          
          <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">OpenProposal Platform - NISER</p>
          </div>
        </div>
      `,
      text: `Proposal Status Update: ${proposal.title}

Dear ${proposal.principalInvestigator.firstName || proposal.principalInvestigator.name},

The status of your research proposal has been updated:

Proposal Details:
- Title: ${proposal.title}
- Proposal ID: ${proposal.id}
- New Status: ${proposal.status.replace('_', ' ').toUpperCase()}
- Updated: ${this.formatDate(new Date())}

View proposal details: ${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/proposals/${proposal.id}

OpenProposal Platform - NISER`
    }

    return this.sendEmail(proposal.principalInvestigator.email, template)
  }

  // Template: Review assignment notification
  public async sendReviewAssignment(reviewer: EmailUser, proposal: EmailProposal, dueDate?: Date): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `New Review Assignment: ${proposal.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #8b5cf6; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">New Review Assignment</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You have been assigned to review a research proposal</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Dear ${reviewer.firstName || reviewer.name},</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              You have been assigned to review the following research proposal. Your expertise and insights are valuable to our review process.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
              <h3 style="margin: 0 0 15px 0; color: #333;">Proposal Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Title:</strong> ${proposal.title}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Principal Investigator:</strong> ${proposal.principalInvestigator.name}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Proposal ID:</strong> ${proposal.id}</p>
              ${proposal.totalBudget ? `<p style="margin: 5px 0; color: #666;"><strong>Budget:</strong> ${this.formatCurrency(proposal.totalBudget, proposal.currency)}</p>` : ''}
              ${dueDate ? `<p style="margin: 5px 0; color: #666;"><strong>Review Due:</strong> ${this.formatDate(dueDate)}</p>` : ''}
            </div>
            
            <h3 style="color: #333; margin: 25px 0 15px 0;">Review Guidelines</h3>
            <ul style="color: #666; line-height: 1.8; font-size: 15px;">
              <li>Evaluate the proposal based on scientific merit and methodology</li>
              <li>Consider the feasibility and innovation of the research</li>
              <li>Assess the budget justification and resource allocation</li>
              <li>Provide constructive feedback to help improve the proposal</li>
              <li>Submit your review before the deadline</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/reviews" 
                 style="background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Start Review
              </a>
            </div>
          </div>
          
          <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">OpenProposal Platform - NISER</p>
          </div>
        </div>
      `,
      text: `New Review Assignment: ${proposal.title}

Dear ${reviewer.firstName || reviewer.name},

You have been assigned to review the following research proposal. Your expertise and insights are valuable to our review process.

Proposal Details:
- Title: ${proposal.title}
- Principal Investigator: ${proposal.principalInvestigator.name}
- Proposal ID: ${proposal.id}
${proposal.totalBudget ? `- Budget: ${this.formatCurrency(proposal.totalBudget, proposal.currency)}\n` : ''}${dueDate ? `- Review Due: ${this.formatDate(dueDate)}\n` : ''}

Review Guidelines:
- Evaluate the proposal based on scientific merit and methodology
- Consider the feasibility and innovation of the research
- Assess the budget justification and resource allocation
- Provide constructive feedback to help improve the proposal
- Submit your review before the deadline

Start your review: ${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/reviews

OpenProposal Platform - NISER`
    }

    return this.sendEmail(reviewer.email, template)
  }

  // Template: Review submitted notification
  public async sendReviewSubmitted(review: EmailReview): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `Review Submitted: ${review.proposal.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #10b981; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Review Submitted</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your valuable review</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Dear ${review.reviewer.firstName || review.reviewer.name},</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Thank you for submitting your review. Your feedback is invaluable in maintaining the quality of our research funding process.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="margin: 0 0 15px 0; color: #333;">Review Summary</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Proposal:</strong> ${review.proposal.title}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Review ID:</strong> ${review.id}</p>
              ${review.score ? `<p style="margin: 5px 0; color: #666;"><strong>Score:</strong> ${review.score}/10</p>` : ''}
              <p style="margin: 5px 0; color: #666;"><strong>Submitted:</strong> ${this.formatDate(new Date())}</p>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 15px;">
              Your review will be considered along with other reviewers' assessments in making the final funding decision.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/reviews" 
                 style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View My Reviews
              </a>
            </div>
          </div>
          
          <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">OpenProposal Platform - NISER</p>
          </div>
        </div>
      `,
      text: `Review Submitted: ${review.proposal.title}

Dear ${review.reviewer.firstName || review.reviewer.name},

Thank you for submitting your review. Your feedback is invaluable in maintaining the quality of our research funding process.

Review Summary:
- Proposal: ${review.proposal.title}
- Review ID: ${review.id}
${review.score ? `- Score: ${review.score}/10\n` : ''}- Submitted: ${this.formatDate(new Date())}

Your review will be considered along with other reviewers' assessments in making the final funding decision.

View your reviews: ${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/reviews

OpenProposal Platform - NISER`
    }

    return this.sendEmail(review.reviewer.email, template)
  }

  // Template: Collaboration invitation
  public async sendCollaborationInvitation(inviter: EmailUser, invitee: EmailUser, proposal: EmailProposal): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `Collaboration Invitation: ${proposal.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #3b82f6; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Collaboration Invitation</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You've been invited to collaborate on a research proposal</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Dear ${invitee.firstName || invitee.name},</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              <strong>${inviter.firstName || inviter.name}</strong> has invited you to collaborate on the following research proposal:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h3 style="margin: 0 0 15px 0; color: #333;">Proposal Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Title:</strong> ${proposal.title}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Principal Investigator:</strong> ${proposal.principalInvestigator.name}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Invited by:</strong> ${inviter.name}</p>
              ${proposal.totalBudget ? `<p style="margin: 5px 0; color: #666;"><strong>Budget:</strong> ${this.formatCurrency(proposal.totalBudget, proposal.currency)}</p>` : ''}
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 15px;">
              As a collaborator, you'll be able to contribute to the proposal development, manage budget allocations, and participate in the research planning process.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/proposals/${proposal.id}" 
                 style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">
                View Proposal
              </a>
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/dashboard" 
                 style="background: #6b7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">OpenProposal Platform - NISER</p>
          </div>
        </div>
      `,
      text: `Collaboration Invitation: ${proposal.title}

Dear ${invitee.firstName || invitee.name},

${inviter.firstName || inviter.name} has invited you to collaborate on the following research proposal:

Proposal Details:
- Title: ${proposal.title}
- Principal Investigator: ${proposal.principalInvestigator.name}
- Invited by: ${inviter.name}
${proposal.totalBudget ? `- Budget: ${this.formatCurrency(proposal.totalBudget, proposal.currency)}\n` : ''}

As a collaborator, you'll be able to contribute to the proposal development, manage budget allocations, and participate in the research planning process.

View proposal: ${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/proposals/${proposal.id}
Dashboard: ${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/dashboard

OpenProposal Platform - NISER`
    }

    return this.sendEmail(invitee.email, template)
  }

  // Template: Deadline reminder
  public async sendDeadlineReminder(user: EmailUser, proposal: EmailProposal, deadline: Date, type: 'submission' | 'review'): Promise<boolean> {
    const daysUntilDeadline = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    const urgencyColor = daysUntilDeadline <= 3 ? '#ef4444' : daysUntilDeadline <= 7 ? '#f59e0b' : '#3b82f6'

    const template: EmailTemplate = {
      subject: `Deadline Reminder: ${proposal.title} (${daysUntilDeadline} days remaining)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${urgencyColor}; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Deadline Reminder</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">${daysUntilDeadline} days remaining</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Dear ${user.firstName || user.name},</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              This is a reminder that the ${type} deadline for the following proposal is approaching:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${urgencyColor};">
              <h3 style="margin: 0 0 15px 0; color: #333;">Deadline Information</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Proposal:</strong> ${proposal.title}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)} Deadline</p>
              <p style="margin: 5px 0; color: #666;"><strong>Due Date:</strong> ${this.formatDate(deadline)}</p>
              <p style="margin: 5px 0; color: ${urgencyColor}; font-weight: bold;"><strong>Time Remaining:</strong> ${daysUntilDeadline} days</p>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 15px;">
              ${type === 'submission' 
                ? 'Please ensure your proposal is complete and submitted before the deadline. Late submissions may not be considered.' 
                : 'Please complete your review and submit your evaluation before the deadline to ensure timely processing.'
              }
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/${type === 'submission' ? 'proposals' : 'reviews'}" 
                 style="background: ${urgencyColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                ${type === 'submission' ? 'Complete Proposal' : 'Submit Review'}
              </a>
            </div>
          </div>
          
          <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">OpenProposal Platform - NISER</p>
          </div>
        </div>
      `,
      text: `Deadline Reminder: ${proposal.title} (${daysUntilDeadline} days remaining)

Dear ${user.firstName || user.name},

This is a reminder that the ${type} deadline for the following proposal is approaching:

Deadline Information:
- Proposal: ${proposal.title}
- Type: ${type.charAt(0).toUpperCase() + type.slice(1)} Deadline
- Due Date: ${this.formatDate(deadline)}
- Time Remaining: ${daysUntilDeadline} days

${type === 'submission' 
  ? 'Please ensure your proposal is complete and submitted before the deadline. Late submissions may not be considered.' 
  : 'Please complete your review and submit your evaluation before the deadline to ensure timely processing.'
}

Access platform: ${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/${type === 'submission' ? 'proposals' : 'reviews'}

OpenProposal Platform - NISER`
    }

    return this.sendEmail(user.email, template)
  }

  // Method to test email configuration
  public async testEmailConfiguration(): Promise<boolean> {
    try {
      await this.transporter.verify()
      console.log('Email configuration is valid')
      return true
    } catch (error) {
      console.error('Email configuration error:', error)
      return false
    }
  }

  // Template: Call creation notification
  public async sendCallCreatedNotification(recipients: string[], callTitle: string, callDescription: string, programName: string, agencyName: string): Promise<boolean> {
    const emailContent = generateCallCreatedEmail(callTitle, callDescription, programName, agencyName)
    return this.sendEmail(recipients, emailContent)
  }
}

// Export singleton instance
export const emailService = new EmailService()
export default emailService

export function generateCallCreatedEmail(callTitle: string, callDescription: string, programName: string, agencyName: string) {
  const subject = `New Funding Call Created: ${callTitle}`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .call-details { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .btn { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Funding Call Created</h1>
            <p>A new funding opportunity is now available on the OpenProposal platform</p>
          </div>
          
          <div class="content">
            <div class="call-details">
              <h2>${callTitle}</h2>
              <p><strong>Program:</strong> ${programName}</p>
              <p><strong>Agency:</strong> ${agencyName}</p>
              <p><strong>Description:</strong></p>
              <p>${callDescription}</p>
            </div>
            
            <p>This funding call has been created and is available for proposals. Program officers and administrators have been notified.</p>
            
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/calls" class="btn">View All Calls</a>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from the OpenProposal platform.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
New Funding Call Created: ${callTitle}

Program: ${programName}
Agency: ${agencyName}

Description: ${callDescription}

This funding call has been created and is available for proposals.

View all calls at: ${process.env.NEXT_PUBLIC_BASE_URL}/calls

---
This is an automated notification from the OpenProposal platform.
  `

  return { subject, html, text }
}

// Get notification recipients for call events
export async function getCallNotificationRecipients(callId: string) {
  const { prisma } = await import('@/lib/prisma')
  
  try {
    // Get the call with related data
    const call = await prisma.callForProposal.findUnique({
      where: { id: callId },
      include: {
        fundingProgram: {
          include: {
            programOfficer: true,
            agency: true
          }
        },
        createdBy: true
      }
    })

    if (!call) return []

    // Get all admins and program officers
    const adminUsers = await prisma.user.findMany({
      where: {
        roles: {
          contains: 'SYSTEM_ADMIN'
        }
      },
      select: { email: true, name: true }
    })

    const programOfficers = await prisma.user.findMany({
      where: {
        roles: {
          contains: 'PROGRAM_OFFICER'
        }
      },
      select: { email: true, name: true }
    })

    // Combine and deduplicate
    const recipients = new Set<string>()
    
    // Add program officer for this specific program
    if (call.fundingProgram.programOfficer.email) {
      recipients.add(call.fundingProgram.programOfficer.email)
    }
    
    // Add system admins
    adminUsers.forEach(user => recipients.add(user.email))
    
    // Add all program officers for awareness
    programOfficers.forEach(user => recipients.add(user.email))

    return Array.from(recipients)
  } catch (error) {
    console.error('Error getting notification recipients:', error)
    return []
  }
}
