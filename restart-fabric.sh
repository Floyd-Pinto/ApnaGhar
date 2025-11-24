#!/bin/bash

# Docker Cleanup and Fabric Network Restart Script
# This script stops all containers, cleans up Docker, and restarts the Fabric network

echo "🧹 Starting Docker Cleanup and Fabric Network Restart..."
echo ""

# Navigate to test-network directory
cd blockchain/fabric-samples/test-network || exit 1

echo "📦 Step 1: Stopping Fabric network..."
./network.sh down
echo "✅ Fabric network stopped"
echo ""

echo "🐳 Step 2: Stopping all Docker containers..."
docker stop $(docker ps -aq) 2>/dev/null || echo "No running containers to stop"
echo "✅ All containers stopped"
echo ""

echo "🗑️  Step 3: Removing all Docker containers..."
docker rm $(docker ps -aq) 2>/dev/null || echo "No containers to remove"
echo "✅ All containers removed"
echo ""

echo "🧼 Step 4: Cleaning up Docker volumes..."
docker volume prune -f
echo "✅ Docker volumes cleaned"
echo ""

echo "🧼 Step 5: Cleaning up Docker networks..."
docker network prune -f
echo "✅ Docker networks cleaned"
echo ""

echo "🧼 Step 6: Removing unused Docker images (optional)..."
# Uncomment the next line if you want to remove unused images
# docker image prune -a -f
echo "⏭️  Skipped (uncomment in script to enable)"
echo ""

echo "🚀 Step 7: Starting Fabric network with channel 'apnaghar'..."
./network.sh up createChannel -c apnaghar -ca
echo "✅ Fabric network started"
echo ""

echo "📋 Step 8: Deploying chaincode..."
cd ../../..
./blockchain/fabric-samples/test-network/deploy-upgrade.sh
echo "✅ Chaincode deployed"
echo ""

echo "🔧 Step 9: Starting Blockchain API..."
echo "Please run in a separate terminal:"
echo "  cd blockchain/api && node app.js"
echo ""

echo "✨ Docker Cleanup and Network Restart Complete!"
echo ""
echo "Summary:"
echo "  ✅ All Docker containers stopped and removed"
echo "  ✅ Docker volumes and networks cleaned"
echo "  ✅ Fabric network restarted with channel 'apnaghar'"
echo "  ✅ Chaincode deployed"
echo ""
echo "Next steps:"
echo "  1. Start blockchain API: cd blockchain/api && node app.js"
echo "  2. Verify network: docker ps"
echo "  3. Test API: curl http://localhost:3000/api/v1/property"
echo ""
echo "Current Docker containers:"
docker ps
