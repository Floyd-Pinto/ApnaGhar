#!/bin/sh
set -e
export CHAINCODE_SERVER_ADDRESS=0.0.0.0:9999
export CHAINCODE_ID=test
export CORE_CHAINCODE_ID_NAME=test
echo "Starting chaincode server..."
node index.js
