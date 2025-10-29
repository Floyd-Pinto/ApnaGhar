#!/bin/bash

# ApnaGhar Development Server Startup Script
# Works on Linux, macOS, and Windows (Git Bash/WSL)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   ApnaGhar Development Server${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Detect OS and get IP address
get_ip() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d'/' -f1 | head -n1)
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n1)
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows (Git Bash)
        IP=$(ipconfig | grep -i "IPv4" | head -n1 | awk '{print $NF}')
    else
        IP="127.0.0.1"
    fi
    echo "$IP"
}

# Get current IP
CURRENT_IP=$(get_ip)

if [ -z "$CURRENT_IP" ] || [ "$CURRENT_IP" == "127.0.0.1" ]; then
    echo -e "${YELLOW}⚠ Could not detect network IP. Using localhost.${NC}"
    CURRENT_IP="127.0.0.1"
fi

echo -e "${GREEN}✓ Detected IP: ${CURRENT_IP}${NC}"

# Update frontend .env file
ENV_FILE="${SCRIPT_DIR}/frontend/.env"

if [ -f "$ENV_FILE" ]; then
    # Update the IP in .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS (BSD sed)
        sed -i '' "s|VITE_API_BASE_URL=http://.*:8000|VITE_API_BASE_URL=http://${CURRENT_IP}:8000|g" "$ENV_FILE"
    else
        # Linux/Windows (GNU sed)
        sed -i "s|VITE_API_BASE_URL=http://.*:8000|VITE_API_BASE_URL=http://${CURRENT_IP}:8000|g" "$ENV_FILE"
    fi
    echo -e "${GREEN}✓ Updated frontend .env with IP: ${CURRENT_IP}${NC}\n"
else
    echo -e "${YELLOW}⚠ Creating frontend .env file...${NC}"
    cat > "$ENV_FILE" << EOF
# Backend API Configuration
VITE_API_BASE_URL=http://${CURRENT_IP}:8000

# App Configuration
VITE_APP_NAME=ApnaGhar
VITE_APP_VERSION=1.0.0

# Security Settings (for development)
VITE_ENABLE_DEVTOOLS=true
EOF
    echo -e "${GREEN}✓ Created .env file${NC}\n"
fi

# Display access URLs
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Access URLs:${NC}"
echo -e "  Frontend: ${YELLOW}http://${CURRENT_IP}:8080${NC}"
echo -e "  Backend:  ${YELLOW}http://${CURRENT_IP}:8000${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Display commands to run
echo -e "${BLUE}Run these commands in 2 separate terminals:${NC}\n"
echo -e "${GREEN}Terminal 1 (Backend):${NC}"
echo -e "  cd backend && source ../venv/bin/activate && python manage.py runserver 0.0.0.0:8000\n"
echo -e "${GREEN}Terminal 2 (Frontend):${NC}"
echo -e "  cd frontend && npm run dev\n"
echo -e "${BLUE}========================================${NC}"
