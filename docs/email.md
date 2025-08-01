# Email Notification System

The OpenProposal platform includes a comprehensive email notification system that keeps users informed about important events and status changes in the research funding process.

## Overview

The email system is built using **Nodemailer** and configured to work with SMTP servers. It includes professionally designed HTML email templates with NISER branding and plain text alternatives for better compatibility.

## Configuration

### Environment Variables

Configure these environment variables in your `.env.local` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=openproposal@niser.ac.in
FROM_NAME=OpenProposal System
```

### SMTP Setup

The system supports various SMTP providers:
- **Gmail**: Use app-specific passwords
- **Outlook/Hotmail**: Enable SMTP in account settings
- **Custom SMTP**: Configure with your organization's email server

## Email Templates

The system includes the following email templates:

### 1. Welcome Email
- **Trigger**: User registration
- **Recipients**: New users
- **Content**: Welcome message with platform overview and next steps

### 2. Proposal Submission
- **Trigger**: Proposal submitted by PI
- **Recipients**: Principal Investigator
- **Content**: Confirmation of proposal submission with tracking details

### 3. Proposal Status Updates
- **Trigger**: Status changes (Under Review, Accepted, Rejected, etc.)
- **Recipients**: Principal Investigator
- **Content**: Status change notification with current proposal state

### 4. Review Assignment
- **Trigger**: Reviewer assigned to proposal (future feature)
- **Recipients**: Assigned reviewers
- **Content**: Assignment notification with proposal details and due date

### 5. Review Submission
- **Trigger**: Review submitted by reviewer
- **Recipients**: Principal Investigator
- **Content**: Notification that review has been completed

### 6. Collaboration Invitation
- **Trigger**: Collaboration request sent (future feature)
- **Recipients**: Invited collaborators
- **Content**: Invitation to collaborate on proposal

### 7. Deadline Reminders
- **Trigger**: Approaching deadlines (future feature)
- **Recipients**: Relevant users
- **Content**: Reminder about upcoming deadlines

## API Integration

### Current Integrations

The email service is currently integrated with:

1. **User Registration** (`/api/auth/register`)
   - Sends welcome email to new users

2. **Proposal Creation** (`/api/proposals`)
   - Sends confirmation email when proposal is submitted

3. **Proposal Updates** (`/api/proposals/[id]`)
   - Sends notification when proposal status changes

4. **Review Submission** (`/api/reviews`)
   - Notifies PI when review is completed

### Testing Email Functionality

Use the test endpoint to verify email configuration:

```bash
POST /api/test-email
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "emailType": "test",
  "recipientEmail": "test@example.com"
}
```

Available email types:
- `test`: Test email configuration
- `welcome`: Send sample welcome email

## Email Service Usage

### In API Routes

```typescript
import emailService from '@/lib/email'

// Send welcome email
await emailService.sendWelcomeEmail({
  name: user.name,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName
})

// Send proposal status update
await emailService.sendProposalStatusUpdate({
  id: proposal.id,
  title: proposal.title,
  status: proposal.status,
  principalInvestigator: {
    name: pi.name,
    email: pi.email,
    firstName: pi.firstName,
    lastName: pi.lastName
  }
})
```

### Error Handling

The email service includes comprehensive error handling:
- SMTP connection errors
- Invalid email addresses
- Template rendering issues
- Rate limiting

All email operations are designed to fail gracefully without affecting the main application flow.

## Email Templates Design

### HTML Templates
- Responsive design that works on all devices
- NISER branding with official colors and logos
- Professional layout with clear call-to-action buttons
- Consistent typography and spacing

### Plain Text Alternatives
- Full plain text versions for all HTML emails
- Maintains all important information and links
- Compatible with text-only email clients

## Security Considerations

1. **SMTP Credentials**: Store securely in environment variables
2. **Email Validation**: All recipient emails are validated
3. **Rate Limiting**: Prevent abuse and spam
4. **Template Injection**: All user data is properly escaped

## Future Enhancements

Planned email features:
1. **Review Assignment Notifications**: When reviewers are assigned
2. **Deadline Reminder System**: Automated reminders for approaching deadlines
3. **Collaboration Workflow**: Complete email flow for proposal collaborations
4. **Digest Emails**: Weekly/monthly summaries for active users
5. **Email Preferences**: User controls for email frequency and types

## Troubleshooting

### Common Issues

1. **SMTP Authentication Failed**
   - Verify SMTP credentials
   - Check if 2FA requires app-specific password
   - Ensure SMTP is enabled for the account

2. **Emails Not Sending**
   - Check network connectivity
   - Verify SMTP server settings
   - Review application logs for errors

3. **Emails Going to Spam**
   - Configure SPF/DKIM records
   - Use a reputable SMTP provider
   - Avoid spam trigger words in templates

### Debug Mode

Enable detailed logging by setting:
```env
EMAIL_DEBUG=true
```

This will log all email operations and SMTP interactions.

## Monitoring

Monitor email system health through:
- Application logs
- SMTP provider dashboards
- User feedback on email delivery
- Email bounce/delivery reports

## Best Practices

1. **Template Maintenance**: Regularly review and update email templates
2. **Testing**: Test email functionality after any changes
3. **Performance**: Use email queues for high-volume scenarios
4. **Compliance**: Follow email marketing regulations and user preferences
5. **Analytics**: Track email engagement and delivery rates

The email notification system enhances user experience by keeping stakeholders informed throughout the research funding lifecycle, ensuring transparency and timely communication in the proposal review process.
