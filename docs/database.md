# Database Troubleshooting Guide

## Quick Reset Commands

### Using the Reset Script (Recommended)
```bash
./reset-db.sh              # Soft reset (preserves migrations)
./reset-db.sh hard         # Hard reset (deletes everything)
./reset-db.sh studio       # Open database browser
```

### Using npm Scripts
```bash
npm run db:reset           # Soft reset with migrations
npm run db:reset-hard      # Complete database deletion
npm run db:seed            # Repopulate with sample data
npm run db:studio          # Open Prisma Studio
```

## Common Issues & Solutions

### 1. "No data visible" or Empty Dashboard
**Cause**: Database not seeded or data got cleared

**Solution**:
```bash
npm run db:seed
```

### 2. "Failed to fetch reviews" Error
**Cause**: Not logged in or wrong user role

**Solution**:
```bash
# Login with reviewer credentials:
# Email: alice.reviewer@stanford.edu
# Password: reviewer123
```

### 3. Database Connection Errors
**Cause**: Wrong DATABASE_URL or missing database file

**Solution**:
```bash
# Check .env.local file
echo $DATABASE_URL

# For SQLite (default)
DATABASE_URL="file:./prisma/dev.db"

# Recreate database
npm run db:push
npm run db:seed
```

### 3. Schema Sync Issues
**Cause**: Prisma client out of sync with database schema

**Solution**:
```bash
npm run db:generate
npm run db:push
```

### 4. Corrupted Database State
**Cause**: Manual database modifications or failed migrations

**Solution**:
```bash
./reset-db.sh hard
```

### 5. Migration Errors
**Cause**: Schema changes conflict with existing data

**Solution**:
```bash
# If you don't need existing data
npx prisma migrate reset --force

# If you need to preserve data
npx prisma db push --force-reset
```

### 6. "Table doesn't exist" Errors
**Cause**: Database schema not created

**Solution**:
```bash
npx prisma db push
npm run db:seed
```

### 7. Prisma Client Generation Errors
**Cause**: Schema syntax errors or dependency issues

**Solution**:
```bash
# Check schema syntax
npx prisma validate

# Regenerate client
npm run db:generate
```

## Environment Configuration

### SQLite (Development - Default)
```env
DATABASE_URL="file:./prisma/dev.db"
```

### PostgreSQL (Production)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/openproposal"
```

## Database Inspection

### Prisma Studio (Visual Interface)
```bash
npm run db:studio
# Opens http://localhost:5555
```

### SQLite Command Line
```bash
sqlite3 prisma/dev.db
.tables
.schema proposals
.quit
```

## Sample Data Overview

The seed script creates:
- **30+ proposals** in various states
- **8 users** with different roles
- **2 institutions** (Stanford, MIT)
- **1 funding program** with active call
- **Multiple reviews** (complete and incomplete)
- **Budget items** with realistic data

### Default Credentials
- **System Admin**: `admin@example.com` / `password123`
- **Program Officer**: `program@nsf.gov` / `password123`
- **Principal Investigator**: `john@stanford.edu` / `password123`
- **Reviewer**: `reviewer@example.com` / `password123`

## Recovery Workflows

### After Git Pull
```bash
npm install
npm run db:generate
npm run db:push
```

### Fresh Development Setup
```bash
npm install
./reset-db.sh hard
npm run dev
```

### Production Deployment
```bash
npm run build
npx prisma migrate deploy
npm start
```

## Performance Tips

1. **Use Prisma Studio** for visual database inspection
2. **Reset regularly** during development to avoid data conflicts
3. **Use soft reset** unless you have schema conflicts
4. **Check .env.local** file for correct DATABASE_URL
5. **Run `npm run db:generate`** after any schema changes

## Need Help?

If these solutions don't work:

1. Check the application logs in the terminal
2. Verify your Node.js version (18+)
3. Ensure Prisma CLI is working: `npx prisma --version`
4. Try a complete restart: `./reset-db.sh hard && npm run dev`
