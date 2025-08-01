# Gmail SMTP Setup for OpenProposal

## Overview
Since `openproposal@niser.ac.in` is a Google Workspace account, we need to configure Gmail's SMTP settings for sending emails from the OpenProposal platform.

## Configuration Steps

### 1. Environment Variables
Your `.env.local` is now configured with Gmail SMTP settings:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=openproposal@niser.ac.in
SMTP_PASS=your-app-password-here
FROM_EMAIL=openproposal@niser.ac.in
FROM_NAME=OpenProposal System
```

### 2. Gmail App Password Setup

Since this is a Google Workspace account, you'll need to set up an **App Password**:

#### For Google Workspace (NISER domain):

1. **Sign in** to the Google Workspace account: `openproposal@niser.ac.in`

2. **Go to Google Account settings**: https://myaccount.google.com/

3. **Navigate to Security** → **2-Step Verification**
   - If 2-Step Verification is not enabled, enable it first
   - This is required for App Passwords

4. **Generate App Password**:
   - Go to **Security** → **2-Step Verification** → **App passwords**
   - Select **Mail** as the app
   - Select **Other (custom name)** as the device
   - Enter: "OpenProposal Platform"
   - Click **Generate**

5. **Copy the 16-character password** (format: xxxx-xxxx-xxxx-xxxx)

6. **Update your `.env.local`**:
   ```env
   SMTP_PASS=your-16-character-app-password
   ```

#### Alternative: OAuth2 (More Secure)
For production environments, consider using OAuth2 instead of app passwords for better security.

### 3. Google Workspace Admin Settings

If you're the Google Workspace admin for NISER domain, ensure:

1. **SMTP is enabled** for the domain
2. **Less secure app access** is configured appropriately
3. **IMAP/SMTP** is enabled for the `openproposal@niser.ac.in` account

### 4. Testing the Configuration

Once you've set up the app password, test the email configuration:

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test email functionality** using the test endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/test-email \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -d '{"emailType": "test"}'
   ```

### 5. Gmail SMTP Limits

Be aware of Gmail's sending limits:
- **Daily limit**: 2,000 emails per day for Google Workspace
- **Rate limit**: ~100 emails per hour
- **Recipients**: Max 500 recipients per email

### 6. Troubleshooting

#### Common Issues:

1. **"Username and password not accepted"**
   - Verify the app password is correct (16 characters, no spaces)
   - Ensure 2-Step Verification is enabled
   - Check that the email account exists and is active

2. **"Less secure app blocked"**
   - Use App Password instead of regular password
   - Enable 2-Step Verification first

3. **"SMTP Authentication failed"**
   - Double-check SMTP settings (host: smtp.gmail.com, port: 587)
   - Verify the email address is correct
   - Ensure the account has SMTP access enabled

4. **"Connection timeout"**
   - Check network/firewall settings
   - Verify port 587 is not blocked
   - Try port 465 with SMTP_SECURE=true if needed

#### Debug Mode:
Enable detailed logging by adding to `.env.local`:
```env
EMAIL_DEBUG=true
```

### 7. Security Best Practices

1. **Keep App Password secure**: Never commit it to version control
2. **Rotate passwords regularly**: Generate new app passwords periodically
3. **Monitor usage**: Check Google account activity for unusual email sending
4. **Use environment variables**: Always store credentials in `.env.local`

### 8. Production Considerations

For production deployment:
- Use OAuth2 authentication instead of app passwords
- Consider using a dedicated email service (SendGrid, Mailgun, etc.)
- Implement email queuing for high-volume scenarios
- Monitor email delivery rates and bounces

## Gmail SMTP Settings Summary

| Setting | Value |
|---------|-------|
| SMTP Server | `smtp.gmail.com` |
| Port | `587` (STARTTLS) or `465` (SSL) |
| Security | STARTTLS (recommended) |
| Authentication | App Password |
| Username | `openproposal@niser.ac.in` |
| Password | Your 16-character app password |

This configuration will enable the OpenProposal platform to send professional emails through the NISER Google Workspace account while maintaining security and reliability.
