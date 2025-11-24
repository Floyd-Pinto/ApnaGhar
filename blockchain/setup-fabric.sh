#!/bin/bash
set -e

# Install Hyperledger Fabric binaries and samples
# We will use the official install script but limit it to the test-network and binaries

echo "Downloading Hyperledger Fabric install script..."
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh

echo "Installing Fabric (Docker images and Binaries)..."
# -d: download docker images
# -b: download binaries
# -s: download samples
./install-fabric.sh --fabric-version 2.5.4 --ca-version 1.5.7 d b s

echo "Fabric installation complete."
