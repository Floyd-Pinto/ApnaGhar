#!/bin/bash

# ApnaGhar Blockchain Setup Script
# This script helps set up the blockchain component

set -e

echo "🚀 ApnaGhar Blockchain Setup"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "backend/manage.py" ]; then
    echo -e "${RED}Error: Please run this script from the ApnaGhar root directory${NC}"
    exit 1
fi

# Step 1: Install chaincode dependencies
echo -e "${YELLOW}Step 1: Installing chaincode dependencies...${NC}"
if [ -d "blockchain/chaincode/apnaghar-contract" ]; then
    cd blockchain/chaincode/apnaghar-contract
    if [ ! -d "node_modules" ]; then
        npm install
        echo -e "${GREEN}✓ Chaincode dependencies installed${NC}"
    else
        echo -e "${GREEN}✓ Chaincode dependencies already installed${NC}"
    fi
    cd ../../..
else
    echo -e "${RED}✗ Chaincode directory not found${NC}"
fi

# Step 2: Check backend .env file
echo ""
echo -e "${YELLOW}Step 2: Checking environment configuration...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from example...${NC}"
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✓ Created .env file from example${NC}"
        echo -e "${YELLOW}⚠ Please edit backend/.env and add your Pinata credentials!${NC}"
    else
        echo -e "${RED}✗ .env.example not found${NC}"
    fi
else
    echo -e "${GREEN}✓ .env file exists${NC}"
    
    # Check if Pinata credentials are set
    if grep -q "PINATA_API_KEY=your_pinata_api_key_here" backend/.env || ! grep -q "PINATA_API_KEY=" backend/.env; then
        echo -e "${YELLOW}⚠ Pinata credentials not configured in .env${NC}"
        echo -e "${YELLOW}  Please add PINATA_API_KEY and PINATA_API_SECRET${NC}"
    else
        echo -e "${GREEN}✓ Pinata credentials configured${NC}"
    fi
fi

# Step 3: Run database migrations
echo ""
echo -e "${YELLOW}Step 3: Running database migrations...${NC}"
cd backend
if python manage.py makemigrations blockchain --dry-run | grep -q "No changes"; then
    echo -e "${GREEN}✓ No new migrations needed${NC}"
else
    python manage.py makemigrations blockchain
    echo -e "${GREEN}✓ Created migrations${NC}"
fi

python manage.py migrate blockchain
echo -e "${GREEN}✓ Migrations applied${NC}"
cd ..

# Step 4: Check Python dependencies
echo ""
echo -e "${YELLOW}Step 4: Checking Python dependencies...${NC}"
cd backend
if python -c "import requests" 2>/dev/null; then
    echo -e "${GREEN}✓ requests module available${NC}"
else
    echo -e "${YELLOW}⚠ requests module not found. Installing...${NC}"
    pip install requests
fi

# Check if fabric-sdk-py is available (optional)
if python -c "import hfc" 2>/dev/null; then
    echo -e "${GREEN}✓ Fabric SDK available${NC}"
else
    echo -e "${YELLOW}⚠ Fabric SDK not installed (optional)${NC}"
    echo -e "${YELLOW}  IPFS will work, but blockchain storage will be skipped${NC}"
fi
cd ..

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure Pinata credentials in backend/.env"
echo "   - Get API key from https://pinata.cloud"
echo "   - Add PINATA_API_KEY and PINATA_API_SECRET"
echo ""
echo "2. (Optional) Set up Hyperledger Fabric:"
echo "   - See blockchain/DEPLOYMENT_GUIDE.md"
echo ""
echo "3. Start the backend:"
echo "   cd backend && python manage.py runserver"
echo ""
echo "4. Test IPFS upload:"
echo "   - Go to any project page"
echo "   - Click 'Blockchain' tab"
echo "   - Upload a test file"
echo ""

