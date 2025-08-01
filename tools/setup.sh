#!/bin/bash

# OpenProposal Platform - Quick Setup Script
# This script helps you quickly set up the development environment

set -e  # Exit on any error

echo "🚀 OpenProposal Platform - Quick Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
print_success "Node.js $NODE_VERSION found"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm"
    exit 1
fi

NPM_VERSION=$(npm -v)
print_success "npm $NPM_VERSION found"

# Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    
    # Generate a random JWT secret
    print_status "Generating JWT secret..."
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    # Update the .env file with the generated secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-super-secret-jwt-key-minimum-32-characters-long/$JWT_SECRET/" .env
    else
        # Linux
        sed -i "s/your-super-secret-jwt-key-minimum-32-characters-long/$JWT_SECRET/" .env
    fi
    
    print_success ".env file created with generated JWT secret"
    print_warning "Please review and update other settings in .env file as needed"
else
    print_warning ".env file already exists, skipping creation"
fi

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate
if [ $? -eq 0 ]; then
    print_success "Prisma client generated"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Set up database
print_status "Setting up database..."
npx prisma db push
if [ $? -eq 0 ]; then
    print_success "Database schema applied"
else
    print_error "Failed to apply database schema"
    exit 1
fi

# Seed database
print_status "Seeding database with sample data..."
npx prisma db seed
if [ $? -eq 0 ]; then
    print_success "Database seeded successfully"
else
    print_warning "Database seeding failed or was skipped"
fi

# Create uploads directory
print_status "Creating uploads directory..."
mkdir -p uploads
print_success "Uploads directory created"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Review the .env file and update any necessary settings"
echo "   2. Run 'npm run dev' to start the development server"
echo "   3. Open http://localhost:3001 in your browser"
echo ""
echo "👥 Default login credentials:"
echo "   Admin: admin@university.edu / admin123"
echo "   PI: john.pi@university.edu / pi123"
echo "   Reviewer: alice.reviewer@stanford.edu / reviewer123"
echo ""
echo "📚 For more information, see SETUP.md"
echo ""
print_success "Happy coding! 🚀"
