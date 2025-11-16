#!/bin/sh
set -e

if [ -n "$CHAINCODE_SERVER_ADDRESS" ]; then
    echo "Starting chaincode server on $CHAINCODE_SERVER_ADDRESS"
    node index.js
else
    echo "No CHAINCODE_SERVER_ADDRESS set, exiting"
    exit 1
fi
