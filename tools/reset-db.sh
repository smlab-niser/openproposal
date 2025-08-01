#!/bin/bash

# Database Reset Script for OpenProposal Platform
# Usage: ./reset-db.sh [option]
# Options: soft, hard, studio

set -e  # Exit on any error

echo "🔄 OpenProposal Database Reset Utility"
echo "======================================"

# Default to soft reset if no argument provided
RESET_TYPE=${1:-soft}

case $RESET_TYPE in
  "soft")
    echo "🔧 Performing soft reset (with migrations)..."
    npm run db:reset
    ;;
  "hard")
    echo "💥 Performing hard reset (delete + recreate)..."
    # Kill any running servers that might lock the database
    pkill -f "next dev" || true
    sleep 2
    # Remove all potential database files
    rm -f prisma/dev.db prisma/dev.db-* dev.db
    rm -rf prisma/prisma/
    npm run db:reset-hard
    ;;
  "studio")
    echo "🎨 Opening Prisma Studio..."
    npm run db:studio
    ;;
  "help")
    echo ""
    echo "Usage: ./reset-db.sh [option]"
    echo ""
    echo "Options:"
    echo "  soft    - Reset with migrations (recommended)"
    echo "  hard    - Complete database deletion and recreation"
    echo "  studio  - Open Prisma Studio database browser"
    echo "  help    - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./reset-db.sh           # Soft reset (default)"
    echo "  ./reset-db.sh hard      # Hard reset"
    echo "  ./reset-db.sh studio    # Open database browser"
    exit 0
    ;;
  *)
    echo "❌ Unknown option: $RESET_TYPE"
    echo "Use './reset-db.sh help' for usage information"
    exit 1
    ;;
esac

echo ""
echo "✅ Database reset completed!"
echo "🚀 You can now run 'npm run dev' to start the application"
echo ""
echo "📊 Default login credentials:"
echo "   System Admin: admin@example.com / password123"
echo "   Program Officer: program@nsf.gov / password123"
echo "   Sample PI: john@stanford.edu / password123"
echo ""
