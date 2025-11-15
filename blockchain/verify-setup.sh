#!/bin/bash

# ApnaGhar Blockchain Verification Script
# Checks if blockchain setup is correct

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Verifying ApnaGhar Blockchain Setup"
echo "======================================="
echo ""

ERRORS=0
WARNINGS=0

# Check .env file
echo "Checking environment configuration..."
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    
    # Check Pinata
    if grep -q "PINATA_API_KEY=" backend/.env && ! grep -q "PINATA_API_KEY=your_pinata_api_key_here" backend/.env; then
        echo -e "${GREEN}✓ Pinata API key configured${NC}"
    else
        echo -e "${RED}✗ Pinata API key not configured${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "PINATA_API_SECRET=" backend/.env && ! grep -q "PINATA_API_SECRET=your_pinata_secret_here" backend/.env; then
        echo -e "${GREEN}✓ Pinata API secret configured${NC}"
    else
        echo -e "${RED}✗ Pinata API secret not configured${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗ .env file not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check chaincode
echo ""
echo "Checking chaincode..."
if [ -d "blockchain/chaincode/apnaghar-contract" ]; then
    echo -e "${GREEN}✓ Chaincode directory exists${NC}"
    
    if [ -f "blockchain/chaincode/apnaghar-contract/index.js" ]; then
        echo -e "${GREEN}✓ Chaincode file exists${NC}"
    else
        echo -e "${RED}✗ Chaincode file not found${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ -d "blockchain/chaincode/apnaghar-contract/node_modules" ]; then
        echo -e "${GREEN}✓ Chaincode dependencies installed${NC}"
    else
        echo -e "${YELLOW}⚠ Chaincode dependencies not installed${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗ Chaincode directory not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check Python dependencies
echo ""
echo "Checking Python dependencies..."
cd backend
if python -c "import requests" 2>/dev/null; then
    echo -e "${GREEN}✓ requests module available${NC}"
else
    echo -e "${RED}✗ requests module not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

if python -c "import hfc" 2>/dev/null; then
    echo -e "${GREEN}✓ Fabric SDK available${NC}"
else
    echo -e "${YELLOW}⚠ Fabric SDK not installed (optional)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
cd ..

# Check database migrations
echo ""
echo "Checking database..."
cd backend
if python manage.py showmigrations blockchain 2>/dev/null | grep -q "\[X\]"; then
    echo -e "${GREEN}✓ Blockchain migrations applied${NC}"
else
    echo -e "${YELLOW}⚠ Blockchain migrations not applied${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
cd ..

# Check Fabric network (optional)
echo ""
echo "Checking Fabric network (optional)..."
if docker ps 2>/dev/null | grep -q "peer0.org1"; then
    echo -e "${GREEN}✓ Fabric network is running${NC}"
else
    echo -e "${YELLOW}⚠ Fabric network not running (optional)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Setup complete with $WARNINGS warning(s)${NC}"
    echo -e "${YELLOW}  Blockchain will work with IPFS only${NC}"
    exit 0
else
    echo -e "${RED}✗ Found $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
    exit 1
fi

