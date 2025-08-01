# Login Credentials Reference

Quick access to all test accounts for the OpenProposal platform.

## 🔑 Default Test Accounts

### System Administration
```
Email: admin@university.edu
Password: admin123
Role: SYSTEM_ADMIN
Access: Full platform management, analytics, user management
```

### Program Management
```
Email: program@nsf.gov
Password: officer123
Role: PROGRAM_OFFICER
Access: Create funding calls, manage reviews, view analytics
```

### Principal Investigator
```
Email: john.pi@university.edu
Password: pi123
Role: PRINCIPAL_INVESTIGATOR
Access: Submit proposals, manage collaborations, track applications
```

### Reviewer
```
Email: alice.reviewer@stanford.edu
Password: reviewer123
Role: REVIEWER, AREA_CHAIR
Access: Review assigned proposals, score submissions, provide feedback
```

## 🚀 Quick Testing Scenarios

### Test the Reviews System
1. Login as: `alice.reviewer@stanford.edu` / `reviewer123`
2. Navigate to `/reviews`
3. View assigned proposals and submit reviews

### Test Proposal Submission
1. Login as: `john.pi@university.edu` / `pi123`
2. Navigate to `/proposals/new`
3. Create and submit a new proposal

### Test Administrative Features
1. Login as: `admin@university.edu` / `admin123`
2. Navigate to `/analytics`
3. View platform analytics and user management

### Test Program Management
1. Login as: `program@nsf.gov` / `officer123`
2. Navigate to `/calls`
3. Create new funding calls and manage reviews

## 🔧 Troubleshooting Login Issues

### "Failed to fetch reviews" Error
- **Cause**: Not logged in as a reviewer
- **Solution**: Login with `alice.reviewer@stanford.edu` / `reviewer123`

### "Access denied" Messages
- **Cause**: Wrong user role for the feature
- **Solution**: Use the appropriate account for each feature (see above)

### Authentication Failures
- **Cause**: Expired or invalid token
- **Solution**: Clear browser storage and login again

## 📊 Sample Data Overview

When logged in as a reviewer, you'll see:
- **12+ review assignments** across different proposals
- **Mixed status reviews** (pending, completed, overdue)
- **Various proposal types** (AI, Climate, Drug Discovery, etc.)
- **Realistic deadlines** and scoring data

The system includes complete proposal data with:
- Multiple proposal statuses (submitted, under review, accepted, rejected)
- Budget information and institutional affiliations
- Review criteria and scoring rubrics
- Collaborative relationships between researchers
