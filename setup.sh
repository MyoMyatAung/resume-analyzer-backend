#!/bin/bash

# Resume Analyzer Backend - Setup Script
# Run this script to set up and run the backend locally

set -e

echo "========================================="
echo "Resume Analyzer Backend Setup"
echo "========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

echo "Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed."
    exit 1
fi

echo "npm version: $(npm --version)"

# Navigate to project directory
cd "$(dirname "$0")"
PROJECT_DIR=$(pwd)
echo "Project directory: $PROJECT_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found in $PROJECT_DIR"
    exit 1
fi

echo ""
echo "Step 1: Installing dependencies..."
echo "========================================="
npm install

echo ""
echo "Step 2: Generating Prisma client..."
echo "========================================="
npx prisma generate

echo ""
echo "Step 3: Setting up environment variables..."
echo "========================================="
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "Created .env from .env.example"
        echo "IMPORTANT: Please edit .env with your actual credentials!"
    else
        echo "Warning: .env.example not found"
    fi
else
    echo ".env file already exists"
fi

echo ""
echo "Step 4: Checking database connection..."
echo "========================================="
echo "Make sure PostgreSQL is running and DATABASE_URL is configured in .env"

echo ""
echo "Step 5: Running database migrations..."
echo "========================================="
read -p "Do you want to run database migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate dev
fi

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "To start the development server:"
echo "  npm run start:dev"
echo ""
echo "To build for production:"
echo "  npm run build"
echo ""
echo "API will be available at:"
echo "  - API: http://localhost:3000"
echo "  - Swagger Docs: http://localhost:3000/api/docs"
echo ""
echo "IMPORTANT: Edit .env with your actual credentials before running!"
