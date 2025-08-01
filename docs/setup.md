# OpenProposal Platform - Development Setup Guide

A comprehensive research proposal submission and review platform (similar to OpenReview.net) designed specifically for research funding applications.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Default Users](#default-users)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

## 🔧 Prerequisites

Before setting up the OpenProposal platform, ensure you have the following installed:

### Required Software

1. **Node.js** (v18.0.0 or higher)
   ```bash
   # Check your version
   node --version
   npm --version
   ```
   Download from: https://nodejs.org/

2. **Git**
   ```bash
   # Check your version
   git --version
   ```
   Download from: https://git-scm.com/

### Optional (for Production)

- **PostgreSQL** (v13 or higher) - for production deployments
- **Redis** - for caching and session management
- **Docker** - for containerized deployment

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd openproposal
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15.3.5 (React framework)
- Prisma (Database ORM)
- Tailwind CSS (Styling)
- TypeScript (Type safety)
- NextAuth.js (Authentication)
- And many more...

## 🗄️ Database Setup

The platform uses SQLite for development (easy setup) and supports PostgreSQL for production.

### SQLite Setup (Development - Recommended)

1. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

2. **Run Database Migrations**
   ```bash
   npx prisma db push
   ```

3. **Seed the Database with Sample Data**
   ```bash
   npx prisma db seed
   ```

### PostgreSQL Setup (Production)

1. **Install PostgreSQL**
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql postgresql-contrib`
   - Windows: Download from https://www.postgresql.org/

2. **Create Database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE openproposal;
   CREATE USER openproposal_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE openproposal TO openproposal_user;
   \q
   ```

3. **Update Database URL in .env**
   ```
   DATABASE_URL="postgresql://openproposal_user:your_password@localhost:5432/openproposal"
   ```

4. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

## ⚙️ Environment Configuration

### 1. Create Environment File

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your settings:

```env
# Database
DATABASE_URL="file:./dev.db"  # SQLite for development
# DATABASE_URL="postgresql://user:password@localhost:5432/openproposal"  # PostgreSQL for production

# Authentication
NEXTAUTH_SECRET="your-super-secret-jwt-key-here"
NEXTAUTH_URL="http://localhost:3001"

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@openproposal.org"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"  # 10MB

# Redis (Optional - for production)
REDIS_URL="redis://localhost:6379"

# Application
NODE_ENV="development"
PORT="3001"
```

### 3. Generate JWT Secret

```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at: http://localhost:3001

### Production Mode

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 👥 Default Users

After seeding the database, you can log in with these default accounts:

### System Administrator
- **Email**: `admin@university.edu`
- **Password**: `admin123`
- **Role**: System Admin (full access)

### Program Officer
- **Email**: `program.officer@nsf.gov`
- **Password**: `officer123`
- **Role**: Program Officer

### Principal Investigator
- **Email**: `john.pi@university.edu`
- **Password**: `pi123`
- **Role**: Principal Investigator

### Reviewer
- **Email**: `alice.reviewer@stanford.edu`
- **Password**: `reviewer123`
- **Role**: Reviewer

### Area Chair
- **Email**: `chair@mit.edu`
- **Password**: `chair123`
- **Role**: Area Chair

## 📁 Project Structure

```
openproposal/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── proposals/         # Proposal management
│   │   ├── public/            # Public venues (OpenReview-style)
│   │   └── reviews/           # Review system
│   ├── components/            # Reusable React components
│   ├── lib/                   # Utility functions and configurations
│   └── middleware.ts          # Next.js middleware
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts               # Database seeding script
│   └── migrations/           # Database migrations
├── public/                   # Static assets
├── uploads/                  # File uploads (created automatically)
└── .env                     # Environment variables
```

## 🔄 Development Workflow

### 1. Database Changes

When you modify the database schema:

```bash
# Update the schema
npx prisma db push

# Reset and reseed (if needed)
npx prisma migrate reset
npx prisma db seed
```

### 2. Adding New Features

1. Create API routes in `src/app/api/`
2. Create pages in `src/app/`
3. Add components in `src/components/`
4. Update database schema in `prisma/schema.prisma`
5. Test your changes

### 3. Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 3001
   lsof -ti:3001 | xargs kill -9
   ```

2. **Database connection errors**
   ```bash
   # Reset database
   rm prisma/dev.db
   npx prisma db push
   npx prisma db seed
   ```

3. **Node modules issues**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Build errors**
   ```bash
   # Clean Next.js cache
   rm -rf .next
   npm run build
   ```

### Database Issues

- **SQLite locked**: Close any database viewers and restart the app
- **Migration errors**: Run `npx prisma migrate reset` to start fresh
- **Seed errors**: Check that all required fields are provided in seed data

### Authentication Issues

- Ensure `NEXTAUTH_SECRET` is set in `.env`
- Check that user roles are properly seeded
- Verify JWT tokens are being generated correctly

## 🚀 Production Deployment

### Environment Setup

1. **Use PostgreSQL** instead of SQLite
2. **Set secure environment variables**
3. **Configure proper CORS settings**
4. **Set up file storage** (AWS S3, etc.)
5. **Configure email service** (SendGrid, etc.)

### Deployment Platforms

#### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

#### Docker
```dockerfile
# Use the provided Dockerfile
docker build -t openproposal .
docker run -p 3001:3001 openproposal
```

#### Traditional Server
```bash
# Build and start
npm run build
npm start
```

### Security Considerations

- Use strong JWT secrets
- Enable HTTPS in production
- Set up proper CORS policies
- Configure rate limiting
- Set up monitoring and logging
- Regular security updates

## 📧 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review the console logs
3. Check the database connection
4. Verify environment variables
5. Create an issue in the repository

## 🔗 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [NextAuth.js](https://next-auth.js.org/)

---

**Happy coding! 🎉**

The OpenProposal platform provides a comprehensive solution for research funding management with transparency and collaboration at its core.
